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
  lightFunc: string
  pos: RTCoord
  color: RTColor
  rotation: RTCoord
  collisionGroup: number
}

export type RTMaterialPartial = Pick<RTMaterial, 'sdFunc'> &
  Partial<Omit<RTMaterial, 'sdFunc'>>

export type RTMaterialFuncs = {
  sdFunc: string
  lightFunc?: string
}

export type RenderProps = {
  camera: RTCamera
}

export type RTCamera = {
  pos: RTCoord
  spherical: Spherical
  fov: number
}

export type RTTex = {
  width: number
  height: number
}
