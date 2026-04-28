"use client"

import React, { useEffect, useRef } from "react"

const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec3 u_color;
uniform vec3 u_background;

#define FC gl_FragCoord.xy
#define R resolution
#define T (time+660.)

float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;for(int i=0;i<5;i++){t+=a*noise(p);p*=mat2(1,-1.2,.2,1.2)*2.;a*=.5;}return t;}

void main(){
  vec2 uv=(FC-.5*R)/R.y;
  uv.x+=.25;
  uv*=vec2(2,1);

  float n=fbm(uv*.28-vec2(T*.01,0));
  float smoke=fbm(uv+vec2(0,T*.015)+n*2.);
  float smoke2=fbm(uv*1.4-vec2(0,T*.012)+n*1.5);
  float s=pow(max(smoke*smoke2*2.2,0.),1.4);

  vec3 col=mix(u_background, u_color, s*0.85);
  col=mix(u_background,col,min(time*.12,1.));
  col=clamp(col,0.,1.);
  O=vec4(col,1);
}`

class Renderer {
  private readonly vertexSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`
  private readonly vertices = [-1, 1, -1, -1, 1, 1, 1, -1]
  private gl: WebGL2RenderingContext
  private canvas: HTMLCanvasElement
  private program: WebGLProgram | null = null
  private vs: WebGLShader | null = null
  private fs: WebGLShader | null = null
  private buffer: WebGLBuffer | null = null
  private color: [number, number, number] = [0.5, 0.5, 0.5]
  private background: [number, number, number] = [0.08, 0.08, 0.08]

  constructor(canvas: HTMLCanvasElement, fragmentSource: string) {
    this.canvas = canvas
    this.gl = canvas.getContext("webgl2") as WebGL2RenderingContext
    this.setup(fragmentSource)
    this.init()
  }

  updateColor(newColor: [number, number, number]) {
    this.color = newColor
  }

  updateBackground(newBg: [number, number, number]) {
    this.background = newBg
  }

  updateScale() {
    const dpr = Math.max(1, window.devicePixelRatio)
    this.canvas.width = this.canvas.offsetWidth * dpr
    this.canvas.height = this.canvas.offsetHeight * dpr
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
  }

  private compile(shader: WebGLShader, source: string) {
    const gl = this.gl
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader))
    }
  }

  reset() {
    const { gl, program, vs, fs } = this
    if (!program) return
    if (vs) { gl.detachShader(program, vs); gl.deleteShader(vs) }
    if (fs) { gl.detachShader(program, fs); gl.deleteShader(fs) }
    gl.deleteProgram(program)
    this.program = null
  }

  private setup(fragmentSource: string) {
    const gl = this.gl
    this.vs = gl.createShader(gl.VERTEX_SHADER)
    this.fs = gl.createShader(gl.FRAGMENT_SHADER)
    const program = gl.createProgram()
    if (!this.vs || !this.fs || !program) return
    this.compile(this.vs, this.vertexSrc)
    this.compile(this.fs, fragmentSource)
    this.program = program
    gl.attachShader(this.program, this.vs)
    gl.attachShader(this.program, this.fs)
    gl.linkProgram(this.program)
  }

  private init() {
    const { gl, program } = this
    if (!program) return
    this.buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, "position")
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    (program as any).resolution = gl.getUniformLocation(program, "resolution");
    (program as any).time = gl.getUniformLocation(program, "time");
    (program as any).u_color = gl.getUniformLocation(program, "u_color");
    (program as any).u_background = gl.getUniformLocation(program, "u_background")
  }

  render(now = 0) {
    const { gl, program, buffer, canvas } = this
    if (!program || !gl.isProgram(program)) return
    gl.clearColor(...this.background, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.uniform2f((program as any).resolution, canvas.width, canvas.height)
    gl.uniform1f((program as any).time, now * 1e-3)
    gl.uniform3fv((program as any).u_color, this.color)
    gl.uniform3fv((program as any).u_background, this.background)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
}

const hexToRgb = (hex: string): [number, number, number] | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : null
}

interface SmokeBackgroundProps {
  smokeColor?: string
  bgColor?: string
  className?: string
}

export const SmokeBackground: React.FC<SmokeBackgroundProps> = ({
  smokeColor = "#808080",
  bgColor = "#141414",
  className = "w-full h-full",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const renderer = new Renderer(canvas, fragmentShaderSource)
    rendererRef.current = renderer
    const bg = hexToRgb(bgColor)
    if (bg) renderer.updateBackground(bg)

    const handleResize = () => renderer.updateScale()
    handleResize()
    window.addEventListener("resize", handleResize)

    let rafId: number
    const loop = (now: number) => {
      renderer.render(now)
      rafId = requestAnimationFrame(loop)
    }
    loop(0)

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(rafId)
      renderer.reset()
    }
  }, [])

  useEffect(() => {
    const rgb = hexToRgb(smokeColor)
    if (rgb) rendererRef.current?.updateColor(rgb)
  }, [smokeColor])

  useEffect(() => {
    const rgb = hexToRgb(bgColor)
    if (rgb) rendererRef.current?.updateBackground(rgb)
  }, [bgColor])

  return <canvas ref={canvasRef} className={className} />
}
