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
  rotation: RTCoord
  // TODO: Implement lightning
  // shininess = 1,
  // TODO: Implement grouping
  // group = -1,
  // TODO: Implement physics?
  // collisionGroup = -1,
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
