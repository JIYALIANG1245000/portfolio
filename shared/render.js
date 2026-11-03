/* 共享渲染器：展示站与编辑站共用。输入 window.CONTENT，输出整页 DOM。
   编辑站设置 R.edit=true 后，所有 data-path 文本可改、data-img 图片可选。 */
(function () {
  const R = window.R = { base: '', edit: false, data: null, ui: {} };

  /* 每种模块可选的布局（编辑站据此生成下拉框） */
  R.LAYOUTS = {
    hero: { strip: '竖条拼墙', single: '单图主视觉' },
    marquee: { run: '跑马灯' },
    stats: { row: '数据墙' },
    video: { wide: '通栏视频', split: '视频 + 截图' },
    gallery: { hscroll: '横向滚动', grid: '卡片网格', masonry: '瀑布流' },
    feature: { split: '左文右图', cols: '上文下图' },
    steps: { tabs: '上方页签', list: '左侧清单', stack: '分步网格' },
    compare: { slider: '拖拽对比', table: '对照表' },
    tools: { compare: '图像对比', tabs: '页签切换' },
    chapter: { index: '章节目录' },
    rail: { rail: '左侧步骤导轨', tabs: '步骤页签' },
    split: { flow: '原画→拆分→三视图→3D', tabs: '部件页签' },
    contact: { big: '大字结尾' }
  };
  R.TYPE_NAMES = { hero: '首屏', marquee: '跑马灯', stats: '数据', video: '视频', gallery: '画廊', feature: '图文', steps: '流程', compare: '对比', tools: '工具箱', contact: '联系', split: '智能拆分', chapter: '章节', rail: '步骤导轨' };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  R.get = (o, p) => p.split('.').reduce((a, k) => a == null ? a : a[k], o);
  R.set = (o, p, v) => { const ks = p.split('.'), l = ks.pop(); ks.reduce((a, k) => a[k], o)[l] = v; };
  R.src = (id, big) => `${R.base}assets/${big ? 'img' : 'thumb'}/${id}.webp`;
  R.ratio = id => { const a = (window.ASSETS || {})[id]; return a ? a[0] / a[1] : 1; };
  const ttl = v => String(v == null ? '' : v).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const pad2 = n => String(n + 1).padStart(2, '0');

  /* 可编辑文本 */
  function t(path, tag, cls, opt) {
    const v = R.get(R.data, path);
    if (!R.edit && (v == null || v === '') && !(opt && opt.keep)) return '';
    return `<${tag} class="${cls || ''}" data-path="${path}">${v == null ? '' : v}</${tag}>`;
  }
  /* 描述：bullet 开启时每一行前面加小绿点 */
  function dsc(path, cls, bullet) {
    const v = R.get(R.data, path);
    if (!R.edit && (v == null || v === '')) return '';
    const multi = /<br\s*\/?>/i.test(String(v == null ? '' : v));
    const on = bullet === true || (bullet == null && multi);      // 未显式设置时：多行自动带点
    if (!on) return `<p class="${cls || ''}" data-path="${path}">${v == null ? '' : v}</p>`;
    const body = String(v == null ? '' : v).split(/<br\s*\/?>/i)
      .map(x => `<span class="bl">${x}</span>`).join('');
    return `<p class="${(cls || '') + ' bullets'}" data-path="${path}">${body}</p>`;
  }
  /* 图片 */
  function im(ref, ip, o) {
    o = o || {};
    const lb = o.set ? ` data-lbset="${o.set}"` : '';
    const sz = (window.ASSETS || {})[ref.id];
    const wh = sz ? ` width="${sz[0]}" height="${sz[1]}"` : '';
    return `<img src="${R.src(ref.id, o.big)}"${wh} data-img="${ip}" data-lb="${ref.id}"${lb} loading="lazy" alt="${esc(ref.cap || '')}">`;
  }
  function fig(ref, ip, o) {
    o = o || {};
    const st = o.ar ? ` style="aspect-ratio:${o.ar}"` : '';
    return `<figure class="${o.cls || ''}"${st}>${im(ref, ip, o)}${ref.cap ? `<figcaption>${esc(ref.cap)}</figcaption>` : ''}</figure>`;
  }
  const setOf = arr => (arr || []).map(x => x.id).join(',');
  function head(s, p, cls) {
    return `<div class="sh ${cls || ''}">${t(p + '.kicker', 'small', 'k')}${t(p + '.title', 'h2', 'h')}${dsc(p + '.desc', 'd', s.bullet)}</div>`;
  }
  function times(s, p) {
    if (!s.times || !s.times.length) return '';
    return `<div class="times" style="--n:${s.times.length}">${s.times.map((x, i) =>
      `<div>${t(`${p}.times.${i}.num`, 'strong', '', { keep: 1 })}${t(`${p}.times.${i}.unit`, 'sup', '')}${t(`${p}.times.${i}.desc`, 'span', '')}</div>`).join('')}</div>`;
  }

  const T = R.T = {};

  /* ---------- 首屏 ---------- */
  T.hero = {
    strip(s, p) {
      return `<div class="strip" data-group>${s.images.map((x, i) => `<div>${im(x, `${p}.images.${i}`, { big: 1 })}</div>`).join('')}</div>
      <div class="hero-in">${t(p + '.kicker', 'small', 'k')}${t(p + '.title', 'h1', 'h')}
      <div class="row">${t(p + '.desc', 'p', 'd')}<span class="scroll">SCROLL ↓</span></div></div>`;
    },
    single(s, p) {
      const x = s.images[0];
      return `<div class="single" data-group>${x ? im(x, `${p}.images.0`, { big: 1 }) : ''}</div>
      <div class="hero-in">${t(p + '.kicker', 'small', 'k')}${t(p + '.title', 'h1', 'h')}
      <div class="row">${t(p + '.desc', 'p', 'd')}<span class="scroll">SCROLL ↓</span></div></div>`;
    }
  };

  T.marquee = {
    run(s, p) {
      const one = s.items.map((x, i) => `<b data-path="${p}.items.${i}.title">${x.title}</b><i>✦</i>`).join('');
      const ro = s.items.map(x => `<b>${x.title}</b><i>✦</i>`).join('');
      return `<div class="mq"><div>${one}${ro}${ro}${ro}</div></div>`;
    }
  };

  T.stats = {
    row(s, p) {
      return `<div class="nums" style="--n:${s.items.length}">${s.items.map((x, i) =>
        `<div>${t(`${p}.items.${i}.num`, 'strong', '', { keep: 1 })}${t(`${p}.items.${i}.unit`, 'sup', '')}${t(`${p}.items.${i}.desc`, 'span', '')}</div>`).join('')}</div>`;
    }
  };

  /* ---------- 视频 ---------- */
  function vid(s) {
    if (!s.video) return '';
    const vr = { intro: [1899, 962], reel: [16, 9] }[s.video] || [16, 9];
    return `<video width="${vr[0]}" height="${vr[1]}" src="${R.base}assets/video/${s.video}.mp4" poster="${R.base}assets/video/${s.video}.jpg" controls playsinline preload="none" ${s.video === 'reel' ? 'muted loop' : ''}></video>`;
  }
  T.video = {
    wide(s, p) {
      return `${head(s, p, 'two')}<div class="vwide">${vid(s)}</div>${grid(s.images, p + '.images', s.style.cols || 3)}`;
    },
    split(s, p) {
      return `${head(s, p, 'two')}<div class="vsplit"><div class="vbox">${vid(s)}</div>
        <div class="vstill" data-group>${(s.images || []).map((x, i) => fig(x, `${p}.images.${i}`, { cls: 'c' })).join('')}</div></div>`;
    }
  };

  function grid(arr, ip, cols, o) {
    if (!arr || !arr.length) return '';
    o = o || {};
    return `<div class="g" style="--c:${cols}" data-group>${arr.map((x, i) => fig(x, `${ip}.${i}`, { cls: o.fit === 'contain' ? 'ct' : '', ar: o.ar })).join('')}</div>`;
  }
  function masonry(arr, ip, cols) {
    if (!arr || !arr.length) return '';
    return `<div class="ms" style="--c:${cols}" data-group>${arr.map((x, i) => fig(x, `${ip}.${i}`)).join('')}</div>`;
  }

  /* ---------- 画廊 ---------- */
  T.gallery = {
    hscroll(s, p) {
      const cards = s.items.map((it, i) => {
        const x = it.images[0]; if (!x) return '';
        const n = it.images.length;
        return `<div class="card" style="aspect-ratio:${R.ratio(x.id).toFixed(3)}"><span class="kn">${i + 1}</span>
          <div class="im">${im(x, `${p}.items.${i}.images.0`, { big: 1, set: setOf(it.images) })}${n > 1 ? `<em class="cnt">+${n - 1}</em>` : ''}</div>
          <div class="cap"><b>${pad2(i)}</b>${t(`${p}.items.${i}.title`, 'span', '', { keep: 1 })}${t(`${p}.items.${i}.tag`, 'i', '')}</div></div>`;
      }).join('');
      return `<div class="pin"><div class="track">${head(s, p, 'intro')}${cards}<div class="tail"></div></div></div>`;
    },
    grid(s, p) {
      const c = s.style.cols || 3;
      return `${head(s, p, 'two')}<div class="cards" style="--c:${c}">${s.items.map((it, i) => {
        const x = it.images[0]; if (!x) return '';
        return `<div class="gc"><div class="im ${s.style.fit === 'contain' ? 'ct' : ''}">${im(x, `${p}.items.${i}.images.0`, { big: 1, set: setOf(it.images) })}${it.images.length > 1 ? `<em class="cnt">+${it.images.length - 1}</em>` : ''}</div>
          <div class="cap"><b>${pad2(i)}</b>${t(`${p}.items.${i}.title`, 'span', '', { keep: 1 })}${t(`${p}.items.${i}.tag`, 'i', '')}</div></div>`;
      }).join('')}</div>`;
    },
    masonry(s, p) {
      const all = [];
      s.items.forEach((it, i) => it.images.forEach((x, k) => all.push([x, `${p}.items.${i}.images.${k}`])));
      return `${head(s, p, 'two')}<div class="ms" style="--c:${s.style.cols || 4}" data-group>${all.map(([x, ip]) => fig(x, ip)).join('')}</div>`;
    }
  };

  /* ---------- 图文 ---------- */
  function points(s, p) {
    return `<ol class="pts">${s.items.map((x, i) => `<li><em>${pad2(i)}</em><div>${t(`${p}.items.${i}.title`, 'h3', '', { keep: 1 })}${t(`${p}.items.${i}.desc`, 'p', '')}</div></li>`).join('')}</ol>`;
  }
  T.feature = {
    split(s, p) {
      return `<div class="fsplit"><div class="fl-l">${head(s, p)}${points(s, p)}</div>
        <div class="fl-r" data-group>${s.images.map((x, i) => fig(x, `${p}.images.${i}`, { cls: 'nat' })).join('')}</div></div>`;
    },
    cols(s, p) {
      return `${head(s, p, 'two')}<div class="pcols" style="--n:${s.items.length}">${points(s, p)}</div>${masonry(s.images, p + '.images', s.style.cols || 2)}`;
    }
  };

  function groupsOf(it, ip) {
    const a = it.groups || []; if (!a.length) return '';
    return `<div class="grp" style="--n:${a.length}">${a.map((g, i) => {
      const x = g.images[0]; if (!x) return '';
      return `<div class="gc"><div class="im">${im(x, `${ip}.groups.${i}.images.0`, { set: setOf(g.images) })}${g.images.length > 1 ? `<em class="cnt">+${g.images.length - 1}</em>` : ''}</div>
        <div class="cap"><b>${pad2(i)}</b>${t(`${ip}.groups.${i}.title`, 'span', '', { keep: 1 })}</div></div>`;
    }).join('')}</div>`;
  }

  /* ---------- 流程 ---------- */
  function stageOf(it, ip) {
    const a = it.images || [];
    if (!a.length) return '<div class="stage"></div>';
    return `<div class="stage ${it.fill ? 'fill' : ''}"><div class="main ${'ct'}" data-group>${im(a[0], ip + '.images.0', { big: 1, set: setOf(a) })}</div>
      ${a.length > 1 ? `<div class="thumbs">${a.map((x, k) => `<button class="${k ? '' : 'on'}" data-k="${k}">${im(x, `${ip}.images.${k}`)}</button>`).join('')}</div>` : ''}</div>`;
  }
  /* ---------- 矩阵出图：数量计算流程 ---------- */
  const F = 'fill="currentColor"', FL = 'fill="currentColor" fill-opacity=".2"';
  const ICON = R.ICON = {
    /* 宝剑：剑尖朝右上，剑脊、云头护手、缠绳剑柄、剑首、剑穗 */
    sword: `<g transform="rotate(45 24 24)"><path d="M24 1.5L27.2 7V30.5H20.8V7Z" ${FL}/><path d="M24 6.5V28.5" stroke-width="1.3"/>
      <path d="M13.5 31.4Q15 30.4 17 30.6H31Q33 30.4 34.5 31.4Q33.6 34 31 34H17Q14.4 34 13.5 31.4Z" ${F}/>
      <rect x="21.7" y="34" width="4.6" height="8.2" rx="1.2" ${FL}/><path d="M21.9 36.7L26.1 35.5M21.9 39.3L26.1 38.1M21.9 41.9L26.1 40.7" stroke-width="1.3"/>
      <circle cx="24" cy="44.8" r="2.5" ${F}/></g><path d="M9.3 41.3C8.4 43.2 10.2 44.4 9.4 46.4" stroke-width="1.5"/><path d="M7.9 45.2L9.4 47.4L10.9 45.2" stroke-width="1.5"/>`,
    /* 葫芦：上小下大的亚腰形、藤蒂与叶片、腰间系绳垂穗、高光 */
    gourd: `<path d="M24 9.6C28.6 9.6 31.2 13 31.2 16.9C31.2 19.9 29.6 22 28.3 23.5C33.4 25.2 36.8 28.9 36.8 33.6C36.8 40 31.2 44.5 24 44.5C16.8 44.5 11.2 40 11.2 33.6C11.2 28.9 14.6 25.2 19.7 23.5C18.4 22 16.8 19.9 16.8 16.9C16.8 13 19.4 9.6 24 9.6Z" ${FL}/>
      <path d="M24 9.6C24 7.6 24.6 5.6 26.2 4.2"/><path d="M25.6 6.2C27.8 3.2 31.8 3 34 4.6C32 7.6 28.2 8.2 25.6 6.2Z" fill="currentColor" fill-opacity=".55"/>
      <path d="M19.4 23.3Q24 25.7 28.6 23.3" stroke-width="2.6"/><path d="M27.6 24.5C30.4 26.1 31 28.8 29.8 31.3" stroke-width="1.5"/><circle cx="29.6" cy="32.4" r="1.3" ${F}/>
      <path d="M15.8 31.2C16.4 28.6 18.2 27.2 20.4 26.6" stroke-width="1.6" opacity=".7"/><path d="M19.8 14.6C20.3 13.1 21.4 12.2 22.8 11.9" stroke-width="1.4" opacity=".7"/>`,
    /* 灯笼：提绳、上下木圈、鼓形灯身与竹骨、流苏 */
    lantern: `<path d="M24 2.5V8"/><rect x="16.5" y="8" width="15" height="3.4" rx="1.2" ${F}/><ellipse cx="24" cy="24" rx="13.5" ry="12.6" ${FL}/>
      <path d="M24 11.4V36.6" stroke-width="1.3"/><ellipse cx="24" cy="24" rx="6.8" ry="12.6" stroke-width="1.3"/><path d="M10.9 21H37.1M10.9 27H37.1" stroke-width="1" opacity=".5"/>
      <rect x="16.5" y="36.6" width="15" height="3.4" rx="1.2" ${F}/><path d="M20.5 40V46M24 40V47M27.5 40V46" stroke-width="1.5"/>`,
    star: `<path d="M24 7L29.2 17.6L41 19.4L32.4 27.6L34.4 39.2L24 33.8L13.6 39.2L15.6 27.6L7 19.4L18.8 17.6Z" ${FL}/>`
  };
  /* 折扇：按角度生成扇骨与褶面，深浅相间表现折痕 */
  ICON.fan = (() => {
    const cx = 24, cy = 35, R = 27, r = 10, N = 8, A = 56;
    const P = (d, a) => { a *= Math.PI / 180; return `${(cx + d * Math.sin(a)).toFixed(2)} ${(cy - d * Math.cos(a)).toFixed(2)}`; };
    const ang = i => -A + 2 * A * i / N;
    let h = '';
    for (let i = 0; i <= N; i++) h += `<path d="M${cx} ${cy}L${P(r, ang(i))}" stroke-width="1.3"/>`;
    for (let i = 0; i < N; i++) h += `<path d="M${P(r, ang(i))}L${P(R, ang(i))}L${P(R, ang(i + 1))}L${P(r, ang(i + 1))}Z" fill="currentColor" fill-opacity="${i % 2 ? .14 : .4}" stroke="none"/>`;
    for (let i = 1; i < N; i++) h += `<path d="M${P(r, ang(i))}L${P(R, ang(i))}" stroke-width="1.1" opacity=".55"/>`;
    let o = `M${P(r, -A)}`; for (let i = 0; i <= N; i++) o += `L${P(R, ang(i))}`;
    h += `<path d="${o}L${P(r, A)}A${r} ${r} 0 0 0 ${P(r, -A)}Z"/>`;
    h += `<path d="M${cx} ${cy}L${P(R + .6, -A)}M${cx} ${cy}L${P(R + .6, A)}" stroke-width="2.6"/>`;
    h += `<circle cx="${cx}" cy="${cy}" r="2.4" ${F}/><path d="M24 37.4C23 40 25 41.6 24 44.4" stroke-width="1.5"/><path d="M22.6 43L24 45.4L25.4 43" stroke-width="1.5"/>`;
    return h;
  })();
  const svgI = R.svgI = k => `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;
  const FLIM = { T: [1, 4], P: [1, 3], N: [1, 8] };
  function flowHTML(f, ip) {
    const T = f.tasks.slice(0, f.T), H = f.heads || [], tot = f.T * f.P * f.N;
    return `<div class="mf" data-flow="${ip}">
      <div class="mf-h"><div class="mf-hd ghost">·</div><div class="mf-in">${[0, 1, 2, 3].map(k => `<div class="mf-hd" data-k="${k + 1}">${esc(H[k] || '')}</div>`).join('')}</div><div class="mf-hd" data-k="5">${esc(H[4] || '')}</div></div>
      <div class="mf-b"><svg class="mf-w"></svg>
        <div class="mf-rl"><div class="mf-root mf-n" data-k="0"><div class="mf-ic">${svgI('star')}${svgI('sword')}</div>${t(ip + '.flow.title', 'h4', '', { keep: 1 })}${t(ip + '.flow.sub', 'p', '')}</div>${t(ip + '.flow.note', 'p', 'mf-note')}</div>
        <div class="mf-gs">${T.map((x, i) => `<div class="mf-g" data-t="${i}" style="--c:${x.color}">
          <div class="mf-task mf-n" data-k="1" data-t="${i}"><div class="mf-ib">${svgI(x.icon in ICON ? x.icon : 'star')}</div><b>任务 ${i + 1}</b>${t(`${ip}.flow.tasks.${i}.name`, 'span', '', { keep: 1 })}</div>
          <div class="mf-box mf-n" data-k="2" data-t="${i}">${x.prompts.slice(0, f.P).map((q, k) => `<div class="mf-pi" title="${esc(q)}"><em>${k + 1}</em>${t(`${ip}.flow.tasks.${i}.prompts.${k}`, 'p', '', { keep: 1 })}</div>`).join('')}</div>
          <div class="mf-box mf-n" data-k="3" data-t="${i}">${x.prompts.slice(0, f.P).map(() => `<div class="mf-oi"><div class="mf-tl">${'<i></i>'.repeat(f.N)}</div><strong>×${f.N}</strong></div>`).join('')}</div>
          <div class="mf-sub mf-n" data-k="4" data-t="${i}"><strong><b class="mf-c" data-v="${f.P * f.N}">0</b><small>张</small></strong><span>(${f.P} × ${f.N})</span></div></div>`).join('')}</div>
        <div class="mf-fin mf-n" data-k="5"><b>${esc(H[4] || '')}</b><div class="mf-fic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><rect x="8" y="5.5" width="8" height="4" rx="1"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01" stroke-width="2.4" stroke-linecap="round"/></svg></div>
          <strong><span class="mf-tot">0</span><small>张</small></strong><ul><li><span>${f.T}</span>（${esc(H[0] || '')}）</li><li>× <span>${f.P}</span>（${esc(H[1] || '')}）</li><li>× <span>${f.N}</span>（${esc(H[2] || '')}）</li><li class="eq">= ${tot} 张</li></ul></div></div>
      <div class="mf-ctl">${[['T', H[0]], ['P', H[1]], ['N', H[2]]].map(([k, l], i) => `${i ? '<span class="mf-sep"></span>' : ''}<div class="mf-st" data-s="${['任务', '润色', '每条'][i]}">${esc(l || '')}<div class="mf-num"><button data-p="${k}" data-d="-1" ${f[k] <= FLIM[k][0] ? 'disabled' : ''}>−</button><output>${f[k]}</output><button data-p="${k}" data-d="1" ${f[k] >= FLIM[k][1] ? 'disabled' : ''}>+</button></div></div>`).join('')}
        <div class="mf-fx">计算公式：${f.T} × ${f.P} × ${f.N} = <span>${tot} 张</span></div><button class="mf-play">▶ 重新演示</button></div></div>`;
  }
  /* 流程图：自适应 + 连线 + 分步点亮 */
  function flowFit(m) {
    const f = R.get(R.data, m.dataset.flow + '.flow'); if (!f || !m.offsetParent) return;
    m.querySelectorAll('.mf-pi').forEach(el => { const p = el.querySelector('p'); if (p) p.style.webkitLineClamp = Math.max(1, Math.min(3, Math.floor((el.clientHeight - 4) / 18.6))); });
    m.querySelectorAll('.mf-oi').forEach(el => {
      const h = el.clientHeight, w = el.clientWidth - 16 - el.querySelector('strong').offsetWidth - 10;
      el.querySelector('.mf-tl').style.setProperty('--ts', Math.max(6, Math.min(22, h - 8, Math.floor((w - (f.N - 1) * 4) / f.N))) + 'px');
    });
    const bd = m.querySelector('.mf-b'), B = bd.getBoundingClientRect(), W = m.querySelector('.mf-w');
    const Q = el => { const r = el.getBoundingClientRect(); return { l: r.left - B.left, r: r.right - B.left, y: (r.top + r.bottom) / 2 - B.top }; };
    const cv = (x1, y1, x2, y2) => { const k = (x2 - x1) * .55; return `M${x1},${y1} C${x1 + k},${y1} ${x2 - k},${y2} ${x2},${y2}`; };
    let h = ''; const add = (d, k, i, c, dash, tip) => {
      h += `<path class="bs ${dash ? 'ds' : ''}" d="${d}" data-k="${k}" data-t="${i}"/><path class="fl" d="${d}" data-k="${k}" data-t="${i}" style="--c:${c}"/>`;
      if (tip) h += `<path class="tp" d="M${tip[0] - 6},${tip[1] - 4} L${tip[0]},${tip[1]} L${tip[0] - 6},${tip[1] + 4}Z" data-k="${k}" data-t="${i}" style="--c:${c}"/>`;
    };
    const rt = Q(m.querySelector('.mf-root')), fn = Q(m.querySelector('.mf-fin'));
    m.querySelectorAll('.mf-g').forEach(g => {
      const i = +g.dataset.t, c = f.tasks[i].color, tk = Q(g.querySelector('.mf-task')), [pb, ob] = g.querySelectorAll('.mf-box'), sb = Q(g.querySelector('.mf-sub')), Pb = Q(pb), Ob = Q(ob);
      const ps = pb.querySelectorAll('.mf-pi'), os = ob.querySelectorAll('.mf-oi');
      add(cv(rt.r, rt.y, tk.l, tk.y), 1, i, c);
      ps.forEach((p, k) => { const py = Q(p).y, oy = Q(os[k]).y; add(cv(tk.r, tk.y, Pb.l, py), 2, i, c); add(`M${Pb.r},${py} L${Ob.l - 1},${oy}`, 3, i, c, 1, [Ob.l - 1, oy]); add(cv(Ob.r, oy, sb.l - 1, sb.y), 4, i, c, 1, k === ps.length - 1 ? [sb.l - 1, sb.y] : null); });
      add(cv(sb.r, sb.y, fn.l - 1, fn.y), 5, i, c, 0, [fn.l - 1, fn.y]);
    });
    W.innerHTML = h;
    if (m._done) m.querySelectorAll('.mf-n.lit').forEach(n => W.querySelectorAll(`[data-k="${n.dataset.k}"]`).forEach(e => e.classList.add('on')));
  }
  function flowPlay(m, instant) {
    (m._tm || []).forEach(clearTimeout); m._tm = []; m._done = false;
    const f = R.get(R.data, m.dataset.flow + '.flow'), Q = s => m.querySelectorAll(s);
    Q('.mf-n,.mf-hd,.mf-pi').forEach(e => e.classList.remove('lit')); Q('.fl,.tp,.mf-tl i').forEach(e => e.classList.remove('on'));
    const lit = k => { Q(`.mf-n[data-k="${k}"],.mf-hd[data-k="${k}"]`).forEach(e => e.classList.add('lit')); Q(`.mf-w [data-k="${k}"]`).forEach(e => e.classList.add('on')); };
    const cnt = (el, to, ms) => { if (instant) { el.textContent = to; return; } const t0 = performance.now(); (function g(t) { const p = Math.min(1, (t - t0) / ms); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(g); })(t0); };
    if (instant) { [0, 1, 2, 3, 4, 5].forEach(lit); Q('.mf-pi').forEach(e => e.classList.add('lit')); Q('.mf-tl i').forEach(e => e.classList.add('on')); Q('.mf-c').forEach(e => cnt(e, +e.dataset.v)); cnt(m.querySelector('.mf-tot'), f.T * f.P * f.N); m._done = true; return; }
    Q('.mf-c').forEach(e => e.textContent = 0); m.querySelector('.mf-tot').textContent = 0;
    const at = (ms, fn) => m._tm.push(setTimeout(fn, ms));
    at(60, () => lit(0)); at(420, () => lit(1));
    at(900, () => { lit(2); Q('.mf-pi').forEach((e, i) => at(i * 90, () => e.classList.add('lit'))); });
    at(1600, () => { lit(3); Q('.mf-oi').forEach((o, i) => o.querySelectorAll('.mf-tl i').forEach((x, k) => at(i * 60 + k * 70, () => x.classList.add('on')))); });
    at(2500, () => { lit(4); Q('.mf-c').forEach(e => cnt(e, +e.dataset.v, 600)); });
    at(3200, () => { lit(5); cnt(m.querySelector('.mf-tot'), f.T * f.P * f.N, 900); m._done = true; });
  }
  R.flowRefresh = function () {
    document.querySelectorAll('.mf').forEach(m => {
      if (!m.offsetParent) return;
      flowFit(m);
      const r = m.getBoundingClientRect(), vis = r.top < innerHeight * .8 && r.bottom > innerHeight * .2;
      if (vis && !m._seen) { m._seen = true; flowPlay(m, R.edit); }
    });
  };
  function flowBind(m) {
    const ip = m.dataset.flow;
    m.querySelectorAll('.mf-num button').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation(); const before = JSON.stringify(R.data), f = R.get(R.data, ip + '.flow'), k = b.dataset.p;
      f[k] = Math.min(FLIM[k][1], Math.max(FLIM[k][0], f[k] + +b.dataset.d));
      const n = document.createElement('div'); n.innerHTML = flowHTML(f, ip); const nm = n.firstElementChild;
      m.replaceWith(nm); flowBind(nm); nm._seen = true; flowFit(nm); flowPlay(nm, false);
      R.onFlowEdit && R.onFlowEdit(before);
    }));
    m.querySelector('.mf-play').addEventListener('click', e => { e.stopPropagation(); flowPlay(m, false); });
    const gs = m.querySelector('.mf-gs'), bd = m.querySelector('.mf-b');
    gs.addEventListener('mouseover', e => { const g = e.target.closest('.mf-g'); if (!g) return; bd.classList.add('dim'); m.querySelectorAll('.mf-n,.mf-w path').forEach(x => x.classList.toggle('keep', x.dataset.t === g.dataset.t || x.classList.contains('mf-root') || x.classList.contains('mf-fin'))); });
    gs.addEventListener('mouseleave', () => bd.classList.remove('dim'));
  }

  /* ---------- 自进化 Skill：介绍 / 流程 / 人审 / 结论 ---------- */
  function evoPanes(e, ip) {
    const q = ip + '.evolve', tt = (path, tag, cls) => t(path, tag, cls, { keep: 1 });
    const A = e.intro, B = e.steps, C = e.review, D = e.end;
    const a = q + '.intro', b = q + '.steps', c = q + '.review', d = q + '.end';
    const row = (x, i, base) => `<li><em>${pad2(i)}</em>${tt(`${base}.${i}.t`, 'h5')}${tt(`${base}.${i}.d`, 'p')}</li>`;
    return [
      ['介绍', `<div class="ev ev-a">
        <div class="ev-what">${tt(a + '.whatTag', 'small')}${tt(a + '.what', 'h4')}${tt(a + '.whatDesc', 'p')}</div>
        <div class="ev-why">${tt(a + '.whyTag', 'small')}<ol class="ev-rows">${A.why.map((x, i) => row(x, i, a + '.why')).join('')}</ol></div>
        <div class="ev-road">${tt(a + '.roadTag', 'small')}<ol>${B.map((x, i) => `<li class="${x.human ? 'hum' : ''}"><em>${pad2(i)}</em>${tt(`${b}.${i}.short`, 'span')}</li>`).join('')}</ol>${tt(a + '.road', 'p')}</div></div>`],
      ['流程', `<div class="ev ev-b"><div class="ev-back">${tt(q + '.loop', 'span')}</div>
        ${['目的', '做法', '产出'].map((x, i) => `<b class="ev-rh" style="grid-row:${i + 4}">${x}</b>`).join('')}
        ${B.map((x, i) => `<article class="ev-s ${x.human ? 'hum' : ''}" style="grid-column:${i + 2};--i:${i}"><div class="ev-no"><em>${pad2(i)}</em>${x.human ? '<i>人工</i>' : ''}<u></u></div>
          <header>${tt(`${b}.${i}.t`, 'h4')}${tt(`${b}.${i}.sum`, 'p')}</header>
          ${['goal', 'how', 'out'].map((k, n) => `<div class="ev-c${n}"><b>${['目的', '做法', '产出'][n]}</b>${tt(`${b}.${i}.${k}`, 'p')}</div>`).join('')}</article>`).join('')}</div>`],
      ['人审', `<div class="ev ev-c"><div class="ev-cl">${tt(c + '.title', 'h4')}${tt(c + '.desc', 'p')}
          <div class="ev-math"><strong>${tt(c + '.num', 'span')}</strong>${tt(c + '.fx', 'small')}</div>
          <div class="ev-rate"><strong>${tt(c + '.from', 'span')}</strong><i></i><strong>${tt(c + '.to', 'span')}</strong>${tt(c + '.rate', 'small')}</div></div>
        <ol class="ev-rows">${C.items.map((x, i) => row(x, i, c + '.items')).join('')}</ol></div>`],
      ['结论', `<div class="ev ev-d"><div class="ev-dl">${tt(d + '.title', 'h4')}${tt(d + '.desc', 'p')}</div>
        <div class="ev-map"><div class="ev-mh"><span>风险</span><span>流程里的解法</span></div>${D.map.map((x, i) => `<div>${tt(`${d}.map.${i}.a`, 'b')}${tt(`${d}.map.${i}.b`, 'p')}</div>`).join('')}</div>
        <div class="ev-loops">${D.loops.map((x, i) => `<div>${tt(`${d}.loops.${i}.t`, 'b')}${tt(`${d}.loops.${i}.d`, 'p')}</div>`).join('')}</div></div>`]
    ];
  }
  /* ---------- 概念草图：矩阵出图 → 最终选定 ---------- */
  /* 分步流程图：同比例图片横排，无外容器 */
  function procHTML(it, ip) {
    const L = it.proc, set = setOf(L.map(x => x.images[0]));
    return `<div class="prc"><div class="prc-in" style="--n:${L.length};grid-template-columns:${L.map(() => 'var(--w)').join(' var(--a) ')}">${L.map((x, i) => `${i ? '<div class="prc-a"><i></i></div>' : ''}<div class="prc-c" style="--i:${i}"><figure>${im(x.images[0], `${ip}.proc.${i}.images.0`, { big: 1, set })}</figure><div class="prc-t"><em>${pad2(i)}</em>${t(`${ip}.proc.${i}.t`, 'span', '', { keep: 1 })}</div></div>`).join('')}</div></div>`;
  }
  /* 动作迁移原理：三层约束 */
  function theoryHTML(it, ip) {
    const T = it.theory, q = ip + '.theory', set = setOf(T.items.filter(x => x.images).map(x => x.images[0]));
    return `<div class="thy"><div class="thy-in">${T.items.map((x, i) => {
      const xp = `${q}.items.${i}`;
      let body = '';
      if (x.images) body += `<figure class="${i ? 'dk' : 'lt'}" style="--ar:${R.ratio(x.images[0].id).toFixed(3)}">${im(x.images[0], xp + '.images.0', { big: 1, set })}</figure>`;
      if (x.bones) body += `<dl class="thy-bn">${x.bones.map((b, k) => `<div><dt data-path="${xp}.bones.${k}.0">${b[0]}</dt><dd data-path="${xp}.bones.${k}.1">${b[1]}</dd></div>`).join('')}</dl>`;
      if (x.json) body += `<div class="thy-js"><i>{</i>${x.json.map((b, k) => `<div><u>"<span data-path="${xp}.json.${k}.0">${b[0]}</span>"</u><b>:</b><span data-path="${xp}.json.${k}.1">${b[1]}</span></div>`).join('')}<i>}</i></div>`;
      return `${i ? '<div class="thy-p">+</div>' : ''}<div class="thy-c" style="--i:${i}"><header><em>${pad2(i)}</em><div>${t(xp + '.t', 'h4', '', { keep: 1 })}${t(xp + '.s', 'p', '', { keep: 1 })}</div></header><div class="thy-b">${body}</div></div>`;
    }).join('')}</div><div class="thy-sum"><i></i>${t(q + '.sum', 'p', '', { keep: 1 })}<i></i></div></div>`;
  }
  /* 角色设计流程图：两阶段 × 步骤卡 */
  function cflowHTML(it, ip) {
    const set = setOf(it.cflow.flatMap(g => g.steps.flatMap(x => x.images)));
    let n = 0;
    const tag = it.hideTags ? '' : 'tag';
    return `<div class="cf ${(it.cflow.length === 1 ? 'one' : '') + (it.wide ? ' wide' : '')}${it.hideTags ? ' notag' : ''}">${it.cflow.map((g, gi) => {
      const gp = `${ip}.cflow.${gi}`;
      return `<div class="cf-g" style="--n:${g.steps.length}"><div class="cf-st"><em>STAGE ${pad2(gi)}</em>${t(gp + '.t', 'h4', '', { keep: 1 })}${t(gp + '.s', 'p', '', { keep: 1 })}</div>
        <div class="cf-row">${g.steps.map((x, k) => {
          const sp = `${gp}.steps.${k}`, ai = /AI/.test(x.tag), hu = /人工/.test(x.tag);
          const figs = x.images.map((y, j) => `${j ? '<i class="cf-lr">LoRA</i>' : ''}<figure>${im(y, `${sp}.images.${j}`, { big: 1, set })}</figure>`).join('');
          return `<div class="cf-c ${ai && hu ? 'mix' : ai ? 'ai' : 'hu'}" style="--i:${n++}"><header><b>${pad2(k)}</b>${it.hideTags ? '' : `<span data-path="${sp}.tag">${x.tag}</span>`}</header>
            ${t(sp + '.t', 'h5', '', { keep: 1 })}<div class="cf-im ${x.images.length > 1 ? 'two' : ''}">${figs}</div>${t(sp + '.d', 'p', '', { keep: 1 })}</div>`;
        }).join('')}</div></div>`;
    }).join('')}${it.hideTags ? '' : '<div class="cf-lg"><span class="ai">AI</span>AI 生成 / 处理<span class="hu">人工</span>人工把控</div>'}</div>`;
  }
  /* 细化精修：上 3 小图 + 下 2 大图，各行等高 */
  function refineHTML(it, ip) {
    const R0 = it.refine, q = ip + '.refine', all = [...R0.top, ...R0.bot], set = setOf(all.map(x => x.images[0]));
    let n = 0;
    const row = (arr, key, cls) => {
      const rs = arr.map(x => R.ratio(x.images[0].id)), sum = rs.reduce((s, v) => s + v, 0);
      return `<div class="rf-r ${cls}" style="--sum:${sum.toFixed(4)};--n:${arr.length}"><div class="rf-in">${arr.map((x, i) => {
        const k = n++, fin = k === all.length - 1;
        return `${i ? '<div class="rf-a"><i></i></div>' : ''}<div class="rf-c ${fin ? 'fin' : ''}" style="--r:${rs[i].toFixed(4)};--i:${k}"><figure>${im(x.images[0], `${q}.${key}.${i}.images.0`, { big: 1, set })}</figure>
          <div class="prc-t"><em>${pad2(k)}</em><span data-path="${q}.${key}.${i}.t">${x.t}</span></div></div>`;
      }).join('')}</div></div>`;
    };
    const row2 = (arr, key) => arr.map((x, i) => {
      const k = key === 'top' ? i : R0.top.length + i, fin = k === all.length - 1;
      return `${i ? '<div class="rf2-a"><i></i></div>' : ''}<div class="rf2-c ${fin ? 'fin' : ''}" style="--i:${k}"><figure style="--bg:${x.bg || 'transparent'}">${im(x.images[0], `${q}.${key}.${i}.images.0`, { big: 1, set })}</figure>
        <div class="prc-t"><em>${pad2(k)}</em><span data-path="${q}.${key}.${i}.t">${x.t}</span></div></div>`;
    }).join('');
    if (row) return `<div class="rf2"><div class="rf2-in"><div class="rf2-r top">${row2(R0.top, 'top')}</div><div class="rf-dn"><i></i></div><div class="rf2-r bot">${row2(R0.bot, 'bot')}</div></div></div>`;
  }
  /* 等高行：每张图按自身比例定宽，整行同高，不裁不拉 */
  function eqRow(arr, ip) {
    const set = setOf(arr), rs = arr.map(x => R.ratio(x.id)), sum = rs.reduce((a, b) => a + b, 0);
    return `<div class="eqh" style="--sum:${sum.toFixed(4)};--n:${arr.length}"><div class="eqh-in">${arr.map((x, i) => `<figure style="--r:${rs[i].toFixed(4)};--i:${i}">${im(x, `${ip}.${i}`, { big: 1, set })}</figure>`).join('')}</div></div>`;
  }
  /* 正交三视图：纵向三张为一组，横向四组 */
  function v3gHTML(it, ip) {
    const g = it.v3g, set = setOf(g.flatMap(x => x.images));
    return `<div class="v3g" style="--n:${g.length}">${g.map((x, gi) => `
      <div class="v3g-c"><div class="v3g-i">${x.images.map((id, k) =>
        `<figure>${im({ id }, `${ip}.v3g.${gi}.images.${k}`, { set })}</figure>`).join('')}</div>
        ${t(`${ip}.v3g.${gi}.t`, 'span', 'v3g-t', { keep: 1 })}</div>`).join('')}</div>`;
  }
  /* 正交三视图：纵向三张为一组，横向四组 */
  function v3gHTML(it, ip) {
    const g = it.v3g, set = setOf(g.flatMap(x => x.images));
    return `<div class="v3g" style="--n:${g.length}">${g.map((x, gi) => `
      <div class="v3g-c"><div class="v3g-i">${x.images.map((id, k) =>
        `<figure>${im({ id }, `${ip}.v3g.${gi}.images.${k}`, { set })}</figure>`).join('')}</div>
        ${t(`${ip}.v3g.${gi}.t`, 'span', 'v3g-t', { keep: 1 })}</div>`).join('')}</div>`;
  }
  /* 统一高度 + 两侧/上下用图片相近色纵向填充（模糊同图铺底） */
  function eqFill(arr, ip, ref, bg) {
    const set = setOf(arr);
    return `<div class="eqh fill${ref === 'tall' ? ' tall' : ''}" style="--n:${arr.length};--sum:${typeof ref === 'number' ? ref.toFixed(4) : '1.8'}"><div class="eqh-in">${arr.map((x, i) =>
      `<figure style="--i:${i}">${bg ? `<span class="eqf plain" style="background:${bg}"></span>` : `<span class="eqf" style="background-image:url('${R.src(x.id, 0)}')"></span>`}${im(x, `${ip}.${i}`, { big: 1, set })}</figure>`).join('')}</div></div>`;
  }
  /* 统一高度 + 两侧/上下用图片相近色纵向填充（模糊同图铺底） */
  function eqFill(arr, ip, ref, bg) {
    const set = setOf(arr);
    return `<div class="eqh fill${ref === 'tall' ? ' tall' : ''}" style="--n:${arr.length};--sum:${typeof ref === 'number' ? ref.toFixed(4) : '1.8'}"><div class="eqh-in">${arr.map((x, i) =>
      `<figure style="--i:${i}">${bg ? `<span class="eqf plain" style="background:${bg}"></span>` : `<span class="eqf" style="background-image:url('${R.src(x.id, 0)}')"></span>`}${im(x, `${ip}.${i}`, { big: 1, set })}</figure>`).join('')}</div></div>`;
  }
  /* 动作迁移：原图 → 姿势参考 → 姿势迁移 */
  function caseHTML(it, ip, k) {
    const c = it.cases[k], L = it.caseLabels || [], q = `${ip}.cases.${k}`, set = setOf(c.images);
    return `<div class="pz"><div class="pz-in">${c.images.map((x, j) => `${j ? '<div class="pz-a"><i></i></div>' : ''}<div class="pz-c ${j === 2 ? 'out' : ''}" style="--i:${j}"><figure>${im(x, `${q}.images.${j}`, { big: 1, set })}</figure>
      <div class="prc-t"><em>${pad2(j)}</em><span data-path="${ip}.caseLabels.${j}">${L[j] || ''}</span></div></div>`).join('')}</div></div>`;
  }
  /* 原图 → AI 生成侧视 / 后视 */
  function views3HTML(it, ip) {
    const v = it.views3, q = ip + '.views3', set = setOf([v.images[0], ...v.out.map(x => x.images[0])]);
    const card = (ref, path, tag, cls, i) => `<div class="v3-c ${cls}" style="--i:${i}"><figure>${im(ref, path, { big: 1, set })}</figure><div class="prc-t">${tag}</div></div>`;
    return `<div class="v3"><div class="v3-in">
      ${card(v.images[0], q + '.images.0', t(q + '.src', 'span', '', { keep: 1 }), 'src', 0)}
      <div class="v3-a"><span>${t(q + '.ai', 'b', '', { keep: 1 })}</span><i></i></div>
      ${v.out.map((x, i) => card(x.images[0], `${q}.out.${i}.images.0`, `<em>AI</em>${t(`${q}.out.${i}.t`, 'span', '', { keep: 1 })}`, 'ai', i + 1)).join('<div class="v3-p">+</div>')}
    </div></div>`;
  }
  function sketchHTML(it, ip) {
    const a = it.images || [], f = it.final || [], set = setOf(a.concat(f));
    return `<div class="skf"><div class="skf-l"><div class="skf-tag">${t(ip + '.sketch.a', 'span', '', { keep: 1 })}</div>
        <div class="skf-g">${a.map((x, i) => `<figure style="--i:${i}">${im(x, `${ip}.images.${i}`, { big: 1, set })}</figure>`).join('')}</div></div>
      <div class="skf-ar" aria-hidden="true"><i></i></div>
      <div class="skf-r"><div class="skf-tag">${t(ip + '.sketch.b', 'span', '', { keep: 1 })}</div>
        ${f[0] ? `<figure>${im(f[0], ip + '.final.0', { big: 1, set })}</figure>` : ''}</div></div>`;
  }

  /* 板块内分视图：一屏放不下的内容收进视图切换，保证每个板块都在一屏内 */
  function peHTML(it, ip) {
    const a = it.images || [], x = it.pe, q = ip + '.pe', set = setOf(a), tt = (path, tag, cls) => t(path, tag, cls, { keep: 1 });
    return `<div class="pe"><div class="pe-im" style="--n:${a.length || 1}">${a.map((m, i) => im(m, `${ip}.images.${i}`, { big: 1, set })).join('')}</div>
      <div class="pe-tx">${tt(q + '.title', 'h4')}${tt(ip + '.desc', 'p', 'pe-lead')}
        <ol>${x.rows.map((r, i) => `<li>${tt(`${q}.rows.${i}.t`, 'h5')}${tt(`${q}.rows.${i}.d`, 'p')}</li>`).join('')}</ol></div></div>`;
  }
  function m3dHTML(it, ip) {
    const m = it.m3d, box = (k, cls, lab, n) => `<div class="m3-v ${cls}" data-m3d="${k}"><canvas></canvas><span class="m3-ld">加载模型…</span><span class="m3-t">${n ? `<em>${n}</em>` : ''}${lab}</span></div>`;
    return `<div class="m3">${box(m.main, 'm3-main', t(ip + '.m3d.mainLabel', 'span', '', { keep: 1 }), '')}<span class="m3-hint">拖拽旋转 · 双击复位 · 点击右侧部件切换展示</span>
      <div class="m3-side">${m.parts.map((x, i) => box(x.key, '', t(`${ip}.m3d.parts.${i}.title`, 'span', '', { keep: 1 }), pad2(i))).join('')}</div></div>`;
  }
  /* 4 宫格 3D 白模展示：ready 为 false 时显示待填充占位（等模型文件到位再开） */
  function m3gridHTML(it, ip) {
    const g = it.m3g;
    return `<div class="m3g" style="--n:${g.length}">${g.map((x, i) => {
      const lab = `<span class="m3-t">${t(`${ip}.m3g.${i}.label`, 'span', '', { keep: 1 })}</span>`;
      return x.ready
        ? `<div class="m3-v m3-cell" data-m3d="${x.key}"><canvas></canvas><span class="m3-ld">加载模型…</span>${lab}</div>`
        : `<div class="m3-v m3-cell m3-empty">${lab}<span class="m3-ph">模型待填充<small>${x.key ? 'assets/3d/' + x.key + '.js' : ''}</small></span></div>`;
    }).join('')}</div>`;
  }
  /* 4 宫格 3D 白模展示：ready 为 false 时显示待填充占位（等模型文件到位再开） */
  function m3gridHTML(it, ip) {
    const g = it.m3g;
    return `<div class="m3g" style="--n:${g.length}">${g.map((x, i) => {
      const lab = `<span class="m3-t">${t(`${ip}.m3g.${i}.label`, 'span', '', { keep: 1 })}</span>`;
      return x.ready
        ? `<div class="m3-v m3-cell" data-m3d="${x.key}"><canvas></canvas><span class="m3-ld">加载模型…</span>${lab}</div>`
        : `<div class="m3-v m3-cell m3-empty">${lab}<span class="m3-ph">模型待填充<small>${x.key ? 'assets/3d/' + x.key + '.js' : ''}</small></span></div>`;
    }).join('')}</div>`;
  }
  /* UI 批量流程：STEP 页签 + 单张大图（与 3D 物件同一套页签样式） */
  /* 步骤页签 + 大图（3D 物件的页签样式，支持一步多图） */
  function uisHTML(st) {
    const set = setOf(st.flatMap(x => x.imgs));
    return `<div class="uis" data-tabs><div class="tabbar" style="--n:${st.length}">${st.map((x, i) =>
      `<div class="tab ${i ? '' : 'on'}" data-i="${i}"><b>STEP ${pad2(i)}</b><h3 data-path="${x.tp}">${esc(x.t)}</h3>${x.tag ? `<span class="uis-tag ${/AI/.test(x.tag) ? 'ai' : 'hu'}" data-path="${x.tagp}">${esc(x.tag)}</span>` : ''}<span class="bar"></span></div>`).join('')}</div>
      <div class="panels">${st.map((x, i) => `<div class="panel ${i ? '' : 'on'}"><div class="uis-f" style="--n:${x.imgs.length}">${x.imgs.map((id, k) => {
        const cp = (x.caps && x.caps[k]) || '';
        const cpp = x.capp ? `${x.capp}.${k}.cap` : null;
        const cap = (cp || R.edit) && cpp ? `<figcaption data-path="${cpp}">${esc(cp)}</figcaption>` : '';
        return `<figure><img data-lb="${id}" data-img="${x.imgp}${x.imgs.length > 1 ? '.' + k : ''}" data-lbset="${set}" src="${R.src(id, 1)}" alt="">${cap}</figure>`;
      }).join('')}</div>${t(x.dp, 'p', 'uis-d')}</div>`).join('')}</div></div>`;
  }
  function uistepsHTML(it, ip) {
    return uisHTML(it.uisteps.map((x, i) => ({ ...x, imgs: [x.img], tp: `${ip}.uisteps.${i}.t`, tagp: `${ip}.uisteps.${i}.tag`, dp: `${ip}.uisteps.${i}.d`, imgp: `${ip}.uisteps.${i}.img` })));
  }
  /* 板块级：标题在上一行，下面步骤页签 + 大图 */
  function uisSec(s, p) {
    const st = s.items.map((x, i) => ({ t: ttl(x.title), tag: s.hideTags ? '' : (x.tag || ''), d: ttl(x.desc), imgs: (x.images || []).map(y => y.id), tp: `${p}.items.${i}.title`, tagp: `${p}.items.${i}.tag`, dp: `${p}.items.${i}.desc`, imgp: `${p}.items.${i}.images`, caps: (x.images || []).map(y => y.cap || ''), capp: `${p}.items.${i}.images` }));
    return `${head(s, p, 'two')}${uisHTML(st)}${times(s, p)}`;
  }
  function panesOf(it, ip, gridAll) {
    const L = [], imgs = it.images || [];
    if (it.cflow) return [['流程', cflowHTML(it, ip)]];
    if (it.m3d) return [['3D 白模', m3dHTML(it, ip)]];
    if (it.m3g) return [['3D 模型', m3gridHTML(it, ip)]];
    if (it.m3g) return [['3D 模型', m3gridHTML(it, ip)]];
    if (it.uisteps) return [['批量流程', uistepsHTML(it, ip)]];
    if (it.v3g) return [['三视图', v3gHTML(it, ip)]];
    if (it.v3g) return [['三视图', v3gHTML(it, ip)]];
    if (it.refine) return [['流程', refineHTML(it, ip)], ...(it.groups && it.groups.length ? [['风格扩展', groupsOf(it, ip)]] : [])];
    if (it.flow) L.push(['流程', flowHTML(it.flow, ip)]);
    if (it.pe) return [['图像', peHTML(it, ip)]];
    if (it.sketch) return [['图像', sketchHTML(it, ip)]];
    if (it.evolve) return evoPanes(it.evolve, ip);
    if (it.proc) L.push(['流程', procHTML(it, ip)]);
    if (it.views3) L.push(['AI 生成', views3HTML(it, ip)]);
    if (it.finish) L.push([esc(ttl(it.finish.t)), `<div class="fin1"><figure>${im(it.finish.images[0], ip + '.finish.images.0', { big: 1 })}</figure></div>`]);
    if (it.rows) L.push(['对比', `<div class="cmp">${poseSlider(it, ip)}<ol class="layers">${(it.points || []).map((x, i) => `<li><em>${'壹贰叁肆伍'[i] || i + 1}</em><div>${t(`${ip}.points.${i}.title`, 'h3', '', { keep: 1 })}${t(`${ip}.points.${i}.desc`, 'p', '')}</div></li>`).join('')}</ol></div>`]);
    if (it.theory) L.push(['原理', theoryHTML(it, ip)]);
    else if (it.principle && it.principle.length) L.push(['原理', grid(it.principle, ip + '.principle', it.principle.length, { fit: 'contain' })]);
    if (it.cases) it.cases.forEach((c, k) => L.push([`拓展 CASE ${pad2(k)}`, caseHTML(it, ip, k)]));
    if (it.parts && it.parts.length > 3) {
      const vw = it.views || [];
      if (it.overview) { const o = it.overview, set = setOf([o.src, ...it.parts.map(pt => pt.images[0])]);
        L.push([esc(o.title || '总览'), `<div class="kov"><div class="kov-l"><span class="kov-t">${t(ip + '.overview.srcLabel', 'span', '', { keep: 1 })}</span><figure style="--r:${R.ratio(o.src.id).toFixed(4)}">${im(o.src, ip + '.overview.src', { big: 1, set })}</figure></div>
          <div class="kp-ar"><span>${t(ip + '.overview.arrow', 'span', '', { keep: 1 })}</span><i></i></div>
          <div class="kov-r" style="--n:${it.parts.length}">${it.parts.map((pt, i) => `<figure style="--i:${i}">${im(pt.images[0], `${ip}.parts.${i}.images.0`, { big: 1, set })}<figcaption><em>${pad2(i)}</em>${esc(ttl(pt.title))}</figcaption></figure>`).join('')}</div></div>`]); }
      it.parts.forEach((pt, i) => { const g = pt.images || [], q = `${ip}.parts.${i}.images`, set = setOf(g);
        L.push([esc(ttl(pt.title)), `<div class="kp"><div class="kp-l"><div class="kp-tag"><em>${pad2(i)}</em>${t(`${ip}.parts.${i}.title`, 'h4', '', { keep: 1 })}<span>${esc(it.cutLabel || '原画')}</span></div>
          <figure class="kp-cut">${g[0] ? im(g[0], q + '.0', { big: 1, set }) : ''}</figure></div>
          <div class="kp-ar"><span>AI 生成三视图</span><i></i></div>
          <div class="kp-r">${g.slice(1).map((x, k) => `<figure style="--i:${k}">${im(x, `${q}.${k + 1}`, { big: 1, set })}<figcaption>${esc(vw[k] || '')}</figcaption></figure>`).join('')}</div></div>`]); });
    } else if (it.parts) {
      const src = imgs[0];
      L.push(['拆件', `<div class="sp"><div class="sp-src">${src ? fig(src, ip + '.images.0', { cls: 'sp-src-img' }) : ''}</div><div class="sp-arrow"><i></i></div><div class="sp-parts">${splitParts(it, ip, null, 'parts')}</div></div>`]);
    } else if (imgs.length && !it.flow) L.push([it.proc ? ttl(it.title) : it.groups ? '成果' : '图像', it.eqh === 'fill' ? eqFill(imgs, ip + '.images', it.ref, it.fillBg) : it.eqh === 'fill' ? eqFill(imgs, ip + '.images', it.ref, it.fillBg) : it.eqh ? eqRow(imgs, ip + '.images') : gridAll || it.grid ? grid(imgs, ip + '.images', imgs.length, { fit: 'contain' }) : stageOf(it, ip)]);
    if (it.groups && it.groups.length) L.push([it.rows ? '案例' : '风格', groupsOf(it, ip)]);
    return L;
  }
  function paneBox(L, key) {
    const k = Math.min(R.ui[key] || 0, Math.max(L.length - 1, 0));
    return {
      seg: L.length > 1 ? `<div class="vseg" data-key="${key}">${L.map((x, i) => `<button class="${i === k ? 'on' : ''}">${x[0]}</button>`).join('')}</div>` : '',
      body: `<div class="vws">${L.map((x, i) => `<div class="vp ${i === k ? 'on' : ''}">${x[1]}</div>`).join('')}</div>`
    };
  }
  function panel(it, ip, on, L) {
    const b = paneBox(L, ip), d = it.pe ? '' : t(ip + '.desc', 'p', 'pd');
    return `<div class="panel ${on ? 'on' : ''}" data-vh>${d || b.seg ? `<div class="ph">${d || '<span></span>'}${b.seg}</div>` : ''}${b.body}</div>`;
  }
  function tabs(s, p, withTimes, gridAll) {
    return `${head(s, p, 'two')}<div class="tabs" data-tabs>
      <div class="tabbar" style="--n:${s.items.length}">${s.items.map((it, i) => `<div class="tab ${i ? '' : 'on'}" data-i="${i}"><b>STEP ${pad2(i)}</b>${t(`${p}.items.${i}.title`, 'h3', '', { keep: 1 })}<span class="bar"></span></div>`).join('')}</div>
      <div class="panels">${s.items.map((it, i) => panel(it, `${p}.items.${i}`, !i, panesOf(it, `${p}.items.${i}`, gridAll))).join('')}</div></div>
      ${withTimes ? times(s, p) : ''}`;
  }
  T.steps = {
    tabs(s, p) { return tabs(s, p, true); },
    list(s, p) {
      return `<div class="lsplit" data-tabs><div class="ls-l">${head(s, p)}<ol class="lst">${s.items.map((it, i) => `<li class="tab ${i ? '' : 'on'}" data-i="${i}"><em>${pad2(i)}</em>${t(`${p}.items.${i}.title`, 'h3', '', { keep: 1 })}</li>`).join('')}</ol>${times(s, p)}</div>
        <div class="panels">${s.items.map((it, i) => panel(it, `${p}.items.${i}`, !i, panesOf(it, `${p}.items.${i}`))).join('')}</div></div>`;
    },
    stack(s, p) { return tabs(s, p, true, true); },
    uis(s, p) { return uisSec(s, p); }
  };

  /* ---------- 对比 ---------- */
  function poseSlider(s, p) {
    const r0 = s.rows[0];
    return `<div class="cmp-l"><div class="slbox"><div class="sl" data-sl>${im(r0.images[2], `${p}.rows.0.images.2`, { big: 1 })}<div class="top">${im(r0.images[3], `${p}.rows.0.images.3`, { big: 1 })}</div>
        <div class="hd"></div><span class="l">${esc(s.labels[2])}</span><span class="r">${esc(s.labels[3])}</span></div></div>
      <div class="rows">${s.rows.map((r, i) => `<button class="${i ? '' : 'on'}" data-pa="${p}.rows.${i}.images.2" data-pb="${p}.rows.${i}.images.3" data-a="${r.images[2].id}" data-b="${r.images[3].id}">
        <span>${im(r.images[0], `${p}.rows.${i}.images.0`)}</span><span>${im(r.images[1], `${p}.rows.${i}.images.1`)}</span><small>CASE ${pad2(i)}</small></button>`).join('')}</div></div>`;
  }
  T.compare = {
    slider(s, p) {
      return `<div class="cmp">${poseSlider(s, p)}<div class="cmp-r">${head(s, p)}<ol class="layers">${s.items.map((x, i) => `<li><em>${'壹贰叁肆伍'[i] || i + 1}</em><div>${t(`${p}.items.${i}.title`, 'h3', '', { keep: 1 })}${t(`${p}.items.${i}.desc`, 'p', '')}</div></li>`).join('')}</ol></div></div>
        ${s.images && s.images.length ? `<div class="principle">${grid(s.images, p + '.images', s.images.length, { fit: 'contain' })}</div>` : ''}`;
    },
    table(s, p) {
      return `${head(s, p, 'two')}<div class="vs"><div class="vh">${s.labels.map((l, i) => `<span class="${i === 3 ? 'hl' : ''}" data-path="${p}.labels.${i}">${l}</span>`).join('')}</div>
        ${s.rows.map((r, i) => `<div class="vr" data-group>${r.images.map((x, k) => fig(x, `${p}.rows.${i}.images.${k}`, { cls: k === 3 ? 'hl' : '' })).join('')}</div>`).join('')}</div>
        ${s.images && s.images.length ? `<div class="principle">${grid(s.images, p + '.images', s.images.length, { fit: 'contain' })}</div>` : ''}`;
    }
  };

  /* ---------- 工具箱 ---------- */
  function pairBlock(c, ip, mode) {
    const [a, b] = c.images, lab = c.labels || [], r = R.ratio(a.id).toFixed(3);
    const labs = `<div class="cx-lab"><span data-path="${ip}.labels.0">${lab[0] || ''}</span><i></i><span data-path="${ip}.labels.1">${lab[1] || ''}</span></div>`;
    if (mode === 'slider') return `<div class="cx-sl"><div class="slbox"><div class="sl" data-sl style="--r:${r}">${im(a, ip + '.images.0', { big: 1 })}<div class="top">${im(b, ip + '.images.1', { big: 1 })}</div><div class="hd"></div></div></div>${labs}</div>`;
    return `<div class="cx-pair" data-group><figure>${im(a, ip + '.images.0', { big: 1 })}</figure><figure>${im(b, ip + '.images.1', { big: 1 })}</figure></div>${labs}`;
  }
  function toolPanes(it, ip) {
    const ps = it.pairs || [], mode = it.mode || 'pair', imgs = it.images || [];
    if (mode === 'data') return [['数据', stageOf(it, ip)]];
    const c = Math.min(R.ui[ip + '#c'] || 0, Math.max(ps.length - 1, 0));
    const L = [['对比', `<div class="cx" data-ckey="${ip}#c"><div class="cxs">${ps.map((x, i) => `<div class="cxp ${i === c ? 'on' : ''}">${pairBlock(x, `${ip}.pairs.${i}`, mode)}</div>`).join('')}</div>
      ${ps.length > 1 ? `<div class="cxc">${ps.map((x, i) => `<button class="${i === c ? 'on' : ''}" data-c="${i}">${pad2(i)}</button>`).join('')}</div>` : ''}</div>`]];
    if (imgs.length) L.push(['更多', grid(imgs, ip + '.images', imgs.length, { fit: 'contain' })]);
    return L;
  }
  T.chapter = {
    index(s, p) {
      return `<div class="chp"><div class="chp-n">${t(p + '.num', 'span', '', { keep: 1 })}</div><div class="chp-t">${t(p + '.kicker', 'small', 'k')}${t(p + '.title', 'h2', 'h')}${t(p + '.desc', 'p', 'd')}</div>
        <ol class="chp-i">${s.items.map((x, i) => `<li><a href="#${x.to}"><em>${pad2(i)}</em><div>${t(`${p}.items.${i}.title`, 'h3', '', { keep: 1 })}${t(`${p}.items.${i}.desc`, 'p', '')}</div><i>→</i></a></li>`).join('')}</ol></div>`;
    }
  };
  T.rail = {
    rail(s, p) {
      const shown = s.items.map((it, i) => ({ it, i })).filter(o => !o.it.hide);
      const nums = {};
      let run = 0; shown.forEach(o => { nums[o.i] = o.it.noHead ? -1 : run++; });
      const first = shown.find(o => nums[o.i] === 0)?.i;
      return `<div class="rl"><aside class="rl-l">${head(s, p)}<nav class="rail">${shown.map(({ it, i }) => it.noHead ? '' : `<a href="#${s.id}-${i}" class="${i === first ? 'on' : ''}"><em>${pad2(nums[i])}</em>${esc(ttl(it.title))}</a>`).join('')}</nav></aside>
        <div class="rl-b">${shown.map(({ it, i }) => {
          const ip = `${p}.items.${i}`, L = panesOf(it, ip), split = (it.rows || it.cases) && L.length > 1;
          const b = paneBox(split ? L.slice(0, 1) : L, ip);
          if (it.noHead) return `<article class="rb rb-ov" id="${s.id}-${i}" data-k="-1"><div class="rb-ov-d">${t(ip + '.desc', 'p', '')}</div>${b.body}</article>`;
          let h = `<article class="rb" id="${s.id}-${i}" data-k="${i}" data-vh><div class="rb-h"><em>${pad2(nums[i])}</em><div>${it.note != null && (R.edit || !it.rows) ? `<div class="rb-tn">${t(ip + '.title', 'h3', '', { keep: 1 })}${t(ip + '.note', 'small', '', { keep: 1 })}</div>` : t(ip + '.title', 'h3', '', { keep: 1 })}${dsc(ip + '.desc', '', it.bullet)}</div>${split ? '' : b.seg}</div>${b.body}${nums[i] === 0 ? times(s, p) : ''}</article>`;
          if (split) L.slice(1).forEach((x, k) => { h += `<article class="rb rb-sub" id="${s.id}-${i}-${k + 1}" data-k="${i}" data-vh><div class="rb-h"><em>${pad2(nums[i])}</em><div><div class="rb-tn"><h3>${esc(ttl(it.title))}<span> · ${x[0]}</span></h3>${it.note && /CASE/.test(x[0]) ? `<small>${esc(ttl(it.note))}</small>` : ''}</div></div></div><div class="vws"><div class="vp on">${x[1]}</div></div></article>`; });
          return h;
        }).join('')}</div></div>`;
    },
    tabs(s, p) {
      return `${head(s, p, 'two')}<div class="tabs" data-tabs><div class="tabbar" style="--n:${s.items.length}">${s.items.map((it, i) => `<div class="tab ${i ? '' : 'on'}" data-i="${i}"><b>STEP ${pad2(i)}</b>${t(`${p}.items.${i}.title`, 'h3', '', { keep: 1 })}<span class="bar"></span></div>`).join('')}</div>
        <div class="panels">${s.items.map((it, i) => panel(it, `${p}.items.${i}`, !i, panesOf(it, `${p}.items.${i}`))).join('')}</div></div>${times(s, p)}`;
    }
  };

  T.tools = {
    compare(s, p) {
      return `${head(s, p, 'two')}<div class="tabs" data-tabs><div class="tabbar" style="--n:${s.items.length}">${s.items.map((it, i) => `<div class="tab ${i ? '' : 'on'}" data-i="${i}"><b>${pad2(i)}</b>${t(`${p}.items.${i}.title`, 'h3', '', { keep: 1 })}<span class="bar"></span></div>`).join('')}</div>
        <div class="panels">${s.items.map((it, i) => panel(it, `${p}.items.${i}`, !i, toolPanes(it, `${p}.items.${i}`))).join('')}</div></div>`;
    },
    grid(s, p) {
      return `${head(s, p, 'two')}<div class="tools" style="--c:${s.style.cols || 3}">${s.items.map((it, i) => {
        const x = it.images[0];
        return `<div class="tc"><div class="im">${x ? im(x, `${p}.items.${i}.images.0`, { big: 1, set: setOf(it.images) }) : ''}<em class="cnt">${it.images.length} 张</em></div>
          <div class="cap"><b>${pad2(i)}</b>${t(`${p}.items.${i}.title`, 'h3', '', { keep: 1 })}</div>${t(`${p}.items.${i}.desc`, 'p', 'tdesc')}</div>`;
      }).join('')}</div>`;
    },
    tabs(s, p) { return tabs(s, p, false); }
  };

  /* ---------- 智能拆分 ---------- */
  function splitParts(s, p, only, k) {
    k = k || 'items';
    const vw = s.views || [];
    return s[k].map((it, i) => {
      if (only != null && i !== only) return '';
      const a = it.images || [], set = setOf(a);
      const part = a[0] ? im(a[0], `${p}.${k}.${i}.images.0`, { big: 1, set }) : '';
      const views = a.slice(1).map((x, vi) => `<figure>${im(x, `${p}.${k}.${i}.images.${vi + 1}`, { set })}<figcaption>${esc(vw[vi] || '视图 ' + (vi + 1))}</figcaption></figure>`).join('');
      return `<div class="sp-part"><div class="sp-cut"><span class="sp-no">${pad2(i)}</span>${part}</div>
        <div class="sp-info">${t(`${p}.${k}.${i}.title`, 'h3', '', { keep: 1 })}<div class="sp-views" style="--v:${Math.max(1, a.length - 1)}">${views}</div></div></div>`;
    }).join('');
  }
  function splitResult(s, p) {
    const r = s.result || {}, a = r.images || [];
    return `<div class="sp-res"><div class="sp-res-l"><span class="sp-badge">${esc((s.labels || [])[3] || '')}</span>${t(p + '.result.title', 'h3', '', { keep: 1 })}${t(p + '.result.desc', 'p', '')}</div>
      ${grid(a, p + '.result.images', a.length || 1, { fit: 'contain', ar: '1' })}</div>`;
  }
  function splitHead(s, p) {
    const L = s.labels || [];
    return `${head(s, p, 'two')}<ol class="sp-steps" style="--n:${L.length}">${L.map((l, i) => `<li><em>${pad2(i)}</em><span data-path="${p}.labels.${i}">${l}</span></li>`).join('')}</ol>`;
  }
  T.split = {
    flow(s, p) {
      const src = (s.images || [])[0];
      return `${splitHead(s, p)}<div class="sp">
        <div class="sp-src"><div class="sp-tag">${esc((s.labels || [])[0] || '')}</div>${src ? fig(src, p + '.images.0', { cls: 'sp-src-img' }) : ''}${t(p + '.srcNote', 'p', 'sp-note')}</div>
        <div class="sp-arrow"><span>${esc((s.labels || [])[1] || '')}</span><i></i></div>
        <div class="sp-parts"><div class="sp-tag">${esc((s.labels || [])[2] || '')}</div>${splitParts(s, p)}</div></div>
        ${t(p + '.note', 'p', 'sp-prompt')}${splitResult(s, p)}`;
    },
    tabs(s, p) {
      const src = (s.images || [])[0];
      return `${splitHead(s, p)}<div class="sp sp-t"><div class="sp-src">${src ? fig(src, p + '.images.0', { cls: 'sp-src-img' }) : ''}${t(p + '.srcNote', 'p', 'sp-note')}</div>
        <div class="tabs" data-tabs><div class="tabbar" style="--n:${s.items.length}">${s.items.map((it, i) => `<div class="tab ${i ? '' : 'on'}" data-i="${i}"><b>PART ${pad2(i)}</b>${t(`${p}.items.${i}.title`, 'h3', '', { keep: 1 })}<span class="bar"></span></div>`).join('')}</div>
        <div class="panels">${s.items.map((it, i) => `<div class="panel ${i ? '' : 'on'}">${splitParts(s, p, i)}</div>`).join('')}</div></div></div>
        ${t(p + '.note', 'p', 'sp-prompt')}${splitResult(s, p)}`;
    }
  };

  T.contact = {
    big(s, p) {
      return `${t(p + '.kicker', 'small', 'k')}${t(p + '.title', 'h2', 'end')}<div class="ct-row">${t(p + '.desc', 'p', 'd')}
        <dl>${s.items.map((x, i) => `<div>${t(`${p}.items.${i}.title`, 'dt', '', { keep: 1 })}${t(`${p}.items.${i}.desc`, 'dd', '', { keep: 1 })}</div>`).join('')}</dl></div>
        ${t(p + '.tags', 'p', 'tags')}<div class="copy">© 2026 ${esc(R.data.meta.brand)} · ${esc(R.data.meta.brandSub)}</div>`;
    }
  };

  /* ---------- 整页 ---------- */
  R.applyTheme = function () {
    const th = R.data.theme, st = document.documentElement.style;
    st.setProperty('--acid', th.accent); st.setProperty('--bk', th.bg); st.setProperty('--fg', th.fg);
    st.setProperty('--ts', th.titleScale); st.setProperty('--body', th.bodySize + 'px');
    document.body.dataset.font = th.titleFont;
    document.body.classList.toggle('gray-hero', !!th.grayHero);
    document.title = R.data.meta.siteTitle;
  };

  /* 让同章节里"填充行"的高度精确等于参考行（三渲二风格）的实测高度 */
  R.fitRef = function (root) {
    (root || document).querySelectorAll('section[data-refh]').forEach(sec => {
      const sel = sec.dataset.refh;
      const ref = sec.querySelector(sel);
      const fig = ref && (ref.tagName === 'FIGURE' ? ref : ref.querySelector('figure'));
      const h = fig ? fig.getBoundingClientRect().height : 0;
      if (h > 1) sec.style.setProperty('--refh', h.toFixed(2) + 'px');
    });
  };
  if (!window.__refhBound) {
    window.__refhBound = 1;
    let t = null;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => { const r = document.querySelector('#app') || document; R.fitRef(r); R.fitVideo(r); }, 120);
    });
  }

  /* 让同章节里"填充行"的高度精确等于参考行（三渲二风格）的实测高度 */
  R.fitRef = function (root) {
    (root || document).querySelectorAll('section[data-refh]').forEach(sec => {
      const sel = sec.dataset.refh;
      const ref = sec.querySelector(sel);
      const fig = ref && (ref.tagName === 'FIGURE' ? ref : ref.querySelector('figure'));
      const h = fig ? fig.getBoundingClientRect().height : 0;
      if (h > 1) sec.style.setProperty('--refh', h.toFixed(2) + 'px');
    });
  };
  if (!window.__refhBound) {
    window.__refhBound = 1;
    let t = null;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => R.fitRef(document.querySelector('#app') || document), 120);
    });
  }

  /* 视频生成：左侧视频按 16:9 原生比例定高，右侧 6 图同步该高度 */
  R.fitVideo = function (root) {
    (root || document).forEach ? null : null;
    (root || document).querySelectorAll('.vsplit').forEach(vs => {
      const vb = vs.querySelector('.vbox'), st = vs.querySelector('.vstill');
      if (!vb || !st) return;
      const W = vs.clientWidth, g = parseFloat(getComputedStyle(vs).columnGap) || 0;
      const lw = Math.max(120, (W - g) * 1.5 / 2.5);
      let h = lw * 9 / 16;
      const sec = vs.closest('section');
      const cap = (sec ? sec.clientHeight : 9999) - (vs.previousElementSibling ? vs.previousElementSibling.getBoundingClientRect().height : 0) - 24;
      if (h > cap) h = Math.max(120, cap);
      vs.style.setProperty('--vh', h.toFixed(2) + 'px');
    });
  };

  R.render = function (root) {
    const D = R.data;
    R.applyTheme();
    const navItems = D.sections.map((s, i) => ({ s, i })).filter(o => o.s.visible && o.s.nav)
      .sort((x, y) => (x.s.navOrder == null ? x.i : x.s.navOrder) - (y.s.navOrder == null ? y.i : y.s.navOrder));
    const nb = R.edit ? `<b data-path="meta.brand">${D.meta.brand}</b>` : `<b>${esc(D.meta.brand)}</b>`;
    const ns = R.edit ? `<span data-path="meta.brandSub">${D.meta.brandSub}</span>` : `<span>${esc(D.meta.brandSub)}</span>`;
    let html = `<nav class="nav"><a href="#top" class="brand"><svg class="mark" viewBox="0 0 22 22" aria-hidden="true">${[0,1,2].map(y=>[0,1,2].map(x=>`<rect x="${x*8}" y="${y*8}" width="6" height="6" style="--d:${(x+y)*.18}s"/>`).join("")).join("")}</svg>${nb}<i></i>${ns}</a>
      <div class="links">${navItems.map(o => o.s.type === 'chapter' ? `<span class="dd"><a href="#${o.s.id}">${esc(o.s.nav)}<u></u></a><span class="dm">${o.s.items.map(x => `<a href="#${x.to}">${esc(ttl(x.title))}</a>`).join('')}</span></span>` : `<a href="#${o.s.id}"${o.s.type === 'contact' ? ' class="cta"' : ''}>${esc(o.s.nav)}</a>`).join('')}</div></nav>`;
    D.sections.forEach((s, i) => {
      if (!s.visible && !R.edit) return;
      const L = T[s.type] || {}; let lay = s.layout && L[s.layout] ? s.layout : Object.keys(L)[0];
      const st = s.style || {};
      const inner = L[lay] ? L[lay](s, `sections.${i}`) : '';
      const fit = /^(chapter|steps|tools|video|contact)$/.test(s.type) || (s.type === 'rail' && lay !== 'rail');
      html += `<section id="${s.id}" class="sec t-${s.type} l-${lay} ${fit ? 'fit' : ''} ${s.visible ? '' : 'hidden'}" data-si="${i}" data-bg="${st.bg || 'dark'}" data-pad="${st.pad || 'm'}"${s.refh ? ` data-refh="${s.refh}"` : ''}>${inner}</section>`;
    });
    root.innerHTML = html;
    R.bind(root);
  };

  /* ---------- 交互 ---------- */
  R.bind = function (root) {
    setTimeout(() => R.fitRef(root), 30);
    setTimeout(() => R.fitVideo(root), 30);
    root.querySelectorAll('.mf').forEach(flowBind);
    window.R3D && R3D.mount(root);
    root.querySelectorAll('.tab,.vseg button').forEach(b => b.addEventListener('click', () => requestAnimationFrame(R.flowRefresh)));
    root.querySelectorAll('[data-tabs]').forEach(tb => {
      const tabsEl = tb.querySelectorAll('.tab'), pn = tb.querySelectorAll('.panel');
      tabsEl.forEach((x, i) => x.addEventListener('click', e => {
        if (x.classList.contains("on")) return;
        tabsEl.forEach(y => y.classList.remove('on')); pn.forEach(y => y.classList.remove('on'));
        x.classList.add('on'); pn[i].classList.add('on');
      }));
    });
    root.querySelectorAll('.stage').forEach(sg => {
      const main = sg.querySelector('.main img');
      sg.querySelectorAll('.thumbs button').forEach(b => b.addEventListener('click', e => {
        const src = b.querySelector('img');
        sg.querySelectorAll('.thumbs button').forEach(y => y.classList.remove('on')); b.classList.add('on');
        main.src = R.src(src.dataset.lb, 1); main.dataset.lb = src.dataset.lb; main.dataset.img = src.dataset.img;
        if (R.edit) { e.stopPropagation(); R.onPick && R.onPick(src); }
      }));
    });
    root.querySelectorAll('.cx').forEach(cx => {
      const bs = cx.querySelectorAll('.cxc button'), ps = cx.querySelectorAll('.cxp');
      bs.forEach((b, i) => b.addEventListener('click', () => { R.ui[cx.dataset.ckey] = i; bs.forEach(y => y.classList.remove('on')); ps.forEach(y => y.classList.remove('on')); b.classList.add('on'); ps[i].classList.add('on'); }));
    });
    root.querySelectorAll('.vseg').forEach(sg => {
      const bs = [...sg.children], ps = sg.closest('[data-vh]').querySelectorAll('.vp');
      bs.forEach((b, i) => b.addEventListener('click', () => { R.ui[sg.dataset.key] = i; bs.forEach(y => y.classList.toggle('on', y === b)); ps.forEach((y, k) => y.classList.toggle('on', k === i)); }));
    });
    root.querySelectorAll('[data-sl]').forEach(sl => {
      const top = sl.querySelector('.top'), hd = sl.querySelector('.hd');
      const imA = sl.querySelector(':scope > img'), imB = top.querySelector('img');
      const mv = x => { const r = sl.getBoundingClientRect(); const p = Math.min(100, Math.max(0, (x - r.left) / r.width * 100)); top.style.clipPath = `inset(0 0 0 ${p}%)`; hd.style.left = p + '%'; };
      let d = 0;
      sl.addEventListener('pointerdown', e => { d = 1; mv(e.clientX); sl.setPointerCapture(e.pointerId); e.preventDefault(); });
      sl.addEventListener('pointermove', e => d && mv(e.clientX));
      sl.addEventListener('pointerup', () => d = 0);
      const wrap = sl.closest('.cmp');
      wrap && wrap.querySelectorAll('.rows button').forEach(b => b.addEventListener('click', e => {
        if (R.edit && e.target.tagName === 'IMG') return;
        wrap.querySelectorAll('.rows button').forEach(y => y.classList.remove('on')); b.classList.add('on');
        imA.src = R.src(b.dataset.a, 1); imA.dataset.lb = b.dataset.a; imA.dataset.img = b.dataset.pa;
        imB.src = R.src(b.dataset.b, 1); imB.dataset.lb = b.dataset.b; imB.dataset.img = b.dataset.pb;
        mv(sl.getBoundingClientRect().left + sl.offsetWidth / 2);
      }));
    });
    R.layoutH();
  };

  /* 横向滚动区：根据轨道长度设置纵向高度 */
  /* 导航：阅读进度条 + 当前章节高亮 */
  R.onScrollNav = function () {
    const nav = document.querySelector('.nav'); if (!nav) return;
    const de = document.documentElement, max = de.scrollHeight - innerHeight;
    nav.style.setProperty('--sp', max > 0 ? Math.min(1, scrollY / max) : 0);
    const line = nav.getBoundingClientRect().bottom + 140, ls = [...nav.querySelectorAll('.links>a,.links>.dd>a')];
    let cur = null;
    ls.forEach(a => { const t = document.querySelector(a.getAttribute('href')); if (t && t.getBoundingClientRect().top <= line) cur = a; });
    if (max > 0 && scrollY >= max - 4) cur = ls[ls.length - 1] || cur;
    ls.forEach(a => a.classList.toggle('on', a === cur));
    const edge = innerHeight / 2;
    document.querySelectorAll('.rl').forEach(rl => {
      const as = [...rl.querySelectorAll('.rail a')], bs = [...rl.querySelectorAll('.rb')]; let k = 0;
      const kk = new Map(as.map(a => [a.getAttribute('href'), as.indexOf(a)]));
      bs.forEach((b, i) => { if (b.getBoundingClientRect().top <= edge) { const base = '#' + b.id.split('-').slice(0, 2).join('-'); k = kk.has('#' + b.id) ? kk.get('#' + b.id) : kk.has(base) ? kk.get(base) : (b.dataset.k != null ? +b.dataset.k : i); } });
      as.forEach((a, i) => { a.classList.toggle('on', i === k); a.classList.toggle('done', i < k); });
    });
  };
  R.vw = () => { const a = document.getElementById('app'); return a ? a.clientWidth : innerWidth; };
  R.layoutH = function () {
    document.documentElement.style.setProperty('--cw', R.vw() + 'px');
    const mobile = R.vw() < 900;
    document.querySelectorAll('.l-hscroll').forEach(s => {
      const tr = s.querySelector('.track');
      if (mobile) { s.style.height = ''; tr.style.transform = ''; return; }
      s.style.height = (tr.scrollWidth - R.vw() + s.querySelector('.pin').offsetHeight) + 'px';
    });
    R.onScrollH(); R.onScrollNav(); requestAnimationFrame(R.flowRefresh);
    SW.mount(); requestAnimationFrame(SW.paint);
  };
  R.onScrollH = function () {
    if (R.vw() < 900) return;
    document.querySelectorAll('.l-hscroll').forEach(s => {
      const r = s.getBoundingClientRect(), tr = s.querySelector('.track'), pin = s.querySelector('.pin');
      const top = parseFloat(getComputedStyle(pin).top) || 0;
      const max = tr.scrollWidth - R.vw(), p = Math.min(1, Math.max(0, (top - r.top) / (r.height - pin.offsetHeight || 1)));
      tr.style.transform = `translate3d(${-p * max}px,0,0)`;
    });
  };
  /* ---------- 左右切换：键盘 ← → 与两侧小箭头 ----------
     把一个板块里的页签 / 视图按钮 / 案例编号 / 缩略图串成一条线，依次走完 */
  const SW = R.SW = {
    /* 取 scope 这一层的切换控件：ctrls 为按钮，subs 为各按钮对应的下一层容器（叶子层为 null） */
    level(scope) {
      const tabs = [...scope.querySelectorAll('.tab')];
      if (tabs.length > 1) {
        const box = tabs[0].closest('[data-tabs]');
        return { ctrls: tabs, subs: [...box.querySelectorAll('.panel')] };
      }
      const seg = scope.querySelector('.vseg');
      if (seg) return { ctrls: [...seg.children], subs: [...seg.closest('[data-vh]').querySelectorAll('.vp')] };
      for (const s of ['.cxc button', '.rows button', '.thumbs button']) {
        const a = [...scope.querySelectorAll(s)];
        if (a.length > 1) return { ctrls: a, subs: null };
      }
      return null;
    },
    count(scope) {
      const L = SW.level(scope);
      if (!L) return 1;
      return L.subs ? L.subs.reduce((n, x) => n + SW.count(x), 0) : L.ctrls.length;
    },
    pos(scope) {
      const L = SW.level(scope);
      if (!L) return 0;
      const k = Math.max(0, L.ctrls.findIndex(x => x.classList.contains('on')));
      if (!L.subs) return k;
      let n = 0;
      for (let i = 0; i < k; i++) n += SW.count(L.subs[i]);
      return n + SW.pos(L.subs[k]);
    },
    go(scope, n) {
      const L = SW.level(scope);
      if (!L) return;
      if (!L.subs) { if (!L.ctrls[n].classList.contains('on')) L.ctrls[n].click(); return; }
      for (let i = 0; i < L.ctrls.length; i++) {
        const c = SW.count(L.subs[i]);
        if (n < c) { if (!L.ctrls[i].classList.contains('on')) L.ctrls[i].click(); SW.go(L.subs[i], n); return; }
        n -= c;
      }
    },
    board() {
      const mid = innerHeight / 2;
      return [...document.querySelectorAll('.t-hero,.sec.fit,.rb')].find(b => { const r = b.getBoundingClientRect(); return r.height && r.top <= mid && r.bottom > mid; }) || null;
    },
    /* 滚轮：板块内还有可切换项就先切换，到头才交给整屏翻页 */
    wheel(dir) {
      if (innerWidth <= 900) return false;
      const b = SW.board(); if (!b) return false;
      const nb = document.querySelector('.nav').getBoundingClientRect().bottom;
      if (Math.abs(b.getBoundingClientRect().top - nb) > 4) return false;
      const tot = SW.count(b), p = SW.pos(b);
      if (tot < 2 || p + dir < 0 || p + dir >= tot) return false;
      return SW.step(dir);
    },
    step(dir) {
      const b = SW.board(); if (!b) return false;
      const tot = SW.count(b), p = SW.pos(b), to = p + dir;
      if (tot < 2) return false;
      if (to >= 0 && to < tot) SW.go(b, to);
      SW.paint(); requestAnimationFrame(R.flowRefresh);
      const a = SW.ui && SW.ui.querySelector(dir < 0 ? '.pv' : '.nx');
      if (a) { a.classList.remove('hit'); void a.offsetWidth; a.classList.add('hit'); }
      return true;
    },
    paint() {
      if (!SW.ui) return;
      const b = innerWidth > 900 ? SW.board() : null, tot = b ? SW.count(b) : 0, on = tot > 1;
      SW.ui.classList.toggle('on', on);
      if (!on) { SW.last = null; return; }
      const p = SW.pos(b);
      SW.ui.querySelector('.pv').disabled = p <= 0;
      SW.ui.querySelector('.nx').disabled = p >= tot - 1;
      SW.ui.querySelector('small').textContent = `${p + 1} / ${tot}`;
      if (SW.last !== b) {
        SW.last = b;
        const n = SW.ui.querySelector('.nx'); n.classList.remove('hint'); void n.offsetWidth; n.classList.add('hint');
      }
    },
    mount() {
      if (SW.ui) return;
      const d = document.createElement('div');
      d.className = 'sw';
      d.innerHTML = '<button class="pv" title="上一项（键盘 ←）" aria-label="上一项"></button><div class="nxw"><button class="nx" title="下一项（键盘 →）" aria-label="下一项"></button><small></small></div>';
      document.body.appendChild(d);
      SW.ui = d;
      d.querySelector('.pv').onclick = () => SW.step(-1);
      d.querySelector('.nx').onclick = () => SW.step(1);
    }
  };
  R.swPaint = SW.paint;
  addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.repeat || innerWidth <= 900) return;
    const t = e.target, ae = document.activeElement;
    if (/INPUT|TEXTAREA|SELECT|VIDEO/.test(t.tagName || '') || t.isContentEditable || (ae && ae.isContentEditable)) return;
    if (document.querySelector('.lb.on,.kp.on')) return;
    if (SW.step(e.key === 'ArrowLeft' ? -1 : 1)) e.preventDefault();
  });
  document.addEventListener('click', () => requestAnimationFrame(SW.paint));
  addEventListener('scroll', () => SW.paint(), { passive: true });
  addEventListener('resize', () => SW.paint());

  addEventListener('scroll', () => { R.onScrollH(); R.onScrollNav(); R.flowRefresh(); }, { passive: true });
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { R.layoutH(); R.flowRefresh(); }, 120); });
  addEventListener('load', () => R.layoutH());
})();

/* 本地预览（127.0.0.1）自动跟随编辑站保存而刷新 */
(function () {
  if (window.__liveReload) return;
  window.__liveReload = 1;
  if (/\/editor\//.test(location.pathname)) return;      // 编辑站不自动刷新
  if (window.R && R.edit) return;
  if (!/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) return;
  let last = 0;
  setInterval(function () {
    if (window.R && R.edit) return;
    fetch('/api/version', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (v) {
      if (last && v.stamp && v.stamp !== last) location.reload();
      last = v.stamp || last;
    }).catch(function () {});
  }, 3000);
})();
