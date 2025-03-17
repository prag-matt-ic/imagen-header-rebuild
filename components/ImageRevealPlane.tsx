"use client";
import { useGSAP } from "@gsap/react";
import { Plane, useTexture } from "@react-three/drei";
import gsap from "gsap";
import { useControls } from "leva";
import React, { type FC, Suspense, useEffect, useMemo } from "react";
import { SRGBColorSpace, Vector3Tuple } from "three";
import { hashBlur } from "three/examples/jsm/tsl/display/hashBlur.js";
import {
  abs,
  float,
  Fn,
  If,
  int,
  length,
  max,
  min,
  mix,
  oneMinus,
  positionLocal,
  select,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";

import { getCoverUv, rotation3dY } from "./utils";

type Props = {
  imageSrc: string;
  width: number;
  height: number;
  position: Vector3Tuple;
  withControls?: boolean;
  isBlurred?: boolean;
  delay?: number;
  replayTime?: string;
};

const ImageRevealPlane: FC<Props> = ({
  imageSrc,
  height,
  width,
  position,
  withControls = false,
  isBlurred = false,
  delay = 0,
  replayTime = 0,
}) => {
  const imageTexture = useTexture(imageSrc);
  imageTexture.colorSpace = SRGBColorSpace;
  const shouldExitToLeft = position[0] < 0;

  const {
    key,
    colorNode,
    positionNode,
    uReveal,
    uIsBlurred,
    uEnterProgress,
    uExitProgress,
  } = useMemo(() => {
    const uIsBlurred = uniform(int(isBlurred));
    const uEnterProgress = uniform(float(0)); // Drives the entering position
    const uExitProgress = uniform(float(0)); // Drives the scroll-influenced exiting position
    const uReveal = uniform(float(1)); // Drives the mask reveal

    const planeAspect = float(width / height);
    const imageAspect = float(
      imageTexture.image.width / imageTexture.image.height
    );

    const colorNode = Fn(() => {
      const coverUv = getCoverUv(uv(), planeAspect, imageAspect);
      const textureColor = texture(imageTexture, coverUv);

      // Mark as variable so we can modify it when blurred
      const colour = textureColor.toVar();

      If(uIsBlurred, () => {
        // Generate and assign blur
        const blurred = hashBlur(textureColor, 0.06, 96);
        colour.assign(blurred);
      });

      // Reveal mask
      const distanceToCenter = coverUv.sub(vec2(0.5, 0.5));
      const borderRadius = float(0.08).mul(uReveal);
      // If blurred, we use a higher softness threshold to create soft edges
      const finalSoftness = select(uIsBlurred, float(0.12), float(0.0001));
      const softness = mix(float(0.1), finalSoftness, uReveal);

      // Determine the maximum half‑dimensions for each axis based on the cover UV.
      const maxHalfSize = select(
        planeAspect.greaterThan(imageAspect),
        vec2(float(0.5), float(0.5).mul(imageAspect.div(planeAspect))),
        vec2(float(0.5).mul(planeAspect.div(imageAspect)), float(0.5))
      );
      // Scale the maxHalfSize by the reveal factor to make the mask grow
      const revealedHalfSize = maxHalfSize.mul(uReveal);

      // Compute the SDF for a rounded rectangle
      // By using revealedHalfSize for distance the shape grows with the reveal factor
      const distanceToEdge = vec2(
        abs(distanceToCenter.x),
        abs(distanceToCenter.y)
      ).sub(revealedHalfSize.sub(borderRadius).sub(softness));

      // Signed distance function for a rounded rectangle
      const sdfRoundedRect = min(max(distanceToEdge.x, distanceToEdge.y), 0.0)
        .add(length(max(distanceToEdge, 0.0)))
        .sub(borderRadius);

      const mask = oneMinus(smoothstep(0.0, softness, sdfRoundedRect));

      // Mix a fully transparent color with the texture color based on the mask.
      // When mask is 0 it's transparent. When mask is 1, returns texture colour.
      return mix(vec4(colour.rgb, 0), colour, mask);
    })();

    const positionNode = Fn(() => {
      const enterProgressMinusOne = oneMinus(uEnterProgress);
      const exitY = uExitProgress.mul(10);
      const exitX = uExitProgress.mul(shouldExitToLeft ? -1.5 : 1.5);
      const exitZ = uExitProgress.mul(2);

      const pos = positionLocal
        .mul(rotation3dY(enterProgressMinusOne)) // Rotate upon entry
        // translate on Y and Z upon entry
        .sub(
          vec3(
            0,
            enterProgressMinusOne.mul(2.0),
            enterProgressMinusOne.mul(2.0)
          )
        )
        // Translate out on scroll
        .add(vec3(exitX, exitY, exitZ));
      return pos;
    })();

    const key = colorNode.uuid;

    return {
      key,
      colorNode,
      uReveal,
      uIsBlurred,
      uEnterProgress,
      uExitProgress,
      positionNode,
    };
  }, [height, imageTexture, isBlurred, shouldExitToLeft, width]);

  const [_, set] = useControls(() => ({
    blur: {
      value: isBlurred,
      label: "Blurred",
      min: 0,
      max: 1,
      step: 1,
      onChange(value) {
        if (!withControls) return;
        uIsBlurred.value = value;
      },
    },
    reveal: {
      value: 1,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Reveal",
      onChange: (value) => {
        if (!withControls) return;
        uReveal.value = value;
      },
    },
    position: {
      value: 0,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Translate",
      onChange: (value) => {
        if (!withControls) return;
        uEnterProgress.value = value;
      },
    },
    enter: {
      value: 0,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Enter (both)",
      onChange: (value) => {
        if (!withControls) return;
        uReveal.value = value;
        uEnterProgress.value = value;
      },
    },
  }));

  useEffect(() => {
    const revealTween = gsap.fromTo(
      uReveal,
      { value: 0 },
      {
        value: 1,
        duration: 1,
        ease: "power1.out",
        delay: delay,
        onUpdate: () => {
          if (!withControls) return;
          set({ reveal: +uReveal.value });
        },
      }
    );
    const enterPositionTween = gsap.fromTo(
      uEnterProgress,
      { value: 0 },
      {
        value: 1,
        duration: 1.8,
        ease: "power1.out",
        delay: 0.2 + delay,
        onUpdate: () => {
          if (!withControls) return;
          set({ position: +uEnterProgress.value });
        },
      }
    );
    return () => {
      revealTween.kill();
      enterPositionTween.kill();
    };
  }, [delay, replayTime, set, uEnterProgress, uReveal, withControls]);

  useGSAP(() => {
    gsap.to(uExitProgress, {
      ease: "none",
      value: 1,
      delay: delay,
      scrollTrigger: {
        start: 0,
        end: "max",
        scrub: true,
      },
    });
  }, [delay]);

  return (
    <Suspense fallback={null}>
      <Plane position={position} args={[width, height, 1, 1]}>
        <meshBasicNodeMaterial
          key={key}
          color={"blue"}
          colorNode={colorNode}
          positionNode={positionNode}
          transparent={true}
          depthTest={false}
        />
      </Plane>
    </Suspense>
  );
};

export default ImageRevealPlane;
