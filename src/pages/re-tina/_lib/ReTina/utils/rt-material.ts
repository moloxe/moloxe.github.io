import type ReTina from '../ReTina'
import type { RTColor, RTCoord, RTMaterialPartial } from '../types'

function buildMaterial(material: RTMaterialPartial, rt: ReTina, index: number) {
  if (!material.pos) material.pos = { x: 0, y: 0, z: 0 }
  if (!material.color) material.color = { r: 1, g: 1, b: 1 }

  const setPosX = rt.registerUniform(`material${index}Px`, material.pos.x)
  const setPosY = rt.registerUniform(`material${index}Py`, material.pos.y)
  const setPosZ = rt.registerUniform(`material${index}Pz`, material.pos.z)

  const setPos = (pos: RTCoord) => {
    setPosX(pos.x)
    setPosY(pos.y)
    setPosZ(pos.z)
  }

  const setColorR = rt.registerUniform(`material${index}Cr`, material.color.r)
  const setColorG = rt.registerUniform(`material${index}Cg`, material.color.g)
  const setColorB = rt.registerUniform(`material${index}Cb`, material.color.b)

  const setColor = (color: RTColor) => {
    setColorR(color.r)
    setColorG(color.g)
    setColorB(color.b)
  }

  return {
    setPos,
    setColor,
  }
}

export default buildMaterial
