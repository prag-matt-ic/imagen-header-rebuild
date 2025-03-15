import {
  abs,
  bool,
  color,
  cos,
  float,
  Fn,
  hash,
  If,
  length,
  mat3,
  max,
  min,
  mix,
  oneMinus,
  positionLocal,
  positionWorld,
  rotate,
  select,
  ShaderNodeObject,
  sin,
  smoothstep,
  step,
  texture,
  time,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import MathNode from "three/src/nodes/math/MathNode.js";

// Creates a 3D rotation matrix around the Y axis.
// Usage: const rotatedPosition = position.mul(rotation3dY(angle))

export const rotation3dY = /*#__PURE__*/ Fn(
  ([angle]: [angle: ShaderNodeObject<MathNode> | number]) => {
    const s = float(sin(angle)).toVar();
    const c = float(cos(angle));
    return mat3(c, 0.0, s.negate(), 0.0, 1.0, 0.0, s, 0.0, c);
  }
).setLayout({
  name: "rotation3dY",
  type: "mat3",
  inputs: [{ name: "angle", type: "float", qualifier: "in" }],
});
