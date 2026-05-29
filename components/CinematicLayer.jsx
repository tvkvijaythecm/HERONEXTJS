'use client';

import { useEffect, useRef } from 'react';
import styles from '../styles/CinematicLayer.module.css';

export default function CinematicLayer() {
  const canvasRef = useRef(null);
  const stateRef = useRef({ animating: true, mouse: { x: 0, y: 0 } });

  useEffect(() => {
    const state = stateRef.current;
    let THREE, renderer, scene, camera, particleMesh, geometry, material;
    let W = window.innerWidth;
    let H = window.innerHeight;
    let rafId;

    const buildBokehTexture = () => {
      const size = 128;
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      const cx = size / 2, cy = size / 2, r = size / 2;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0.00, 'rgba(255,255,255,1.00)');
      g.addColorStop(0.10, 'rgba(255,255,255,0.90)');
      g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
      g.addColorStop(0.65, 'rgba(255,255,255,0.07)');
      g.addColorStop(1.00, 'rgba(255,255,255,0.00)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      return c;
    };

    const init = async () => {
      THREE = await import('three');

      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(W, H);
      renderer.setClearColor(0x000000, 0);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 800);
      camera.position.set(0, 0, 90);

      // ── Palette ──────────────────────────────────────────────────
      // Warm cinematic: amber, gold, cream, rare blue-teal accent
      const paletteDef = [
        { hex: 0xff6b1a, weight: 0.25 }, // deep orange
        { hex: 0xffaa44, weight: 0.20 }, // amber
        { hex: 0xffd080, weight: 0.18 }, // warm gold
        { hex: 0xfff4d6, weight: 0.15 }, // cream white
        { hex: 0xe87c3e, weight: 0.12 }, // terracotta
        { hex: 0xffcc66, weight: 0.05 }, // honey
        { hex: 0x38b2ff, weight: 0.03 }, // cool blue accent (monitor glow)
        { hex: 0xa0d8ef, weight: 0.02 }, // icy blue accent
      ];

      const pickColor = () => {
        const r = Math.random();
        let acc = 0;
        for (const { hex, weight } of paletteDef) {
          acc += weight;
          if (r <= acc) return new THREE.Color(hex);
        }
        return new THREE.Color(0xffaa44);
      };

      // ── Particles ────────────────────────────────────────────────
      const COUNT = 380;
      const positions  = new Float32Array(COUNT * 3);
      const colors     = new Float32Array(COUNT * 3);
      const sizes      = new Float32Array(COUNT);
      const phaseArr   = new Float32Array(COUNT);
      const speedArr   = new Float32Array(COUNT);
      const origPos    = new Float32Array(COUNT * 3);

      for (let i = 0; i < COUNT; i++) {
        const x = (Math.random() - 0.5) * 220;
        const y = (Math.random() - 0.5) * 130;
        const z = (Math.random() - 0.5) * 90 - 5;
        positions[i * 3]     = origPos[i * 3]     = x;
        positions[i * 3 + 1] = origPos[i * 3 + 1] = y;
        positions[i * 3 + 2] = origPos[i * 3 + 2] = z;

        const col = pickColor();
        const lum = 0.25 + Math.random() * 0.75;
        colors[i * 3]     = col.r * lum;
        colors[i * 3 + 1] = col.g * lum;
        colors[i * 3 + 2] = col.b * lum;

        // Large dreamy bokeh circles + fine dust mix
        const isBokeh = Math.random() < 0.09;
        sizes[i]    = isBokeh ? 6 + Math.random() * 8 : 0.5 + Math.random() * 2.2;
        phaseArr[i] = Math.random() * Math.PI * 2;
        speedArr[i] = 0.10 + Math.random() * 0.28;
      }

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));
      geometry.userData = { origPos, phaseArr, speedArr };

      const bokehTexture = new THREE.CanvasTexture(buildBokehTexture());

      material = new THREE.ShaderMaterial({
        uniforms: {
          uTexture:  { value: bokehTexture },
          uOpacity:  { value: 0.72 },
          uTime:     { value: 0 },
        },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          varying float vDepth;
          uniform float uTime;
          void main() {
            vColor = color;
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vDepth = clamp((-mvPos.z - 0.0) / 150.0, 0.0, 1.0);
            gl_PointSize = size * (280.0 / -mvPos.z);
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: `
          uniform sampler2D uTexture;
          uniform float uOpacity;
          varying vec3 vColor;
          varying float vDepth;
          void main() {
            vec2 uv = gl_PointCoord;
            vec4 tex = texture2D(uTexture, uv);
            // Fade farther particles slightly
            float depthFade = 0.4 + vDepth * 0.6;
            gl_FragColor = vec4(vColor * tex.rgb, tex.a * uOpacity * depthFade);
          }
        `,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        vertexColors: false,
      });

      particleMesh = new THREE.Points(geometry, material);
      scene.add(particleMesh);

      // ── Mouse parallax ───────────────────────────────────────────
      const onMouse = (e) => {
        state.mouse.x = (e.clientX / W - 0.5) * 2;
        state.mouse.y = (e.clientY / H - 0.5) * 2;
      };
      const onTouch = (e) => {
        if (!e.touches[0]) return;
        state.mouse.x = (e.touches[0].clientX / W - 0.5) * 2;
        state.mouse.y = (e.touches[0].clientY / H - 0.5) * 2;
      };
      window.addEventListener('mousemove', onMouse, { passive: true });
      window.addEventListener('touchmove', onTouch, { passive: true });

      const onResize = () => {
        W = window.innerWidth; H = window.innerHeight;
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H);
      };
      window.addEventListener('resize', onResize);

      // ── Render loop ───────────────────────────────────────────────
      let t0 = performance.now();
      const tick = () => {
        if (!state.animating) return;
        rafId = requestAnimationFrame(tick);

        const t = (performance.now() - t0) * 0.001;
        material.uniforms.uTime.value = t;

        const pos   = geometry.attributes.position.array;
        const { origPos: op, phaseArr: ph, speedArr: sp } = geometry.userData;

        for (let i = 0; i < COUNT; i++) {
          const phi = ph[i], spd = sp[i];
          pos[i * 3]     = op[i * 3]     + Math.sin(t * spd       + phi)        * 2.8;
          pos[i * 3 + 1] = op[i * 3 + 1] + Math.sin(t * spd * 0.6 + phi + 1.2) * 2.0;
          pos[i * 3 + 2] = op[i * 3 + 2] + Math.cos(t * spd * 0.4 + phi)        * 1.4;
        }
        geometry.attributes.position.needsUpdate = true;

        // Smooth camera parallax
        camera.position.x += (state.mouse.x * 8  - camera.position.x) * 0.03;
        camera.position.y += (-state.mouse.y * 5 - camera.position.y) * 0.03;
        camera.rotation.z  = Math.sin(t * 0.04) * 0.015;
        camera.lookAt(0, 0, 0);

        // Breathing opacity pulse
        material.uniforms.uOpacity.value = 0.52 + Math.sin(t * 0.35) * 0.18;

        renderer.render(scene, camera);
      };
      tick();
    };

    init();

    return () => {
      state.animating = false;
      cancelAnimationFrame(rafId);
      geometry?.dispose();
      material?.dispose();
      renderer?.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
