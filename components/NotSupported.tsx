import React, { type FC } from "react";

const NotSupported: FC = () => {
  return (
    <section className="flex h-svh text-black flex-col items-center justify-center space-y-4 p-8 text-center">
      <h2 className="text-2xl font-medium tracking-tight">
        Not supported by this browser
      </h2>
      <p className="leading-loose text-blue">
        This experiences uses an experimental technology (WebGPU).
        <br />
        Please open it using a{" "}
        <a
          target="_blank"
          rel="noreferrer"
          className="underline text-blue hover:text-dark-blue"
          href="https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#browser_compatibility"
        >
          compatible browser
        </a>
        .
      </p>
    </section>
  );
};

export default NotSupported;
