export type RTCoord = {
  x: number
  y: number
  z: number
}

export type RTColor = {
  r: number
  g: number
  b: number
}

type Spherical = {
  radius: number
  theta: number
  phi: number
}

export type RTMaterial = {
  sdFunc: string
  pos: RTCoord
  color: RTColor
}

export type RTMaterialPartial = Pick<RTMaterial, 'sdFunc'> &
  Partial<Omit<RTMaterial, 'sdFunc'>>

export type RenderProps = {
  camera: RTCamera
}

export type RTCamera = {
  pos: RTCoord
  spherical: Spherical
  fov: number
}
