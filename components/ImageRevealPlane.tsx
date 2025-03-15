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

import { rotation3dY } from "./utils";

type Props = {
  imageSrc: string;
  width: number;
  height: number;
  position: Vector3Tuple;
  delay?: number;
  replayTime?: string;
  isBlurred?: number;
  withControls?: boolean;
};

const ImageRevealPlane: FC<Props> = ({
  imageSrc,
  height,
  width,
  isBlurred = 0,
  replayTime,
  delay = 0,
  position,
  withControls = false,
}) => {
  const imageTexture = useTexture(imageSrc);
  imageTexture.colorSpace = SRGBColorSpace;
  const imageAspect = imageTexture.image.width / imageTexture.image.height;
  const planeAspect: number = width / height;

  const {
    key,
    colorNode,
    positionNode,
    uReveal,
    uEnterProgress,
    uExitProgress,
    uIsBlurred,
  } = useMemo(() => {
    const uIsBlurred = uniform(int(isBlurred));
    const uReveal = uniform(float(0)); // Drives the mask reveal
    const uEnterProgress = uniform(float(0)); // Drives the initial translation
    const uExitProgress = uniform(float(0)); // Drives the scroll influenced position

    const planeAspectF = float(planeAspect);
    const imageAspectF = float(imageAspect);

    const shouldExitLeft = position[0] < 0;

    const colorNode = Fn(() => {
      // For cover fit, we “zoom” into the image so that the plane is completely covered
      // Remap the uv so that the image covers the plane without stretching
      const coverUv = select(
        planeAspectF.greaterThan(imageAspectF),
        vec2(
          uv().x,
          uv()
            .y.sub(0.5)
            .mul(imageAspect / planeAspect)
            .add(0.5)
        ),
        vec2(
          uv()
            .x.sub(0.5)
            .mul(planeAspect / imageAspect)
            .add(0.5),
          uv().y
        )
      );
      // Sample the texture color
      const textureColor = texture(imageTexture, coverUv);

      // Mark as variable so we can modify it when blurred
      const colour = textureColor.toVar();

      If(uIsBlurred, () => {
        // Generate and assign blur
        const blurred = hashBlur(textureColor, 0.06, 96);
        colour.assign(blurred);
      });

      const center = vec2(0.5, 0.5);
      const distanceToCenter = coverUv.sub(center);

      // Determine the maximum half‑size for each axis based on the cover UV.
      const halfSize = select(
        planeAspectF.greaterThan(imageAspectF),
        vec2(float(0.5), float(0.5).mul(imageAspect / planeAspect)),
        vec2(float(0.5).mul(planeAspect / imageAspect), float(0.5))
      );

      const revealingHalfSize = halfSize.mul(uReveal);

      // --- Compute the scaled SDF for a rounded rectangle ---
      // Desired constant rounding value (in UV units).
      const borderRadius = float(0.08).mul(uReveal);
      // If blurred, we use a higher softness threshold for softer edges.
      const finalSoftness = select(uIsBlurred, float(0.1), float(0.0001));
      const softness = mix(0.1, finalSoftness, uReveal);

      // Instead of using rectHalfSize, use the scaled halfSize so the SDF shrinks with uVisibility.
      const d = vec2(abs(distanceToCenter.x), abs(distanceToCenter.y)).sub(
        revealingHalfSize.sub(borderRadius).sub(softness)
      );

      // Signed distance function for a rounded rectangle
      const sdfRoundedRect = min(max(d.x, d.y), 0.0)
        .add(length(max(d, 0.0)))
        .sub(borderRadius);

      const mask = oneMinus(smoothstep(0.0, softness, sdfRoundedRect));

      // Mix a fully transparent color with the texture color based on the mask.
      // When mask is 0, returns transparent; when mask is 1, returns texColor.
      return mix(vec4(colour.rgb, 0), colour, mask);
    })();

    // Move the plane from 3 -> 0 based on the uEnterPosition value (0 -> 1).
    const positionNode = Fn(() => {
      const enterProgressMinusOne = oneMinus(uEnterProgress);
      const exitY = uExitProgress.mul(10);
      const exitX = uExitProgress.mul(shouldExitLeft ? -1.5 : 1.5);
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
      positionNode,
      uReveal,
      uEnterProgress,
      uExitProgress,
      uIsBlurred,
    };
  }, [isBlurred, planeAspect, imageAspect, position, imageTexture]);

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
      value: 0,
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
    both: {
      value: 0,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Both",
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
    const positionTween = gsap.fromTo(
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
      positionTween.kill();
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
          transparent={true}
          colorNode={colorNode}
          positionNode={positionNode}
          depthTest={false}
        />
      </Plane>
    </Suspense>
  );
};

export default ImageRevealPlane;
