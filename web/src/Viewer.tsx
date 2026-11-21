import { useEffect, useRef } from "react";
import * as THREE from "three";

export function Viewer({ box }: { box: [number, number, number] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const w = el.clientWidth, h = el.clientHeight;
    const r = new THREE.WebGLRenderer({ antialias: true });
    r.setSize(w, h);
    r.setClearColor(0xe9e7e1);
    el.appendChild(r.domElement);
    const s = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    cam.position.set(4, 3, 5);
    cam.lookAt(0, box[1] / 2, 0);
    s.add(new THREE.AmbientLight(0xffffff, 0.8));
    const d = new THREE.DirectionalLight(0xffffff, 1.2);
    d.position.set(5, 8, 4);
    s.add(d);
    const m = new THREE.Mesh(new THREE.BoxGeometry(...box), new THREE.MeshStandardMaterial({ color: 0x8a949c }));
    m.position.y = box[1] / 2;
    s.add(m);
    s.add(new THREE.GridHelper(8, 16, 0x999999, 0xcccccc));
    let id = 0;
    const loop = () => { m.rotation.y += 0.005; r.render(s, cam); id = requestAnimationFrame(loop); };
    loop();
    return () => { cancelAnimationFrame(id); r.dispose(); el.removeChild(r.domElement); };
  }, [box]);
  return <div className="viewer" ref={ref} />;
}
