import type {
  RenderProps,
  RTCamera,
  RTMaterialFuncs,
  RTMaterialPartial,
  RTTex,
} from './types'
import getRender from './device/get-render'
import prepareCanvas from './device/prepare-canvas'
import buildMaterial from './utils/rt-material'
import RTUniform from './utils/rt-uniform'
import RTLoop from './utils/rt-loop'
import { fumbFsCanvas } from './utils/utils'

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
    this.canvas = fumbFsCanvas(height)
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
    const material = buildMaterial(partialMaterial, this, index)
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

  async build() {
    const { device, context, presentationFormat } = await prepareCanvas(
      this.canvas
    )

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

    const { render, setUniform, setTexture } = await getRender({
      device,
      presentationFormat,
      context,
      canvas: this.canvas,
      main: this.main,
      materialFuncs: this.materialFuncs,
      functions: this.functions,
      rtUniform,
      texs: this.texs,
      usePrevFrameTex: this.usePrevFrameTex,
      useInterlacing: this.useInterlacing,
    })

    this.setUniform = setUniform
    this.render = render
    this.setDeviceTexure = setTexture
  }

  run(cb = () => {}) {
    const rtLoop = new RTLoop({
      cb,
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

  async buildAndRun(cb = () => {}) {
    await this.build()
    this.run(cb)
  }
}

export default ReTina
