export type OnekoSprite =
  | 'idle'
  | 'alert'
  | 'scratch'
  | 'tired'
  | 'sleeping'
  | 'N'
  | 'NE'
  | 'E'
  | 'SE'
  | 'S'
  | 'SW'
  | 'W'
  | 'NW'

export type Oneko = {
  id: string
  targetX: number
  targetY: number
  posX: number
  posY: number
  message: string
  sprite: OnekoSprite
}
