export function initWebGLBackground({ reducedMotion = false } = {}) {
  const canvas = document.getElementById("webglBg");
  if (!canvas || typeof window.THREE === "undefined") return;

  const THREE = window.THREE;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.z = 64;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const particleCount = window.innerWidth < 768 ? 500 : 900;
  const positions = new Float32Array(particleCount * 3);
  const scales = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i += 1) {
    const stride = i * 3;
    positions[stride] = (Math.random() - 0.5) * 180;
    positions[stride + 1] = (Math.random() - 0.5) * 120;
    positions[stride + 2] = (Math.random() - 0.5) * 70;
    scales[i] = 0.25 + Math.random() * 1.2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));

  const material = new THREE.PointsMaterial({
    color: 0x88dcff,
    size: 0.5,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let rafId = 0;
  let last = 0;

  const render = (time) => {
    const delta = time - last;
    last = time;

    if (!reducedMotion) {
      points.rotation.y += delta * 0.00002;
      points.rotation.x += delta * 0.000008;
      points.position.y = Math.sin(time * 0.00025) * 2;
    }

    renderer.render(scene, camera);
    rafId = window.requestAnimationFrame(render);
  };

  const resize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener("resize", resize, { passive: true });
  rafId = window.requestAnimationFrame(render);

  return () => {
    window.cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };
}
