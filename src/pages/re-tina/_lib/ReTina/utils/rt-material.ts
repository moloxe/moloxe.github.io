import type ReTina from '../ReTina'
import type { RTColor, RTCoord, RTMaterialPartial } from '../types'
import RTCollision, { type RTCollisionProps } from './rt-collision'

type Props = { material: RTMaterialPartial; rt: ReTina; index: number }
export type RTCollisionCheckerProps = Omit<RTCollisionProps, 'collisionGroup'>

class RTMaterial {
  setPos: (p: Partial<RTCoord>) => void
  setRot: (r: Partial<RTCoord>) => void
  setColor: (c: Partial<RTColor>) => void
  setCollisionGroup: (cg: number) => void
  checkForCollisions?: () => void
  private collisionGroup: number
  private rtCollision?: RTCollision
  private index: number

  constructor({ material, rt, index }: Props) {
    if (!material.pos) material.pos = { x: 0, y: 0, z: 0 }
    if (!material.color) material.color = { r: 1, g: 1, b: 1 }
    if (!material.rotation) material.rotation = { x: 0, y: 0, z: 0 }
    if (!material.collisionGroup) material.collisionGroup = -1

    const setPosX = rt.registerUniform(`material${index}Px`, material.pos.x)
    const setPosY = rt.registerUniform(`material${index}Py`, material.pos.y)
    const setPosZ = rt.registerUniform(`material${index}Pz`, material.pos.z)

    this.setPos = (pos: Partial<RTCoord>) => {
      if (pos.x !== undefined) setPosX(pos.x)
      if (pos.y !== undefined) setPosY(pos.y)
      if (pos.z !== undefined) setPosZ(pos.z)
    }

    const setRotX = rt.registerUniform(
      `material${index}Rx`,
      material.rotation.x
    )
    const setRotY = rt.registerUniform(
      `material${index}Ry`,
      material.rotation.y
    )
    const setRotZ = rt.registerUniform(
      `material${index}Rz`,
      material.rotation.z
    )

    this.setRot = (rot: Partial<RTCoord>) => {
      if (rot.x !== undefined) setRotX(rot.x)
      if (rot.y !== undefined) setRotY(rot.y)
      if (rot.z !== undefined) setRotZ(rot.z)
    }

    const setColorR = rt.registerUniform(`material${index}Cr`, material.color.r)
    const setColorG = rt.registerUniform(`material${index}Cg`, material.color.g)
    const setColorB = rt.registerUniform(`material${index}Cb`, material.color.b)

    this.setColor = (color: Partial<RTColor>) => {
      if (color.r !== undefined) setColorR(color.r)
      if (color.g !== undefined) setColorG(color.g)
      if (color.b !== undefined) setColorB(color.b)
    }

    this.setCollisionGroup = rt.registerUniform(
      `material${index}CollisionGroup`,
      material.collisionGroup
    )

    this.collisionGroup = material.collisionGroup
    this.index = index
  }

  buildCollisionChecker(props: RTCollisionCheckerProps) {
    this.rtCollision = new RTCollision({
      ...props,
      collisionGroup: this.collisionGroup,
    })
  }

  checkCollision() {
    if (!this.rtCollision) throw new Error('Collision checker not built')
    return this.rtCollision.checkCollision()
  }

  getIndex() {
    return this.index
  }
}

export default RTMaterial
