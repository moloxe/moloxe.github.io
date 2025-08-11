type Coord = {
  x: number
  y: number
  z: number
}

type Spherical = {
  radius: number
  theta: number
  phi: number
}

export type RenderProps = {
  camera: RTCamera
}

export type RTCamera = {
  pos: Coord
  spherical: Spherical
  fov: number
}
