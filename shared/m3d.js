/* 3D 白模查看器：按需加载 three.js 与模型，所有视窗共用一个 WebGL 渲染器
   拖拽旋转视角；滚轮不拦截（仍用于翻页）；不在可视区时不渲染 */
(function () {
  const R3D = window.R3D = { geo: {}, wait: {}, views: [] };
  const base = () => (window.R && R.base) || '';
  const loadJS = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  let three = null;
  const needThree = () => three || (three = window.THREE ? Promise.resolve() : loadJS(base() + 'shared/vendor/three.min.js'));

  /* 模型文件以 R3D.add(key, base64) 的形式写成 js，file:// 下也能加载 */
  R3D.add = function (key, b64) {
    const bin = atob(b64), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const dv = new DataView(u8.buffer), n = dv.getUint32(0, true), ni = dv.getUint32(4, true), bs = dv.getUint32(8, true);
    const q = new Int16Array(u8.buffer, 16, n * 3), pos = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) pos[i] = q[i] / 65520;
    const off = 16 + n * 6, idx = bs === 2 ? new Uint16Array(u8.buffer.slice(off, off + ni * 2)) : new Uint32Array(u8.buffer.slice(off, off + ni * 4));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeVertexNormals(); g.computeBoundingBox();
    R3D.geo[key] = g;
    (R3D.wait[key] || []).forEach(f => f(g)); delete R3D.wait[key];
  };
  const loading = {};
  function getGeo(key) {
    if (R3D.geo[key]) return Promise.resolve(R3D.geo[key]);
    return new Promise((ok, no) => {
      (R3D.wait[key] = R3D.wait[key] || []).push(ok);
      if (!loading[key]) loading[key] = needThree().then(() => loadJS(base() + 'assets/3d/' + key + '.js')).catch(e => { loading[key] = null; no(e); });
    });
  }

  let rd, scene, cam, mat, mesh, hold;
  function init() {
    if (rd) return;
    rd = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rd.setClearColor(0x000000, 0);
    rd.outputEncoding = THREE.sRGBEncoding;
    scene = new THREE.Scene();
    cam = new THREE.PerspectiveCamera(28, 1, 0.01, 50);
    /* 仿 Blender 实体模式（Studio 灯光）：中性灰材质 + 柔和顶光/侧光，无彩色补光 */
    scene.add(new THREE.HemisphereLight(0xd8dce2, 0x2e2c2a, 0.42));
    const key = new THREE.DirectionalLight(0xffffff, 0.62); key.position.set(1.6, 2.6, 2.4); scene.add(key);
    const side = new THREE.DirectionalLight(0xffffff, 0.18); side.position.set(-2.4, 0.8, 1.2); scene.add(side);
    const back = new THREE.DirectionalLight(0xffffff, 0.22); back.position.set(0, 1.5, -3); scene.add(back);
    mat = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.7, metalness: 0, side: THREE.DoubleSide }); /* 衣物是单层面片，必须双面渲染，否则内壁被背面剔除 */
    hold = new THREE.Group(); scene.add(hold);
    mesh = new THREE.Mesh(undefined, mat); hold.add(mesh);
  }

  function draw(v) {
    const c = v.cv, r = c.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    rd.setSize(w, h, false);
    const g = v.g, bb = g.boundingBox, sz = new THREE.Vector3(), ct = new THREE.Vector3(); bb.getSize(sz); bb.getCenter(ct);
    mesh.geometry = g; mesh.position.set(-ct.x, -ct.y, -ct.z);
    hold.rotation.set(v.pitch, v.yaw, 0);
    const a = w / h, t = Math.tan(cam.fov * Math.PI / 360), rx = Math.hypot(sz.x, sz.z) / 2, ry = sz.y / 2;
    const d = Math.max(ry / t, rx / (t * a)) * 1.16 + rx;
    cam.aspect = a; cam.position.set(0, 0, d); cam.near = d / 50; cam.far = d * 4; cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
    rd.render(scene, cam);
    const x = v.ctx; x.clearRect(0, 0, w, h); x.drawImage(rd.domElement, 0, 0);
  }

  function visible(c) {
    if (!c.offsetParent) return false;
    const r = c.getBoundingClientRect();
    return r.width > 2 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  }
  let last = 0, raf = 0;
  function loop(ts) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    R3D.views = R3D.views.filter(v => v.cv.isConnected);
    if (!R3D.views.length) { cancelAnimationFrame(raf); raf = 0; return; }
    R3D.views.forEach(v => {
      if (!v.g || !visible(v.cv)) return;
      const idle = !v.drag && performance.now() - v.touched > 2600;
      if (idle) { v.yaw += dt * v.spin; v.dirty = 1; }
      const r = v.cv.getBoundingClientRect();
      if (r.width !== v.w || r.height !== v.h) { v.w = r.width; v.h = r.height; v.dirty = 1; }
      if (v.dirty) { v.dirty = 0; draw(v); }
    });
  }

  /* 点击部件小框：与主框互换模型和标签，主框展示该部件 */
  function swap(v) {
    const m3 = v.box.closest('.m3'), mb = m3 && m3.querySelector('.m3-main');
    if (!mb || v.box === mb || !v.g) return;
    const mv = R3D.views.find(x => x.box === mb); if (!mv || !mv.g) return;
    [mv.g, v.g] = [v.g, mv.g];
    const k = mb.dataset.m3d; mb.dataset.m3d = v.box.dataset.m3d; v.box.dataset.m3d = k;
    const ta = mb.querySelector('.m3-t'), tb = v.box.querySelector('.m3-t'), h = ta.innerHTML; ta.innerHTML = tb.innerHTML; tb.innerHTML = h;
    [mv, v].forEach(x => { x.yaw = -0.5; x.pitch = 0.08; x.dirty = 1; });
    v.touched = performance.now();
    mb.classList.remove('swp'); void mb.offsetWidth; mb.classList.add('swp');
  }
  function bindView(box) {
    const cv = box.querySelector('canvas'), key = box.dataset.m3d;
    const v = { box, cv, ctx: cv.getContext('2d'), g: null, yaw: -0.5, pitch: 0.08, spin: box.classList.contains('m3-main') ? 0 : 0.45, drag: 0, touched: 0, dirty: 1 };
    R3D.views.push(v);
    let px = 0, py = 0, sx = 0, sy = 0;
    cv.addEventListener('pointerdown', e => { if (e.button) return; v.drag = 1; px = sx = e.clientX; py = sy = e.clientY; cv.setPointerCapture(e.pointerId); box.classList.add('grab'); e.preventDefault(); e.stopPropagation(); });
    cv.addEventListener('pointermove', e => {
      if (!v.drag) return;
      const s = 5.2 / Math.max(240, cv.clientHeight);
      v.yaw += (e.clientX - px) * s; v.pitch = Math.max(-1.2, Math.min(1.2, v.pitch + (e.clientY - py) * s));
      px = e.clientX; py = e.clientY; v.touched = performance.now(); v.dirty = 1;
    });
    const up = e => {
      if (!v.drag) return; v.drag = 0; v.touched = performance.now(); box.classList.remove('grab');
      if (e.type === 'pointerup' && Math.hypot(e.clientX - sx, e.clientY - sy) < 5) swap(v);
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('dblclick', e => { e.stopPropagation(); v.yaw = -0.5; v.pitch = 0.08; v.touched = performance.now(); v.dirty = 1; });
    cv.addEventListener('click', e => e.stopPropagation());
    getGeo(key).then(g => { init(); v.g = g; v.dirty = 1; box.classList.add('ok'); if (!raf) raf = requestAnimationFrame(loop); })
      .catch(e => { box.classList.add('err'); box.dataset.err = String(e && e.message || e); console.warn('m3d', key, e); });
  }

  /* 进入可视区附近才开始加载，避免首屏就拉 8MB 模型 */
  let io = null;
  R3D.mount = function (root) {
    const boxes = [...root.querySelectorAll('[data-m3d]')];
    if (!boxes.length) return;
    if (!io) io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.querySelectorAll('[data-m3d]').forEach(bindView);
      if (!raf) raf = requestAnimationFrame(loop);
    }), { rootMargin: '120% 0px' });
    new Set(boxes.map(b => b.closest('.m3'))).forEach(m => io.observe(m));
  };
})();
