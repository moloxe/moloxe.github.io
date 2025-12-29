// TODO: Esto tiene potencial

// 1. Pedir GPU (Deno ya lo tiene integrado)
const adapter = await navigator.gpu.requestAdapter()
if (!adapter) {
  console.error('❌ Error: No se encontró adaptador gráfico (GPU).')
  Deno.exit(1)
}
const device = await adapter.requestDevice()

console.log(
  `✅ GPU Detectada: ${adapter.info.vendor} - ${adapter.info.architecture}`
)

// 2. Datos de entrada (Input)
const input = new Float32Array([10, 20, 30, 40])
console.log('Input:', input)

// 3. Buffers
const storageBuffer = device.createBuffer({
  size: input.byteLength,
  usage:
    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  mappedAtCreation: true,
})
new Float32Array(storageBuffer.getMappedRange()).set(input)
storageBuffer.unmap()

const resultBuffer = device.createBuffer({
  size: input.byteLength,
  usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
})

// 4. Shader WGSL
const shaderModule = device.createShaderModule({
  code: `
    @group(0) @binding(0)
    var<storage, read_write> data: array<f32>;

    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
        if (global_id.x >= arrayLength(&data)) { return; }
        // Multiplicamos por 2
        data[global_id.x] = data[global_id.x] * 2.0;
    }
    `,
})

// 5. Pipeline
const pipeline = device.createComputePipeline({
  layout: 'auto',
  compute: { module: shaderModule, entryPoint: 'main' },
})

const bindGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [{ binding: 0, resource: { buffer: storageBuffer } }],
})

// 6. Ejecutar
const commandEncoder = device.createCommandEncoder()
const passEncoder = commandEncoder.beginComputePass()
passEncoder.setPipeline(pipeline)
passEncoder.setBindGroup(0, bindGroup)
passEncoder.dispatchWorkgroups(Math.ceil(input.length / 64))
passEncoder.end()

commandEncoder.copyBufferToBuffer(
  storageBuffer,
  0,
  resultBuffer,
  0,
  input.byteLength
)
device.queue.submit([commandEncoder.finish()])

// 7. Leer resultados
await resultBuffer.mapAsync(GPUMapMode.READ)
const result = new Float32Array(resultBuffer.getMappedRange())

console.log('Output (x2):', result)

// Limpieza
resultBuffer.unmap()
