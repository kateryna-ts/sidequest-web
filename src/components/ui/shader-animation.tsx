"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function ShaderAnimation({ speed = 1 }: { speed?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const speedRef = useRef(speed)

  useEffect(() => {
    if (speed > 1 && speedRef.current <= 1) {
      window.dispatchEvent(new Event('shader-burst'))
    }
    speedRef.current = speed
  }, [speed])

  const sceneRef = useRef<{
    camera: THREE.Camera
    scene: THREE.Scene
    renderer: THREE.WebGLRenderer
    uniforms: any
    animationId: number
  } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Vertex shader
    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `

    // Fragment shader
    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time*0.05;
        float lineWidth = 0.006;

        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++){
          for(int i=0; i < 5; i++){
            color[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*5.0 - length(uv) + mod(uv.x+uv.y, 0.2));
          }
        }
        
        gl_FragColor = vec4(color[0],color[1],color[2],1.0);
      }
    `

    // Initialize Three.js scene
    const camera = new THREE.Camera()
    camera.position.z = 1

    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2)

    const uniforms = {
      time: { type: "f", value: 1.0 },
      resolution: { type: "v2", value: new THREE.Vector2() },
    }

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)

    container.appendChild(renderer.domElement)

    // Handle window resize
    const onWindowResize = () => {
      if (!container) return
      const width = window.innerWidth
      const height = window.innerHeight
      renderer.setSize(width, height)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      uniforms.resolution.value.x = renderer.domElement.width
      uniforms.resolution.value.y = renderer.domElement.height
    }

    // Initial resize
    onWindowResize()
    window.addEventListener("resize", onWindowResize, false)

    // Animation loop & burst state
    let burst = 20 // start with a burst on enter page
    
    const handleBurst = () => { burst = 20 }
    window.addEventListener('shader-burst', handleBurst)

    const animate = () => {
      const animationId = requestAnimationFrame(animate)
      
      // Decay the burst smoothly down to 0
      burst += (0 - burst) * 0.05
      
      // Add any external speed prop plus the burst
      const currentSpeed = speedRef.current === 1 ? 0 : speedRef.current // override default 1 to 0
      const totalSpeed = currentSpeed + burst
      
      // Only increment time if there is speed, so it stops completely when idle
      if (totalSpeed > 0.01) {
        uniforms.time.value += 0.05 * totalSpeed
      }
      
      renderer.render(scene, camera)

      if (sceneRef.current) {
        sceneRef.current.animationId = animationId
      }
    }

    // Store scene references for cleanup
    sceneRef.current = {
      camera,
      scene,
      renderer,
      uniforms,
      animationId: 0,
    }

    // Start animation
    animate()

    // Cleanup function
    return () => {
      window.removeEventListener("resize", onWindowResize)
      window.removeEventListener('shader-burst', handleBurst)

      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId)

        if (container && sceneRef.current.renderer.domElement) {
          container.removeChild(sceneRef.current.renderer.domElement)
        }

        sceneRef.current.renderer.dispose()
        geometry.dispose()
        material.dispose()
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      style={{
        background: "#000",
        overflow: "hidden",
      }}
    />
  )
}
