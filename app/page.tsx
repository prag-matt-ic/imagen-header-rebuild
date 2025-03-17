"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import SplitText from "gsap/dist/SplitText";
import { Leva } from "leva";
import Image from "next/image";
import Link from "next/link";
import {
  type FC,
  type HTMLAttributes,
  type PropsWithChildren,
  useState,
} from "react";

import chevronRight from "@/assets/chevron-right.svg";
import replayIcon from "@/assets/replay.svg";
import Scene from "@/components/Scene";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export default function ImagenHeaderPage() {
  const [replayTime, setReplayTime] = useState("");

  const onReplayClick = () => {
    setReplayTime(Date.now().toString());
  };

  return (
    <main className="w-full overflow-hidden">
      <Scene replayTime={replayTime} />
      <header className="relative w-full pointer-events-none h-svh flex flex-col gap-6 items-center justify-center">
        <h1 className="text-3xl md:text-8xl font-medium tracking-tighter text-black">
          Future by AI
        </h1>
        <p className="text-black/70 text-lg">
          Images prompted into existence using Gemini
        </p>
        <div className="flex gap-4">
          <GeminiButton onClick={onReplayClick}>
            Replay Intro
            <Image
              src={replayIcon}
              width={20}
              height={20}
              alt="replay"
              className="-mr-2"
            />
          </GeminiButton>

          <Link href="/controls">
            <GeminiButton>
              With Controls
              <Image
                src={chevronRight}
                width={24}
                height={24}
                alt="forward"
                className="-mr-2"
              />
            </GeminiButton>
          </Link>
        </div>
      </header>
      <section className="relative w-full py-24 flex justify-center">
        <GeminiParagraph />
      </section>
      <footer className="relative w-full h-[50vh] bg-black/5 p-16">
        <p className="text-xl text-black/80 text-center max-w-2xl mx-auto text-balance">
          Inspired by{" "}
          <a
            href="https://deepmind.google/technologies/imagen-3/"
            target="_blank"
            rel="noreferrer"
            className="underline text-blue hover:text-dark-blue"
          >
            DeepMind Imagen
          </a>{" "}
          header.{" "}
          <a
            href="https://github.com/prag-matt-ic/imagen-header-rebuild"
            target="_blank"
            rel="noreferrer"
            className="underline text-blue hover:text-dark-blue"
          >
            Code
          </a>{" "}
          by{" "}
          <a
            href="https://www.linkedin.com/in/matthewjfrawley/"
            target="_blank"
            rel="noreferrer"
          >
            Matthew Frawley
          </a>
        </p>
      </footer>

      <Leva hidden={true} />
    </main>
  );
}

const GeminiButton: FC<
  PropsWithChildren<HTMLAttributes<HTMLButtonElement>>
> = ({ children, ...buttonProps }) => {
  return (
    <button
      {...buttonProps}
      className="flex gap-2 rounded-full transition-all duration-200 px-7 py-3 font-semibold text-white bg-linear-90/oklch from-10% from-blue to-teal hover:shadow-md hover:from-dark-blue hover:to-dark-teal"
    >
      {children}
    </button>
  );
};

const GeminiParagraph: FC = () => {
  return (
    <div className="isolate size-fit bg-linear-90 from-blue to-teal bg-clip-text">
      <p className="max-w-4xl text-black text-balance font-medium text-xl md:text-4xl text-center tracking-tight leading-snug">
        Animated header based on the{" "}
        <span
          style={{
            WebkitTextFillColor: "transparent",
          }}
        >
          DeepMind Imagen
        </span>{" "}
        landing page. Taken to the next level with{" "}
        <span
          style={{
            WebkitTextFillColor: "transparent",
          }}
        >
          React Three Fiber
        </span>{" "}
        and{" "}
        <span
          style={{
            WebkitTextFillColor: "transparent",
          }}
        >
          Three.js Shading Language
        </span>
        . Supporting acts include GSAP and Tailwind CSS.
      </p>
    </div>
  );
};

// Setup the WebGPU renderer

// Load image with useTexture hook
// Display it on a plane with basic color node

// Fix the stretching and aspect ratio with UV transformation

// Generate a rounded box signed distance function (SDF) to add border radius
// Scale this using a uniform to create the reveal effect

// Setup a position node to rotate and translate the plane on enter

// Position the image components
// Setup an animation for each of their reveal effects

// Create UI components
// - CSS color function to generate darker blue and teal from the original colors
// - New Tailwind 4 gradient syntax
