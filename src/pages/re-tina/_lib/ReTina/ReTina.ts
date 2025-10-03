import type {
  RenderProps,
  RTCamera,
  RTMaterialFuncs,
  RTMaterialPartial,
} from './types'
import getRender from './device/get-render'
import prepareCanvas from './device/prepare-canvas'
import buildMaterial from './utils/rt-material'
import RTUniform from './utils/rt-uniform'

type Props = {
  canvas: HTMLCanvasElement
  main?: string
  functions?: string
}

class ReTina {
  canvas: HTMLCanvasElement
  private main?: string
  private functions?: string
  private render?: (props: RenderProps) => void
  private initalCustomUniforms: { [key: string]: number } = {}
  private setUniform?: (name: string, value: number) => void
  private materialFuncs: RTMaterialFuncs[] = []
  camera: RTCamera

  constructor({ canvas, main, functions }: Props) {
    this.canvas = canvas
    this.main = main
    this.functions = functions
    this.camera = {
      pos: { x: 0, y: 0, z: 0 },
      spherical: { radius: 0, theta: 0, phi: 0 },
      fov: 90,
    }
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

    const { render, setUniform } = await getRender({
      device,
      presentationFormat,
      context,
      canvas: this.canvas,
      main: this.main,
      materialFuncs: this.materialFuncs,
      functions: this.functions,
      rtUniform,
    })

    this.setUniform = setUniform
    this.render = render
  }

  shoot() {
    this.render?.({
      camera: this.camera,
    })
  }
}

export default ReTina
