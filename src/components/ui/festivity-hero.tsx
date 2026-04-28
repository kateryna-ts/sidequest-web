'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const FestivityHero = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const loadingCompleteRef = useRef(false)

  useEffect(() => {
    if (!canvasRef.current) return

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 24

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // camera drag
    let isMouseDown = false, mouseX = 0, mouseY = 0
    let targetRotX = 0, targetRotY = 0, rotX = 0, rotY = 0
    const onDown = (e: MouseEvent) => { isMouseDown = true; mouseX = e.clientX; mouseY = e.clientY }
    const onUp   = () => { isMouseDown = false }
    const onMove = (e: MouseEvent) => {
      if (!isMouseDown) return
      targetRotY += (e.clientX - mouseX) * 0.01
      targetRotX += (e.clientY - mouseY) * 0.01
      mouseX = e.clientX; mouseY = e.clientY
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup',   onUp)
    window.addEventListener('mousemove', onMove)

    const radii = [1,0.6,0.8,0.4,0.9,0.7,0.9,0.3,0.2,0.5,0.6,0.4,0.5,0.6,0.7,0.3,0.4,0.8,0.7,0.5,0.4,0.6,0.35,0.38,0.9,0.3,0.6,0.4,0.2,0.35,0.5,0.15,0.2,0.25,0.4,0.8,0.76,0.8,1,0.8,0.7,0.8,0.3,0.5,0.6,0.55,0.42,0.75,0.66,0.6,0.7,0.5,0.6,0.35,0.35,0.35,0.8,0.6,0.7,0.8,0.4,0.89,0.3,0.3,0.6,0.4,0.2,0.52,0.5,0.15,0.2,0.25,0.4,0.8,0.76,0.8,1,0.8,0.7,0.8,0.3,0.5,0.6,0.8,0.7,0.75,0.66,0.6,0.7,0.5,0.6,0.35,0.35,0.35,0.8,0.6,0.7,0.8,0.4,0.89,0.3]
    const positions = [
      {x:0,y:0,z:0},{x:1.2,y:0.9,z:-0.5},{x:1.8,y:-0.3,z:0},{x:-1,y:-1,z:0},{x:-1,y:1.62,z:0},
      {x:-1.65,y:0,z:-0.4},{x:-2.13,y:-1.54,z:-0.4},{x:0.8,y:0.94,z:0.3},{x:0.5,y:-1,z:1.2},
      {x:-0.16,y:-1.2,z:0.9},{x:1.5,y:1.2,z:0.8},{x:0.5,y:-1.58,z:1.4},{x:-1.5,y:1,z:1.15},
      {x:-1.5,y:-1.5,z:0.99},{x:-1.5,y:-1.5,z:-1.9},{x:1.85,y:0.8,z:0.05},{x:1.5,y:-1.2,z:-0.75},
      {x:0.9,y:-1.62,z:0.22},{x:0.45,y:2,z:0.65},{x:2.5,y:1.22,z:-0.2},{x:2.35,y:0.7,z:0.55},
      {x:-1.8,y:-0.35,z:0.85},{x:-1.02,y:0.2,z:0.9},{x:0.2,y:1,z:1},{x:-2.88,y:0.7,z:1},
      {x:-2,y:-0.95,z:1.5},{x:-2.3,y:2.4,z:-0.1},{x:-2.5,y:1.9,z:1.2},{x:-1.8,y:0.37,z:1.2},
      {x:-2.4,y:1.42,z:0.05},{x:-2.72,y:-0.9,z:1.1},{x:-1.8,y:-1.34,z:1.67},{x:-1.6,y:1.66,z:0.91},
      {x:-2.8,y:1.58,z:1.69},{x:-2.97,y:2.3,z:0.65},{x:1.1,y:-0.2,z:-1.45},{x:-4,y:1.78,z:0.38},
      {x:0.12,y:1.4,z:-1.29},{x:-1.64,y:1.4,z:-1.79},{x:-3.5,y:-0.58,z:0.1},{x:-0.1,y:-1,z:-2},
      {x:-4.5,y:0.55,z:-0.5},{x:-3.87,y:0,z:1},{x:-4.6,y:-0.1,z:0.65},{x:-3,y:1.5,z:-0.7},
      {x:-0.5,y:0.2,z:-1.5},{x:-1.3,y:-0.45,z:-1.5},{x:-3.35,y:0.25,z:-1.5},{x:-4.76,y:-1.26,z:0.4},
      {x:-4.32,y:0.85,z:1.4},{x:-3.5,y:-1.82,z:0.9},{x:-3.6,y:-0.6,z:1.46},{x:-4.55,y:-1.5,z:1.63},
      {x:-3.8,y:-1.15,z:2.1},{x:-2.9,y:-0.25,z:1.86},{x:-2.2,y:-0.4,z:1.86},{x:-5.1,y:-0.24,z:1.86},
      {x:-5.27,y:1.24,z:0.76},{x:-5.27,y:2,z:-0.4},{x:-6.4,y:0.4,z:1},{x:-5.15,y:0.95,z:2},
      {x:-6.2,y:0.5,z:-0.8},{x:-4,y:0.08,z:1.8},{x:2,y:-0.95,z:1.5},{x:2.3,y:2.4,z:-0.1},
      {x:2.5,y:1.9,z:1.2},{x:1.8,y:0.37,z:1.2},{x:3.24,y:0.6,z:1.05},{x:2.72,y:-0.9,z:1.1},
      {x:1.8,y:-1.34,z:1.67},{x:1.6,y:1.99,z:0.91},{x:2.8,y:1.58,z:1.69},{x:2.97,y:2.3,z:0.65},
      {x:-1.3,y:-0.2,z:-2.5},{x:4,y:1.78,z:0.38},{x:1.72,y:1.4,z:-1.29},{x:2.5,y:-1.2,z:-2},
      {x:3.5,y:-0.58,z:0.1},{x:0.1,y:0.4,z:-2.42},{x:4.5,y:0.55,z:-0.5},{x:3.87,y:0,z:1},
      {x:4.6,y:-0.1,z:0.65},{x:3,y:1.5,z:-0.7},{x:2.3,y:0.6,z:-2.6},{x:4,y:1.5,z:-1.6},
      {x:3.35,y:0.25,z:-1.5},{x:4.76,y:-1.26,z:0.4},{x:4.32,y:0.85,z:1.4},{x:3.5,y:-1.82,z:0.9},
      {x:3.6,y:-0.6,z:1.46},{x:4.55,y:-1.5,z:1.63},{x:3.8,y:-1.15,z:2.1},{x:2.9,y:-0.25,z:1.86},
      {x:2.2,y:-0.4,z:1.86},{x:5.1,y:-0.24,z:1.86},{x:5.27,y:1.24,z:0.76},{x:5.27,y:2,z:-0.4},
      {x:6.4,y:0.4,z:1},{x:5.15,y:0.95,z:2},{x:6.2,y:0.5,z:-0.8},{x:4,y:0.08,z:1.8}
    ]

    const material = new THREE.MeshLambertMaterial({ color: '#0099ff', emissive: '#0066cc', transparent: true, opacity: 0.55 })
    const sharedGeo = new THREE.SphereGeometry(1, 24, 24)
    const group = new THREE.Group()
    const spheres: THREE.Mesh[] = []

    positions.forEach((pos, i) => {
      const mesh = new THREE.Mesh(sharedGeo, material)
      mesh.scale.setScalar(radii[i])
      mesh.position.set(pos.x, -25, pos.z)
      mesh.userData = { originalPosition: pos, radius: radii[i] }
      spheres.push(mesh)
      group.add(mesh)
    })
    scene.add(group)

    scene.add(new THREE.AmbientLight(0xffffff, 1))
    const spot = new THREE.SpotLight(0xffffff, 0.52)
    spot.position.set(14, 24, 30); scene.add(spot)
    const dir = new THREE.DirectionalLight(0xffffff, 0.2)
    dir.position.set(0, -4, 0); scene.add(dir)

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const animVal = (obj: Record<string, number>, prop: string, from: number, to: number, dur: number, delay = 0) => {
      setTimeout(() => {
        const t0 = Date.now()
        const tick = () => {
          const p = Math.min((Date.now() - t0) / dur, 1)
          const e = 1 - Math.pow(1 - p, 3)
          obj[prop] = from + (to - from) * e
          if (p < 1) requestAnimationFrame(tick)
        }
        tick()
      }, delay)
    }

    const forces = new Map<string, THREE.Vector3>()
    const raycaster = new THREE.Raycaster()
    const mouse2 = new THREE.Vector2()
    const tmp = new THREE.Vector3()

    const onMouseInteract = (e: MouseEvent) => {
      if (!loadingCompleteRef.current) return
      mouse2.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse2.y = -(e.clientY / window.innerHeight) * 2 + 1
      raycaster.setFromCamera(mouse2, camera)
      const hits = raycaster.intersectObjects(spheres)
      if (hits.length > 0) {
        const s = hits[0].object as THREE.Mesh
        const f = new THREE.Vector3()
        f.subVectors(hits[0].point, s.position).normalize().multiplyScalar(0.2)
        forces.set(s.uuid, f)
      }
    }
    window.addEventListener('mousemove', onMouseInteract)

    // loading animation
    const REV_DUR = 2
    spheres.forEach((s, i) => {
      const delay = i * 20
      animVal(s.position as unknown as Record<string, number>, 'y', -25, REV_DUR * 2, REV_DUR * 500, delay)
      setTimeout(() => {
        animVal(s.position as unknown as Record<string, number>, 'y', s.position.y, -5, REV_DUR * 500)
      }, delay + REV_DUR * 500)
      setTimeout(() => {
        animVal(s.position as unknown as Record<string, number>, 'x', s.position.x, s.userData.originalPosition.x, 600)
        animVal(s.position as unknown as Record<string, number>, 'y', s.position.y, s.userData.originalPosition.y, 600)
        animVal(s.position as unknown as Record<string, number>, 'z', s.position.z, s.userData.originalPosition.z, 600)
      }, delay + REV_DUR * 1000)
    })

    setTimeout(() => { loadingCompleteRef.current = true }, (REV_DUR + 1) * 1000)

    const handleCollisions = () => {
      for (let i = 0; i < spheres.length; i++) {
        for (let j = i + 1; j < spheres.length; j++) {
          const a = spheres[i], b = spheres[j]
          const dist = a.position.distanceTo(b.position)
          const minD = (a.userData.radius + b.userData.radius) * 1.2
          if (dist < minD) {
            tmp.subVectors(b.position, a.position).normalize()
            const push = (minD - dist) * 0.4
            a.position.sub(tmp.clone().multiplyScalar(push))
            b.position.add(tmp.clone().multiplyScalar(push))
          }
        }
      }
    }

    let raf: number
    const breathSpeed = 0.002, breathAmp = 0.1
    const tick = () => {
      raf = requestAnimationFrame(tick)
      rotX = lerp(rotX, targetRotX, 0.05)
      rotY = lerp(rotY, targetRotY, 0.05)
      camera.position.x = Math.sin(rotY) * 24
      camera.position.z = Math.cos(rotY) * 24
      camera.position.y = Math.sin(rotX) * 10
      camera.lookAt(0, 0, 0)

      if (loadingCompleteRef.current) {
        group.rotation.y += 0.003
        const t = Date.now() * breathSpeed
        spheres.forEach((s, i) => {
          const off = i * 0.2
          const f = forces.get(s.uuid)
          if (f) {
            s.position.add(f)
            f.multiplyScalar(0.95)
            if (f.length() < 0.01) forces.delete(s.uuid)
          }
          const op = s.userData.originalPosition
          tmp.set(op.x, op.y + Math.sin(t + off) * breathAmp, op.z + Math.cos(t + off) * breathAmp * 0.5)
          s.position.lerp(tmp, 0.018)
        })
        handleCollisions()
      }
      renderer.render(scene, camera)
    }
    tick()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup',   onUp)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousemove', onMouseInteract)
      window.removeEventListener('resize',    onResize)
      scene.clear()
      sharedGeo.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

export default FestivityHero
