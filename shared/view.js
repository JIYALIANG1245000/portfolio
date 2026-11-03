/* 展示站专属：灯箱、光标、入场动画 */
(function () {
  const root = document.getElementById('app');
  R.data = window.CONTENT;
  R.render(root);

  /* 入场动画 */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  root.querySelectorAll('.sh,.pts li,.acc li,.si,.gc,.tc,.nums>div,.times,.layers li,.vwide,.vsplit,.ms figure,.g,.vs .vr,.end,.ct-row,.rb-h,.grp,.chp-i li,.chp-t').forEach(el => { el.classList.add('rv'); io.observe(el); });

  /* 灯箱 */
  const lb = document.createElement('div');
  lb.className = 'lb';
  lb.innerHTML = '<img alt=""><span class="x">CLOSE ✕</span><span class="pv">← PREV</span><span class="nx">NEXT →</span><span class="ct"></span>';
  document.body.appendChild(lb);
  const lbImg = lb.querySelector('img'), lbCt = lb.querySelector('.ct');
  let list = [], idx = 0;
  const show = () => { lbImg.src = R.src(list[idx], 1); lbCt.textContent = list.length > 1 ? `${idx + 1} / ${list.length}` : ''; lb.querySelector('.pv').style.display = lb.querySelector('.nx').style.display = list.length > 1 ? '' : 'none'; };
  root.addEventListener('click', e => {
    const im = e.target.closest('img[data-lb]');
    if (!im || im.closest('.thumbs,.rows,.acc .th,.sl')) return;
    if (im.dataset.lbset) list = im.dataset.lbset.split(',');
    else {
      const g = im.closest('[data-group]');
      list = g ? [...g.querySelectorAll('img[data-lb]')].map(x => x.dataset.lb) : [im.dataset.lb];
    }
    idx = Math.max(0, list.indexOf(im.dataset.lb)); show(); lb.classList.add('on');
  });
  const step = d => { idx = (idx + d + list.length) % list.length; show(); };
  lb.querySelector('.pv').onclick = e => { e.stopPropagation(); step(-1); };
  lb.querySelector('.nx').onclick = e => { e.stopPropagation(); step(1); };
  lb.onclick = e => { if (e.target === lb || e.target.classList.contains('x')) lb.classList.remove('on'); };
  addEventListener('keydown', e => {
    if (!lb.classList.contains('on')) return;
    if (e.key === 'Escape') lb.classList.remove('on');
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  /* 板块翻页：滚轮 / 键盘一次翻一个板块；手机和矮屏保持自然滚动 */
  const paged = () => innerWidth > 900 && innerHeight >= 560;
  const boards = () => [...root.querySelectorAll('.t-hero,.sec.fit,.rb')];
  const navH = () => root.querySelector('.nav').getBoundingClientRect().bottom;
  let busy = false, lastWheel = 0;
  function flip(dir) {
    const B = boards(), nb = navH(); let cur = 0, d = 1e9;
    B.forEach((b, i) => { const x = Math.abs(b.getBoundingClientRect().top - nb); if (x < d) { d = x; cur = i; } });
    const next = d > 4 ? (B[cur].getBoundingClientRect().top - nb > 0 === dir > 0 ? cur : cur + dir) : cur + dir;
    if (next < 0 || next >= B.length) return;
    busy = true;
    scrollTo({ top: B[next].getBoundingClientRect().top + scrollY - nb, behavior: 'smooth' });
    setTimeout(function rel() { if (performance.now() - lastWheel < 140) return setTimeout(rel, 60); busy = false; }, 620);
  }
  addEventListener('wheel', e => {
    if (!paged() || lb.classList.contains('on') || e.ctrlKey) return;
    const th = e.target.closest && e.target.closest('.thumbs');
    if (th && th.scrollHeight > th.clientHeight + 1) return;
    e.preventDefault(); lastWheel = performance.now();
    if (busy || Math.abs(e.deltaY) < 4) return;
    const dir = e.deltaY > 0 ? 1 : -1;
    if (R.SW && R.SW.wheel(dir)) { busy = true; setTimeout(function rel() { if (performance.now() - lastWheel < 140) return setTimeout(rel, 60); busy = false; }, 420); return; }
    flip(dir);
  }, { passive: false });
  addEventListener('keydown', e => {
    if (!paged() || lb.classList.contains('on') || /INPUT|TEXTAREA|VIDEO/.test(e.target.tagName)) return;
    const dir = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 }[e.key];
    if (!dir) return;
    e.preventDefault(); if (!busy) flip(dir);
  });

  /* 跟随光标 */
  if (R.data.theme.cursor && matchMedia('(pointer:fine)').matches) {
    const c = document.createElement('div'); c.className = 'cur'; document.body.appendChild(c);
    addEventListener('mousemove', e => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; });
    root.addEventListener('mouseover', e => c.classList.toggle('big', !!e.target.closest('img,.acc .row,.tab,.rows button,video')));
  }
})();
