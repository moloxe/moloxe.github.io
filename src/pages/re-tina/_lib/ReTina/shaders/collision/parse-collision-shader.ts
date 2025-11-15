import type { RTMaterialFuncs } from '../../types'
import parseCommonShader from '../parse-common-shader'

type Props = {
  rtUniformKeys: string[]
  functions?: string
  materialFuncs: RTMaterialFuncs[]
  nTextures: number
  usePrevFrameTex?: boolean
  collisionGroup: number
}

function parseCollisionShader({
  functions,
  rtUniformKeys,
  materialFuncs,
  nTextures,
  usePrevFrameTex,
  collisionGroup,
}: Props) {
  const commonWGSL = parseCommonShader({
    functions,
    materialFuncs,
    nTextures,
    rtUniformKeys,
    usePrevFrameTex,
  })

  const materialSdFunctions = materialFuncs.map((m) => m.sdFunc)

  function parseSdMaterials(index: number, condition: '==' | '!=') {
    return /* wgsl */ `
      curDist = sdMaterial${index}(pos);
      if curDist < material.dist && material.collisionGroup ${condition} COLLISION_GROUP {
        material.index = ${index};
        material.dist = curDist;
        material.pos = vec3<f32>(
          U.material${index}Px,
          U.material${index}Py,
          U.material${index}Pz
        );
        material.color = vec3<f32>(
          U.material${index}Cr,
          U.material${index}Cg,
          U.material${index}Cb
        );
      }`
  }

  const colWGSL = /* wgsl */ `
    ${commonWGSL}
    const COLLISION_GROUP: i32 = ${collisionGroup};

    fn sdInternalCollisionGroup(pos: vec3f) -> SdMaterial {
      var material = SdMaterial(-1, 1e10, vec3<f32>(0.), vec3<f32>(0.), -1);
      var curDist: f32;

      ${materialSdFunctions
        .map((_, index) => parseSdMaterials(index, '=='))
        .join('\n')}

      return material;
    }

    fn sdExternalCollisionGroup(pos: vec3f) -> SdMaterial {
      var material = SdMaterial(-1, 1e10, vec3<f32>(0.), vec3<f32>(0.), -1);
      var curDist: f32;

      ${materialSdFunctions
        .map((_, index) => parseSdMaterials(index, '!='))
        .join('\n')}

      return material;
    }

    fn calcExternalNormal(pos: vec3<f32>) -> vec3<f32> {
      var h = 1e-4;
      var k = vec2<f32>(1., -1.);
      return normalize(
          k.xyy * sdExternalCollisionGroup(pos + k.xyy * h).dist +
          k.yyx * sdExternalCollisionGroup(pos + k.yyx * h).dist +
          k.yxy * sdExternalCollisionGroup(pos + k.yxy * h).dist +
          k.xxx * sdExternalCollisionGroup(pos + k.xxx * h).dist
      );
    }

    @compute @workgroup_size(1)
    fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
      let pos = vec3<f32>(
        U.material${collisionGroup}Px,
        U.material${collisionGroup}Py,
        U.material${collisionGroup}Pz,
      );
      let internalMaterial = sdInternalCollisionGroup(pos);
      let externalMaterial = sdExternalCollisionGroup(pos);
      let collisionDist = opXor(internalMaterial.dist, externalMaterial.dist);
      let collisionNormal = calcExternalNormal(externalMaterial.pos);

      arbitrary_result[0] = f32(externalMaterial.index);
      arbitrary_result[1] = collisionDist;
      arbitrary_result[2] = collisionNormal.x;
      arbitrary_result[3] = collisionNormal.y;
      arbitrary_result[4] = collisionNormal.z;
    }
  `

  return colWGSL
}

export default parseCollisionShader
