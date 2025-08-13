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

  async build() {
    const { device, context, presentationFormat } = await prepareCanvas(
      this.canvas
    )

    const { render } = await getRender({
      device,
      presentationFormat,
      context,
      canvas: this.canvas,
      main: this.main,
      map: this.map,
      functions: this.functions,
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

    this.render = render
  }

  shoot() {
    this.render?.({
      camera: this.camera,
    })
  }
}

export default ReTina
