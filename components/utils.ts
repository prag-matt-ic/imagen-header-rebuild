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
import { Vector2 } from "three";
import { AttributeNode, Node } from "three/webgpu";

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

export const getCoverUv = /*#__PURE__*/ Fn(
  ([uv, planeAspect, imageAspect]: [
    uv: ShaderNodeObject<Node>,
    planeAspect: ShaderNodeObject<Node>,
    imageAspect: ShaderNodeObject<Node>
  ]) => {
    // For image cover fit, we “zoom” into the image so that the plane is completely covered
    // UV is remapped so that the image/texture covers the plane without stretching
    const coverUv = select(
      planeAspect.greaterThan(imageAspect),
      vec2(uv.x, uv.y.sub(0.5).mul(imageAspect.div(planeAspect)).add(0.5)),
      vec2(uv.x.sub(0.5).mul(planeAspect.div(imageAspect)).add(0.5), uv.y)
    );
    return coverUv;
  }
).setLayout({
  name: "getCoverUv",
  type: "vec2",
  inputs: [
    { name: "uv", type: "vec2", qualifier: "in" },
    { name: "planeAspect", type: "float", qualifier: "in" },
    { name: "imageAspect", type: "float", qualifier: "in" },
  ],
});
