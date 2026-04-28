"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function DotMatrixBg({
  dotSize = 3,
  totalSize = 20,
}: {
  dotSize?: number
  totalSize?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current as HTMLDivElement

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.Camera()

    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        u_time:       { value: 0 },
        u_resolution: { value: new THREE.Vector2() },
        u_dot_size:   { value: dotSize },
        u_total_size: { value: totalSize },
      },
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;

        uniform float u_time;
        uniform vec2  u_resolution;
        uniform float u_dot_size;
        uniform float u_total_size;

        float PHI = 1.61803398874989484820459;

        float random(vec2 xy) {
          return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }

        void main() {
          vec2 st = gl_FragCoord.xy;
          st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
          st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));

          float inBounds = step(0.0, st.x) * step(0.0, st.y);

          vec2 cell = vec2(floor(st.x / u_total_size), floor(st.y / u_total_size));

          float freq = 5.0;
          float showOff = random(cell);
          float rand = random(cell * floor((u_time / freq) + showOff + freq));

          float opacities[10];
          opacities[0] = 0.15; opacities[1] = 0.15; opacities[2] = 0.2;
          opacities[3] = 0.25; opacities[4] = 0.25; opacities[5] = 0.3;
          opacities[6] = 0.4;  opacities[7] = 0.4;  opacities[8] = 0.5;
          opacities[9] = 0.6;

          float opacity = inBounds;
          opacity *= opacities[int(rand * 10.0)];
          opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
          opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

          // Intro: fade in from center outward
          vec2 centerCell = u_resolution * 0.5 / u_total_size;
          float dist = distance(centerCell, cell);
          float tOffset = dist * 0.012 + random(cell) * 0.2;
          opacity *= smoothstep(tOffset, tOffset + 0.08, u_time * 0.4);

          // parchment #f5f5f0
          vec3 color = vec3(0.961, 0.961, 0.941);

          gl_FragColor = vec4(color * opacity, opacity);
        }
      `,
    })

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    scene.add(mesh)

    const clock = new THREE.Clock()
    let animId: number

    function resize() {
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      material.uniforms.u_resolution.value.set(w, h)
    }

    function animate() {
      animId = requestAnimationFrame(animate)
      material.uniforms.u_time.value = clock.getElapsedTime()
      renderer.render(scene, camera)
    }

    resize()
    animate()
    window.addEventListener("resize", resize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
      renderer.dispose()
      material.dispose()
      const el = renderer.domElement
      if (el.parentNode === container) container.removeChild(el)
    }
  }, [dotSize, totalSize])

  return <div ref={containerRef} className="absolute inset-0" />
}
