# DeepMind Imagen Website Header rebuild with ThreeJS and WebGPU 🌅

![header](https://github.com/prag-matt-ic/imagen-header-rebuild/blob/main/public/header.png?raw=true)

**A fun weekend project recreating the Imagen 3 video header in code.**

[Check it out!](https://imagen-header-rebuild.vercel.app/)

It's built with Next.js, Three.js (R3F), GSAP, and TailwindCSS.

I recorded a supplementary [Youtube video](https://youtu.be/DCjiZW82_Y0?si=YBZrCAZmjbCZB3AB) explaining the steps for creating the `image reveal plane` component. 

The benefit of having the scene run in realtime is that we can use the pointer and scroll positions to add a greater feeling of depth and interactivity.
This added interactivity comes with a computational expense, which may be why the team decided to pre-render [their version as a video here](https://deepmind.google/technologies/imagen-3/).

Feel free to explore, experiment, and share your feedback!
