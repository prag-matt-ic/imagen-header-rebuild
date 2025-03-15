"use client";
import { useGSAP } from "@gsap/react";
import { OrbitControls, Stats } from "@react-three/drei";
import { Canvas, extend, type ThreeToJSXElements } from "@react-three/fiber";
import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import { useLayoutEffect, useState } from "react";
import WebGPU from "three/examples/jsm/capabilities/WebGPU.js";
import { type WebGPURendererParameters } from "three/src/renderers/webgpu/WebGPURenderer.js";
import * as THREE from "three/webgpu";

import deepmind from "@/assets/deepmind.jpeg";
import ImageRevealPlane from "@/components/ImageRevealPlane";
import NotSupported from "@/components/NotSupported";

declare module "@react-three/fiber" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
extend(THREE as any);

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function ControlsPage() {
  const [isWebGPUSupported, setIsWebGPUSupported] = useState<boolean | null>(
    null
  );

  useLayoutEffect(() => {
    setIsWebGPUSupported(WebGPU.isAvailable());
  }, []);

  if (isWebGPUSupported === null) return null;
  if (isWebGPUSupported === false) return <NotSupported />;

  return (
    <Canvas
      className="!fixed inset-0 !h-lvh !w-full cursor-grab"
      camera={{ position: [0, 0, 4], fov: 70, far: 30 }}
      flat={true}
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer(
          props as WebGPURendererParameters
        );
        await renderer.init();
        return renderer;
      }}
    >
      <color attach="background" args={["#fff"]} />
      <OrbitControls />

      <ImageRevealPlane
        position={[0, 0, 0]}
        width={5}
        height={3}
        imageSrc={deepmind.src}
        withControls={true}
      />

      {process.env.NODE_ENV === "development" && <Stats />}
    </Canvas>
  );
}
