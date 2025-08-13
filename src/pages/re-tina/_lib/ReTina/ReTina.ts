import type { RenderProps, RTCamera } from './types'
import getRender from './utils/get-render'
import prepareCanvas from './utils/prepare-canvas'

type Props = {
  canvas: HTMLCanvasElement
  map?: string
  main: string
  functions?: string
}

class ReTina {
  private canvas: HTMLCanvasElement
  private main: string
  private map?: string
  private functions?: string
  private render?: (props: RenderProps) => void
  private initalCustomUniforms: { [key: string]: number } = {}
  private setUniform?: (name: string, value: number) => void
  camera: RTCamera

  constructor({ canvas, map, main, functions }: Props) {
    this.canvas = canvas
    this.map = map
    this.main = main
    this.functions = functions
    this.camera = {
      pos: { x: 0, y: 0, z: 0 },
      spherical: { radius: 0, theta: 0, phi: 0 },
      fov: 90,
    }
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

    const { render, setUniform } = await getRender({
      device,
      presentationFormat,
      context,
      canvas: this.canvas,
      main: this.main,
      map: this.map,
      functions: this.functions,
      initalCustomUniforms: this.initalCustomUniforms,
      initialUniforms: {
        camPosX: this.camera.pos.x,
        camPosY: this.camera.pos.y,
        camPosZ: this.camera.pos.z,
        camSphericalR: this.camera.spherical.radius,
        camSphericalT: this.camera.spherical.theta,
        camSphericalP: this.camera.spherical.phi,
        camFov: this.camera.fov,
      },
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
