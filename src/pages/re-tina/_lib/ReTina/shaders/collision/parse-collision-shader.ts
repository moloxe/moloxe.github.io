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

// Using opIntersection would be more "accurate". Anyways...
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
      if curDist < material.dist && i32(U.material${index}CollisionGroup) ${condition} COLLISION_GROUP {
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
    const COLLISION_GROUP: i32 = ${collisionGroup};

    fn sdInternalCollisionGroup(pos: vec3f) -> SdMaterial {
      var material = SdMaterial(-1, 1e10, vec3f(0.), vec3f(0.));
      var curDist: f32;

      ${materialSdFunctions
        .map((_, index) => parseSdMaterials(index, '=='))
        .join('\n')}

      return material;
    }

    fn sdExternalCollisionGroup(pos: vec3f) -> SdMaterial {
      var material = SdMaterial(-1, 1e10, vec3f(0.), vec3f(0.));
      var curDist: f32;

      ${materialSdFunctions
        .map((_, index) => parseSdMaterials(index, '!='))
        .join('\n')}

      return material;
    }

    fn calcColisionPos(_pos: vec3f, externalMaterial: SdMaterial) -> vec3f {
      var pos = _pos;
      for (var i: i32 = 0; i < RM_MAX_ITER; i++) {
        let material = sdExternalCollisionGroup(pos);
        let dist = material.dist;
        if abs(dist) < RM_MIN_DIST { break; }
        if i == 0 && abs(dist) > RM_MAX_DIST { break; }
        // Moving 'pos' in the direction that reduces the distance most quickly:
        let normal = calcExternalNormal(pos);
        pos = pos - normal * dist;
      }
      return pos;
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

    fn calcCollisionDist(colPos: vec3f, colDir: vec3f) -> f32 {
      var t: f32 = 0.0;
      for (var i: i32 = 0; i < RM_MAX_ITER; i++) {
        let pos = colPos + colDir * t;
        let curMaterial = sdInternalCollisionGroup(pos);
        if abs(curMaterial.dist) < RM_MIN_DIST {
          return t;
        }
        if t > RM_MAX_DIST { break; }
        t = t + curMaterial.dist;
      }
      return 1e10;
    }

    struct CollisionResult {
      index: i32,
      dist: f32,
      normal: vec3f,
    }

    @compute @workgroup_size(1)
    fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
      // A more precise center could be calculated,
      // something like finding the most negative position with raymarch
      // ...it could be over-engineering.
      // Simply use the position of the element that has collisions enabled.
      let pos = vec3f(
        U.material${collisionGroup}Px,
        U.material${collisionGroup}Py,
        U.material${collisionGroup}Pz,
      );

      var collision = CollisionResult(-1, 1e10, vec3f(0));
      let externalMaterial = sdExternalCollisionGroup(pos);
      let colPos = calcColisionPos(pos, externalMaterial);
      let colDir = normalize(pos - colPos);

      if externalMaterial.dist > 0 {
        collision.dist = calcCollisionDist(colPos, colDir);
        if collision.dist < RM_MIN_DIST {
          collision.index = externalMaterial.index;
          collision.normal = calcExternalNormal(colPos);
        }
      } else {
        collision.dist = calcCollisionDist(colPos, -colDir);
        if collision.dist < RM_MIN_DIST {
          collision.index = externalMaterial.index;
          collision.normal = calcExternalNormal(colPos);
        } else {
          collision.dist = -INF; // bruh
        }
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
