import type ReTina from '../ReTina'
import type { RTColor, RTCoord, RTMaterialPartial } from '../types'

function buildMaterial(material: RTMaterialPartial, rt: ReTina, index: number) {
  if (!material.pos) material.pos = { x: 0, y: 0, z: 0 }
  if (!material.color) material.color = { r: 1, g: 1, b: 1 }
  if (!material.rotation) material.rotation = { x: 0, y: 0, z: 0 }

  const setPosX = rt.registerUniform(`material${index}Px`, material.pos.x)
  const setPosY = rt.registerUniform(`material${index}Py`, material.pos.y)
  const setPosZ = rt.registerUniform(`material${index}Pz`, material.pos.z)

  const setPos = (pos: Partial<RTCoord>) => {
    if (pos.x !== undefined) setPosX(pos.x)
    if (pos.y !== undefined) setPosY(pos.y)
    if (pos.z !== undefined) setPosZ(pos.z)
  }

  const setRotX = rt.registerUniform(`material${index}Rx`, material.rotation.x)
  const setRotY = rt.registerUniform(`material${index}Ry`, material.rotation.y)
  const setRotZ = rt.registerUniform(`material${index}Rz`, material.rotation.z)

  const setRot = (rot: Partial<RTCoord>) => {
    if (rot.x !== undefined) setRotX(rot.x)
    if (rot.y !== undefined) setRotY(rot.y)
    if (rot.z !== undefined) setRotZ(rot.z)
  }

  const setColorR = rt.registerUniform(`material${index}Cr`, material.color.r)
  const setColorG = rt.registerUniform(`material${index}Cg`, material.color.g)
  const setColorB = rt.registerUniform(`material${index}Cb`, material.color.b)

  const setColor = (color: Partial<RTColor>) => {
    if (color.r !== undefined) setColorR(color.r)
    if (color.g !== undefined) setColorG(color.g)
    if (color.b !== undefined) setColorB(color.b)
  }

  return {
    setPos,
    setRot,
    setColor,
  }
}

export default buildMaterial
