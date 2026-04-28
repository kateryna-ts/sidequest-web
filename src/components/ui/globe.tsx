"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { motion } from "framer-motion"

const TAGS = [
  { label: "coffee",         top: "14%", left: "6%",  delay: 0   },
  { label: "grocery run",    top: "30%", left: "79%", delay: 0.9 },
  { label: "farmers market", top: "56%", left: "5%",  delay: 1.8 },
  { label: "bookstore",      top: "68%", left: "77%", delay: 2.7 },
  { label: "hike",           top: "20%", left: "71%", delay: 3.6 },
  { label: "cinema",         top: "74%", left: "17%", delay: 4.5 },
  { label: "thrift store",   top: "10%", left: "37%", delay: 5.4 },
  { label: "record store",   top: "82%", left: "51%", delay: 6.3 },
  { label: "plant nursery",  top: "43%", left: "85%", delay: 7.2 },
  { label: "wine shop",      top: "62%", left: "70%", delay: 8.1 },
]

const VISIBLE_DURATION = 5
const REPEAT_DELAY = TAGS.length * 0.9

export function Globe() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const w = mount.offsetWidth
    const h = mount.offsetHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
    camera.position.z = 4.2

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const group = new THREE.Group()

    group.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 64, 64),
      new THREE.MeshPhongMaterial({ color: 0x080818, emissive: 0x030310, shininess: 25 })
    ))

    group.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.405, 28, 28),
      new THREE.MeshBasicMaterial({ color: 0xf0e6d3, wireframe: true, transparent: true, opacity: 0.055 })
    ))

    const N = 280
    const positions = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const phi = Math.acos(1 - 2 * Math.random())
      const theta = Math.random() * Math.PI * 2
      const r = 1.43
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    const dotGeo = new THREE.BufferGeometry()
    dotGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    group.add(new THREE.Points(
      dotGeo,
      new THREE.PointsMaterial({ color: 0xf0e6d3, size: 0.02, transparent: true, opacity: 0.5 })
    ))
    scene.add(group)

    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.62, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0x5070b0, transparent: true, opacity: 0.07, side: THREE.BackSide })
    ))

    scene.add(new THREE.AmbientLight(0xffffff, 0.12))
    const key = new THREE.DirectionalLight(0xf0e6d3, 1.5)
    key.position.set(4, 2, 5)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x4060a0, 0.5)
    fill.position.set(-4, -1, -3)
    scene.add(fill)

    let raf: number
    const tick = () => {
      raf = requestAnimationFrame(tick)
      group.rotation.y += 0.0018
      renderer.render(scene, camera)
    }
    tick()

    const onResize = () => {
      const w2 = mount.offsetWidth
      const h2 = mount.offsetHeight
      camera.aspect = w2 / h2
      camera.updateProjectionMatrix()
      renderer.setSize(w2, h2)
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
      scene.clear()
      renderer.dispose()
      dotGeo.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="absolute inset-0" />
      {TAGS.map((tag) => (
        <motion.div
          key={tag.label}
          className="absolute rounded-full border border-white/15 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-md px-3 py-1.5 text-xs text-ink/70 dark:text-white/65 pointer-events-none select-none whitespace-nowrap"
          style={{ top: tag.top, left: tag.left }}
          initial={{ opacity: 0, scale: 0.7, y: 8 }}
          animate={{
            opacity: [0, 0, 0.9, 0.9, 0],
            scale:   [0.7, 0.7, 1,   1,   0.85],
            y:       [8,   8,   0,   0,   -6],
          }}
          transition={{
            duration:    VISIBLE_DURATION,
            delay:       tag.delay,
            repeat:      Infinity,
            repeatDelay: REPEAT_DELAY,
            ease:        "easeInOut",
          }}
        >
          {tag.label}
        </motion.div>
      ))}
    </div>
  )
}
