import type {
  RenderProps,
  RTCamera,
  RTMaterialFuncs,
  RTMaterialPartial,
  RTTex,
} from './types'
import getRender from './device/get-render'
import getDevice from './device/get-device'
import RTMaterial from './utils/rt-material'
import RTCollision from './utils/rt-collision'
import RTUniform from './utils/rt-uniform'
import RTLoop from './utils/rt-loop'
import { dumbFsCanvas } from './utils/utils'
import RTTexture from './utils/rt-texture'

type Props = {
  height?: number
  main?: string
  functions?: string
  texs?: RTTex[]
  usePrevFrameTex?: boolean
  useInterlacing?: boolean
  fps?: number
  showFps?: boolean
}

class ReTina {
  canvas: HTMLCanvasElement
  private main?: string
  private functions?: string
  private render?: (props: RenderProps) => void
  private initalCustomUniforms: { [key: string]: number } = {}
  private setUniform?: (name: string, value: number) => void
  private materialFuncs: RTMaterialFuncs[] = []
  private usePrevFrameTex?: boolean
  private useInterlacing?: boolean
  private setDeviceTexure?: (index: number, textureData: Uint8Array) => void
  private texs: RTTex[]
  private fps?: number
  private showFps?: boolean
  private rtCollision?: RTCollision
  private rtUniform?: RTUniform

  camera: RTCamera = {
    pos: { x: 0, y: 0, z: 0 },
    spherical: { radius: 0, theta: 0, phi: 0 },
    fov: 90,
  }

  constructor({
    main,
    functions,
    texs,
    usePrevFrameTex,
    useInterlacing,
    fps,
    height,
    showFps,
  }: Props = {}) {
    this.canvas = dumbFsCanvas(height)
    this.main = main
    this.functions = functions
    this.texs = texs ?? []
    this.useInterlacing = useInterlacing
    this.usePrevFrameTex = this.useInterlacing || usePrevFrameTex
    this.fps = fps
    this.showFps = showFps
  }

  registerMaterial(partialMaterial: RTMaterialPartial) {
    if (this.render) throw new Error('Render already built')
    const index = this.materialFuncs.length
    const material = new RTMaterial({
      rt: this,
      material: partialMaterial,
      index,
    })
    this.materialFuncs.push({
      sdFunc: partialMaterial.sdFunc,
      lightFunc: partialMaterial.lightFunc,
    })
    return material
  }

  setTex(index: number, textureData: Uint8Array) {
    if (!this.setDeviceTexure) throw new Error('Render not built')
    this.setDeviceTexure(index, textureData)
  }

  registerUniform(name: string, value?: number) {
    if (this.render) throw new Error('Render already built')
    this.initalCustomUniforms[name] = value ?? 0
    const setter = (value: number) => {
      if (!this.setUniform) throw new Error('Render not built')
      this.setUniform(name, value)
      this.initalCustomUniforms[name] = value
    }
    return setter
  }

  private async build() {
    const { device, presentationFormat } = await getDevice()

    const context = this.canvas.getContext('webgpu')

    if (!context) {
      throw new Error('No context found')
    }

    context.configure({
      device,
      format: presentationFormat,
      alphaMode: 'opaque',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
    })

    const rtUniform = new RTUniform(device, {
      frame: 0,
      time: 0,
      aspectRatio: this.canvas.width / this.canvas.height,
      width: this.canvas.width,
      height: this.canvas.height,
      camPosX: this.camera.pos.x ?? 0,
      camPosY: this.camera.pos.y ?? 0,
      camPosZ: this.camera.pos.z ?? 0,
      camSphericalR: this.camera.spherical.radius ?? 0,
      camSphericalT: this.camera.spherical.theta ?? 0,
      camSphericalP: this.camera.spherical.phi ?? 0,
      camFov: this.camera.fov ?? 90,
      ...this.initalCustomUniforms,
    })

    this.rtUniform = rtUniform

    const rtTexture = new RTTexture(device, presentationFormat, this.texs)

    const bindGroupLayouts = [
      rtUniform.uniformBindGroupLayout,
      rtTexture.textureBindGroupLayout,
    ]

    this.render = await getRender({
      device,
      bindGroupLayouts,
      presentationFormat,
      context,
      canvas: this.canvas,
      main: this.main,
      materialFuncs: this.materialFuncs,
      functions: this.functions,
      rtUniform,
      rtTexture,
      usePrevFrameTex: this.usePrevFrameTex,
      useInterlacing: this.useInterlacing,
    })
    this.setUniform = (name: string, value: number) => {
      rtUniform.set(name, value)
    }
    this.setDeviceTexure = (index: number, textureData: Uint8Array) => {
      rtTexture.setTexture(index, textureData)
    }

    if (this.materialFuncs.length > 0) {
      this.rtCollision = new RTCollision({
        device,
        rtUniformKeys: rtUniform.getKeysSortedByOffset(),
        functions: this.functions,
        materialFuncs: this.materialFuncs,
        nTextures: this.texs.length,
        usePrevFrameTex: this.usePrevFrameTex,
        rtUniform,
        rtTexture,
      })
    }
  }

  checkCollision(index: number) {
    if (!this.rtCollision || !this.rtUniform)
      throw new Error('Render not built')

    // Get current pos from uniforms
    const x = this.rtUniform.get(`material${index}Px`)
    const y = this.rtUniform.get(`material${index}Py`)
    const z = this.rtUniform.get(`material${index}Pz`)

    return this.rtCollision.checkCollision(index, { x, y, z })
  }

  async start(props?: {
    onBuild?: () => void
    onFrame?: () => void
    once?: boolean
  }) {
    await this.build()
    props?.onBuild?.()

    if (props?.once) {
      this.render?.({
        camera: this.camera,
      })
      return
    }

    const rtLoop = new RTLoop({
      cb: props?.onFrame ?? (() => {}),
      shoot: () => {
        this.render?.({
          camera: this.camera,
        })
      },
      fps: this.fps,
      showFps: this.showFps,
    })
    rtLoop.start()
  }
}

export default ReTina
