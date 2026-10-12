import { useEffect, useRef } from "react";
import * as THREE from "three";

// Full-screen liquid-bronze wave shader. Palette shifts bronze → sapphire with scroll.
const FRAG = `
varying vec2 vUv;
uniform float uTime; uniform vec2 uResolution; uniform vec2 uMouse; uniform float uScroll;
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  float aspect = uResolution.x / uResolution.y;
  float time = uTime * 0.08; float scroll = uScroll;
  float sd = scroll * 5.0;
  vec2 w = uv;
  w.x += sin(uv.y * 2.5 + time * 0.2 + sd) * 0.35;
  w.y += cos(uv.x * 2.5 - time * 0.15 - sd * 0.8) * 0.35;
  w.x += sin(uv.y * 1.2 - time * 0.1 - sd * 1.5) * 0.25;
  w.y += cos(uv.x * 1.2 + time * 0.18 + sd * 1.2) * 0.25;
  w += vec2(scroll * 0.04, -scroll * 0.02) + vec2(uMouse.x * aspect * 0.05, uMouse.y * 0.05);
  vec2 d1 = vec2(cos(0.6), sin(0.6)); vec2 d2 = vec2(cos(-0.7), sin(-0.7)); vec2 d3 = vec2(cos(1.2), sin(1.2));
  float w1 = sin(dot(w, d1) * 2.4 + time);
  float w2 = cos(dot(w, d2) * 3.2 - time * 1.4 + w1 * 0.4);
  float w3 = sin(dot(w, d3) * 4.0 + time * 1.8 + w2 * 0.5);
  float f = w1 * 0.5 + w2 * 0.35 + w3 * 0.15;
  float crest = pow(max(0.0, 1.0 - abs(f - 0.1)), 2.5) * 0.5 + pow(max(0.0, 1.0 - abs(f - 0.15)), 8.0) * 0.9;
  float t = smoothstep(0.0, 1.0, scroll);
  vec3 cs = mix(vec3(0.0010,0.0006,0.0004), vec3(0.0004,0.0006,0.0012), t);
  vec3 c1 = mix(vec3(0.085,0.040,0.015), vec3(0.015,0.035,0.065), t);
  vec3 c2 = mix(vec3(0.050,0.022,0.008), vec3(0.008,0.020,0.045), t);
  vec3 cc = mix(vec3(0.45,0.30,0.18), vec3(0.18,0.35,0.55), t);
  vec3 col = mix(cs, c2, smoothstep(-0.6, 0.2, f));
  col = mix(col, c1, smoothstep(0.0, 0.8, f));
  col += cc * crest * 1.4;
  col *= 1.0 - dot(uv, uv) * 0.12;
  gl_FragColor = vec4(col, 1.0);
}`;

export default function BronzeBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uMouse: { value: new THREE.Vector2() },
      uScroll: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }",
      fragmentShader: FRAG,
      uniforms,
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      const s = renderer.getDrawingBufferSize(new THREE.Vector2());
      uniforms.uResolution.value.copy(s);
    };
    resize();

    let tx = 0, ty = 0, mx = 0, my = 0, scroll = 0, raf;
    const onMove = (e) => { tx = (e.clientX / window.innerWidth) * 2 - 1; ty = (e.clientY / window.innerHeight) * 2 - 1; };
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);

    const clock = new THREE.Clock();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const target = max > 0 ? window.scrollY / max : 0;
      scroll += (target - scroll) * 0.025;
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      uniforms.uTime.value = clock.getElapsedTime();
      uniforms.uMouse.value.set(mx, -my);
      uniforms.uScroll.value = scroll;
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      mat.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 w-full h-full -z-10 pointer-events-none" aria-hidden="true" />;
}