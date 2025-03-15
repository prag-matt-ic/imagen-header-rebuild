"use client";
import { Plane, useTexture } from "@react-three/drei";
import { useControls } from "leva";
import React, { type FC, useMemo } from "react";
import { RepeatWrapping, SRGBColorSpace } from "three";
import {
  color,
  Fn,
  mix,
  ShaderNodeObject,
  step,
  texture,
  uv,
  vec2,
} from "three/tsl";
import { AttributeNode } from "three/webgpu";

import carouselImage from "@/assets/images/carousel.jpg";

// Replicates the CSS object-fit property using TSL color nodes.

// https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit#values

// COVER:
// Scaled to maintain its aspect ratio while filling the element's entire content box.

// CONTAIN:
// Scaled to maintain its aspect ratio while fitting within the element's content box.
// The object will be "letterboxed" or "pillarboxed" if its aspect ratio does not match the aspect ratio of the box.

// FILL:
// The entire object will completely fill the box.
// If the object's aspect ratio does not match the aspect ratio of its box, the object will be stretched to fit.

enum FitMode {
  Cover = "Cover",
  Contain = "Contain",
  Fill = "Fill",
  Tile = "Tile",
}

const ImageFitMode: FC = () => {
  // Photo by Dimitry Mak: https://www.pexels.com/photo/colorful-summer-day-at-coney-island-amusement-park-30911091/
  const imageTexture = useTexture(carouselImage.src);
  imageTexture.colorSpace = SRGBColorSpace;
  imageTexture.wrapS = RepeatWrapping;
  imageTexture.wrapT = RepeatWrapping;

  const { planeWidth, planeHeight, fit, tileAmount } = useControls({
    fit: {
      value: FitMode.Cover,
      options: Object.values(FitMode),
    },
    planeWidth: {
      value: 2,
      min: 0.5,
      max: 5,
      step: 0.1,
    },
    planeHeight: {
      value: 2,
      min: 0.5,
      max: 5,
      step: 0.1,
    },
    tileAmount: {
      value: 2,
      min: 1,
      max: 16,
      step: 1,
      render: (get) => get("fit") === FitMode.Tile,
    },
    // If tile mode, set the scale
  });

  const imageAspect = imageTexture.image.width / imageTexture.image.height;
  const planeAspect: number = planeWidth / planeHeight;

  const { key, colorNode } = useMemo(() => {
    // For cover, we want to “zoom” into the image so that the plane is completely covered.
    // Depending on whether the plane is wider than the image or not,
    // we shrink the horizontal or vertical UV range and center it.
    const getCoverColor = Fn(([uv]: [ShaderNodeObject<AttributeNode>]) => {
      const coverUv =
        planeAspect > imageAspect
          ? // Plane is wider than image: image’s full width is used, scale the height.
            vec2(
              uv.x,
              uv.y
                .sub(0.5)
                .mul(imageAspect / planeAspect)
                .add(0.5)
            )
          : // Plane is taller than image: image’s full height is used, scale the width.
            vec2(
              uv.x
                .sub(0.5)
                .mul(planeAspect / imageAspect)
                .add(0.5),
              uv.y
            );

      return texture(imageTexture, coverUv);
    });

    // In CONTAIN mode we need to show the entire image.
    // The valid region in UV space is smaller than [0,1] on one axis.
    // Outside that region, we mask to black.

    const getContainUV = Fn(
      ([uv, scale = 1]: [ShaderNodeObject<AttributeNode>, number?]) => {
        // Compute the adjusted UV coordinates that map [0,1] into the valid image area.
        const containUv =
          planeAspect > imageAspect
            ? vec2(
                uv.x
                  .sub(0.5)
                  .div(imageAspect / planeAspect)
                  .add(0.5),
                uv.y
              )
                .mul(scale)
                .toVar()
            : vec2(
                uv.x,
                uv.y
                  .sub(0.5)
                  .div(planeAspect / imageAspect)
                  .add(0.5)
              )
                .mul(scale)
                .toVar();

        return containUv;
      }
    ).setLayout({
      name: "getContainUV",
      type: "vec2",
      inputs: [
        { name: "uv", type: "vec2", qualifier: "in" },
        { name: "scale", type: "float", qualifier: "in" },
      ],
    });

    const getContainColor = Fn(([uv]: [ShaderNodeObject<AttributeNode>]) => {
      // Compute the adjusted UV coordinates that map [0,1] into the valid image area
      const containUv = getContainUV(uv);
      // Sample the texture with the adjusted UV
      const sampled = texture(imageTexture, containUv);

      const maskColor = color("#fff");
      const mask =
        planeAspect > imageAspect
          ? step(0.5 - (imageAspect / planeAspect) * 0.5, uv.x).mul(
              step(0.5 + (imageAspect / planeAspect) * 0.5, uv.x).oneMinus()
            )
          : step(0.5 - (planeAspect / imageAspect) * 0.5, uv.y).mul(
              step(0.5 + (planeAspect / imageAspect) * 0.5, uv.y).oneMinus()
            );
      // Where mask==0, the maskColor is used
      return mix(maskColor, sampled, mask);
    });

    const getTileColor = Fn(([uv]: [ShaderNodeObject<AttributeNode>]) => {
      const tileUv = getContainUV(uv, tileAmount);
      return texture(imageTexture, tileUv);
    });

    const getColorNode = Fn(() => {
      if (fit === FitMode.Cover) return getCoverColor(uv());
      if (fit === FitMode.Contain) return getContainColor(uv());
      if (fit === FitMode.Tile) return getTileColor(uv());
      // For fill, we use the uv coordinates as-is, stretching the image.
      if (fit === FitMode.Fill) return texture(imageTexture, uv());
    });

    const colorNode = getColorNode();
    const key = colorNode.uuid;

    return { key, colorNode };
  }, [planeAspect, imageAspect, imageTexture, tileAmount, fit]);

  return (
    <Plane position={[0, 0, 0]} args={[planeWidth, planeHeight]}>
      <meshBasicNodeMaterial key={key} colorNode={colorNode} />
    </Plane>
  );
};

export default ImageFitMode;
