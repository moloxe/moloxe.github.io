import type { RTMaterialFuncs } from '../../types'
import parseCommonShader from '../parse-common-shader'

type Props = {
  rtUniformKeys: string[]
  functions?: string
  materialFuncs: RTMaterialFuncs[]
  nTextures: number
  usePrevFrameTex?: boolean
}

// Using opIntersection would be more "accurate". Anyways...
function parseCollisionShader({
  functions,
  rtUniformKeys,
  materialFuncs,
  nTextures,
  usePrevFrameTex,
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
      if curDist < material.dist && i32(U.material${index}CollisionGroup) ${condition} params.collisionGroup {
        material.index = ${index};
        material.dist = curDist;
        material.pos = vec3f(
          U.material${index}Px,
          U.material${index}Py,
          U.material${index}Pz
        );
        material.color = vec3f(
          U.material${index}Cr,
          U.material${index}Cg,
          U.material${index}Cb
        );
      }`
  }

  const colWGSL = /* wgsl */ `
    ${commonWGSL}
    
    struct CollisionParams {
      collisionGroup: i32,
      pos: vec3f,
    }

    @group(2) @binding(0) var<uniform> params: CollisionParams;

    fn sdInternalCollisionGroup(pos: vec3f) -> SdMaterial {
      var material = SdMaterial(-1, INF, vec3f(0.), vec3f(0.));
      var curDist: f32;

      ${materialSdFunctions
      .map((_, index) => parseSdMaterials(index, '=='))
      .join('\n')}

      return material;
    }

    fn sdExternalCollisionGroup(pos: vec3f) -> SdMaterial {
      var material = SdMaterial(-1, INF, vec3f(0.), vec3f(0.));
      var curDist: f32;

      ${materialSdFunctions
      .map((_, index) => parseSdMaterials(index, '!='))
      .join('\n')}

      return material;
    }

    fn calcExternalNormal(pos: vec3f) -> vec3f {
      var h = 1e-4;
      var k = vec2f(1., -1.);
      return normalize(
          k.xyy * sdExternalCollisionGroup(pos + k.xyy * h).dist +
          k.yyx * sdExternalCollisionGroup(pos + k.yyx * h).dist +
          k.yxy * sdExternalCollisionGroup(pos + k.yxy * h).dist +
          k.xxx * sdExternalCollisionGroup(pos + k.xxx * h).dist
      );
    }

    fn calcInternalNormal(pos: vec3f) -> vec3f {
      var h = 1e-4;
      var k = vec2f(1., -1.);
      return normalize(
          k.xyy * sdInternalCollisionGroup(pos + k.xyy * h).dist +
          k.yyx * sdInternalCollisionGroup(pos + k.yyx * h).dist +
          k.yxy * sdInternalCollisionGroup(pos + k.yxy * h).dist +
          k.xxx * sdInternalCollisionGroup(pos + k.xxx * h).dist
      );
    }

    struct CollisionResult {
      index: i32,
      dist: f32,
      normal: vec3f,
    }

    @compute @workgroup_size(1)
    fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
      var pos = params.pos;

      var collision = CollisionResult(-1, INF, vec3f(0));

      for (var i: i32 = 0; i < RM_MAX_ITER; i++) {
        let externalMaterial = sdExternalCollisionGroup(pos);
        let internalMaterial = sdInternalCollisionGroup(pos);
        
        let d = max(externalMaterial.dist, internalMaterial.dist);

        if d < RM_MIN_DIST {
          collision.index = externalMaterial.index;
          collision.dist = d;
          collision.normal = calcExternalNormal(pos);
          break;
        }

        if d > RM_MAX_DIST {
          break;
        }

        var normal: vec3f;
        if externalMaterial.dist > internalMaterial.dist {
          normal = calcExternalNormal(pos);
        } else {
          normal = calcInternalNormal(pos);
        }

        pos = pos - normal * d;
      }

      arbitrary_result[0] = f32(collision.index);
      arbitrary_result[1] = collision.dist;
      arbitrary_result[2] = collision.normal.x;
      arbitrary_result[3] = collision.normal.y;
      arbitrary_result[4] = collision.normal.z;
    }
  `

  return colWGSL
}

export default parseCollisionShader
