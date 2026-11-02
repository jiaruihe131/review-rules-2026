(function () {
  const CATS = window.CATEGORIES, INDS = window.INDUSTRIES, RULES = window.RULES;
  const app = document.getElementById('app');
  const DIR = { loose: '放宽', tight: '收紧', change: '调整' };
  const catById = Object.fromEntries(CATS.map(c => [c.id, c]));
  const subMap = {}; // subId -> {sub, parent}
  INDS.forEach(p => p.subs.forEach(s => subMap[s.id] = { sub: s, parent: p }));
  const indById = Object.fromEntries(INDS.map(i => [i.id, i]));

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pill = (cls, t) => `<span class="pill ${cls}">${esc(t)}</span>`;
  const dirPill = r => pill(r.dir, DIR[r.dir]);

  // 规则适用行业的文字
  function indText(r) {
    if (r.indNote) return r.indNote;
    if (r.ind.includes('all')) return '全行业';
    return r.ind.map(x => indById[x] ? indById[x].name : (subMap[x].parent.name + '·' + subMap[x].sub.name)).join('、');
  }
  // 规则是否适用某行业 / 子类
  function hits(r, parentId, subId) {
    if (r.ind.includes('all')) return true;
    if (r.ind.includes(parentId)) return true;
    if (subId) return r.ind.includes(subId);
    return indById[parentId].subs.some(s => r.ind.includes(s.id));
  }
  const isGeneral = r => r.ind.includes('all');

  function ruleCard(r, opts = {}) {
    const extra = opts.showCat ? pill('gray', catById[r.cat].name) : '';
    return `<article class="rule" data-rule="${r.id}">
      <div><div class="top">${dirPill(r)}${extra}${pill('gray', r.tag)}${pill('gray', indText(r))}</div>
      <h4>${esc(r.title)}</h4></div>
      <p>${esc(r.summary.replace(/#/g, ''))}</p>
      <span class="arrow">查看详情 ›</span>
    </article>`;
  }

  // ---------- 首页：拒审大类 ----------
  function renderHome() {
    const n = RULES.length,
      loose = RULES.filter(r => r.dir === 'loose').length,
      tight = RULES.filter(r => r.dir === 'tight').length;
    const cards = CATS.map(c => {
      const list = RULES.filter(r => r.cat === c.id);
      const tags = [...new Set(list.map(r => r.l2))];
      const cnt = d => list.filter(r => r.dir === d).length;
      const fx = { fake: '素材必看', value: '含贬低第三方', exp: '含恶心不适' }[c.id];
      return `<a class="cat-card${fx ? ' hot' : ''}" href="#/cat/${c.id}">
        <span class="en">${c.en}${fx ? `<i class="hot-b">${fx}</i>` : ''}</span>
        <h3>${c.name}</h3>
        <p>${esc(c.desc)}</p>
        <div class="chips">${tags.map(t => pill('gray', t)).join('')}</div>
        <div class="meta"><span class="num">${list.length} 条变化 ·
          ${cnt('loose') ? `<span style="color:var(--green)">放宽 ${cnt('loose')}</span>` : ''}
          ${cnt('tight') ? ` <span style="color:var(--red)">收紧 ${cnt('tight')}</span>` : ''}
          ${cnt('change') ? ` <span style="color:var(--amber)">调整 ${cnt('change')}</span>` : ''}</span>
          <span class="more">查看 ›</span></div>
      </a>`;
    }).join('');
    const inds = INDS.map(p => {
      const own = RULES.filter(r => !isGeneral(r) && hits(r, p.id)).length;
      return `<a class="ind-entry" href="#/industry/${p.id}">
        <h3>${p.name}</h3><p>${p.subs.map(s => s.name).join(' · ')}</p>
        <p style="margin-top:8px">行业专属 ${own} 条 + 全行业通用 ${RULES.filter(isGeneral).length} 条</p>
        <span class="more">进入 ›</span></a>`;
    }).join('');

    const F = window.FOCUS;
    const mc = RULES.filter(r => r.cat === F.main.cat);
    const focus = `
      <section class="focus">
        <div class="focus-head">
          <span class="focus-tag">素材制作必看</span>
          <h2>这三类，最影响素材怎么拍、怎么说。</h2>
        </div>
        <div class="focus-grid">
          <div class="ft ft-main">
            <span class="ft-k">${F.main.kicker}</span>
            <h3>${F.main.title}</h3>
            <p class="ft-lead">${esc(F.main.lead)}</p>
            <div class="ft-num"><b>${mc.length}</b><span>条变化</span><b class="g">${mc.filter(r => r.dir === 'loose').length}</b><span>放宽</span><b class="r">${mc.filter(r => r.dir === 'tight').length}</b><span>收紧</span></div>
            <ul class="ft-points">${F.main.points.map(p => `<li data-rule="${p.rule}"><i class="${p.dir}">${DIR[p.dir]}</i><span>${esc(p.text)}</span><em>›</em></li>`).join('')}</ul>
            <a class="ft-btn" href="#/cat/${F.main.cat}">查看虚假夸大全部 ${mc.length} 条 ›</a>
          </div>
          ${F.side.map(t => `
          <div class="ft ft-side">
            <span class="ft-k">${t.kicker}</span>
            <h3>${t.title}</h3>
            <p class="ft-lead">${esc(t.lead)}</p>
            <ul class="ft-ok">${t.ok.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
            <p class="ft-no">${esc(t.no)}</p>
            <a class="ft-btn" href="#/topic/${t.id}">查看规则与案例 ›</a>
          </div>`).join('')}
        </div>
      </section>`;

    app.innerHTML = `
      <section class="hero">
        <div class="eyebrow">2026 个护家清亲子行业审核规则变化</div>
        <h1>今年哪些能投了，<br>哪些更严了。</h1>
        <p class="lead">按拒审大类和行业整理，附支持与拒绝案例。</p>
        <button class="hero-search" data-open-search>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          搜索规则，如：仿新闻、头皮屑、限时限量
        </button>
        <p class="stats-line"><b>${n}</b> 项规则变化 · <b class="g">${loose}</b> 项放宽 · <b class="r">${tight}</b> 项收紧</p>
            </section>
      ${focus}
      <h2 class="sec-title" style="margin-top:80px">全部拒审大类</h2>
      <p class="sec-sub">按审核标签树的一级标签划分，与拒审理由里的类别一致。</p>
      <div class="grid">${cards}</div>
      <div class="others"><span class="label">其他拒审大类 2026 年暂无规则变化：</span>${(window.OTHER_CATEGORIES || []).map(x => `<span>${esc(x)}</span>`).join('')}</div>
      <h2 class="sec-title" style="margin-top:72px">按行业查看</h2>
      <p class="sec-sub">个护、家清、亲子三个行业，可细到具体品类。</p>
      <div class="ind-row">${inds}</div>`;
  }

  // ---------- 二级：大类页 ----------
  let catFilter = { ind: 'all', dir: 'all' };
  function renderCat(id) {
    const c = catById[id];
    if (!c) return renderHome();
    let list = RULES.filter(r => r.cat === id);
    if (catFilter.ind !== 'all') list = list.filter(r => hits(r, catFilter.ind));
    if (catFilter.dir !== 'all') list = list.filter(r => r.dir === catFilter.dir);
    const l2s = [...new Set(RULES.filter(r => r.cat === id).map(r => r.l2))].filter(t => list.some(r => r.l2 === t));
    const groups = l2s.map(t => {
      const g = list.filter(r => r.l2 === t);
      const l3 = [...new Set(g.map(r => r.tag))];
      return `<div class="group-h">${esc(t)}<small>${g.length} 条 · 涉及 ${l3.map(esc).join('、')}</small></div>
        <div class="rules">${g.map(r => ruleCard(r)).join('')}</div>`;
    }).join('');
    const indBtns = [['all', '全部行业'], ...INDS.map(i => [i.id, i.name])]
      .map(([k, v]) => `<button data-cf-ind="${k}" class="${catFilter.ind === k ? 'on' : ''}">${v}</button>`).join('');
    const dirBtns = [['all', '全部'], ['loose', '放宽'], ['tight', '收紧'], ['change', '调整']]
      .map(([k, v]) => `<button data-cf-dir="${k}" class="${catFilter.dir === k ? 'on' : ''}">${v}</button>`).join('');
    app.innerHTML = `
      <section class="page-head">
        <div class="crumb"><a href="#/">拒审大类</a> › ${c.name}</div>
        <h1>${c.name}</h1>
        <p>按二级标签分组：${esc(c.desc)}</p>
      </section>
      <div class="seg">${indBtns}</div>
      <div class="filters"><span class="label">变化方向</span>${dirBtns}</div>
      ${groups || '<div class="empty">该筛选条件下暂无规则变化</div>'}`;
    app.querySelectorAll('[data-cf-ind]').forEach(b => b.onclick = () => { catFilter.ind = b.dataset.cfInd; renderCat(id); });
    app.querySelectorAll('[data-cf-dir]').forEach(b => b.onclick = () => { catFilter.dir = b.dataset.cfDir; renderCat(id); });
  }

  // ---------- 重点专题页 ----------
  function renderTopic(id) {
    const t = window.FOCUS.side.find(x => x.id === id);
    if (!t) return renderHome();
    const list = t.rules.map(i => RULES.find(r => r.id === i)).filter(Boolean);
    const c = catById[list[0].cat];
    app.innerHTML = `
      <section class="page-head">
        <div class="crumb"><a href="#/">首页</a> › <a href="#/cat/${c.id}">${c.name}</a> › ${t.title}</div>
        <span class="focus-tag" style="margin-bottom:14px;display:inline-block">素材制作必看</span>
        <h1>${t.title}</h1>
        <p>${esc(t.lead)}</p>
      </section>
      <div class="topic-sum">
        <div><h5>可以这样做</h5><ul class="ft-ok">${t.ok.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div><h5>仍然不行</h5><p class="ft-no" style="margin:0">${esc(t.no)}</p></div>
      </div>
      <div class="group-h">相关规则<small>${list.length} 条</small></div>
      <div class="rules">${list.map(r => ruleCard(r)).join('')}</div>`;
  }

  // ---------- 二级：行业页 ----------
  function renderIndustry(pid, sid) {
    const p = indById[pid];
    if (!p) return renderHome();
    const list = RULES.filter(r => hits(r, pid, sid));
    const own = list.filter(r => !isGeneral(r)), gen = list.filter(isGeneral);
    const byCat = arr => CATS.map(c => {
      const g = arr.filter(r => r.cat === c.id);
      return g.length ? `<div class="group-h">${c.name}<small>${g.length} 条</small></div><div class="rules">${g.map(r => ruleCard(r)).join('')}</div>` : '';
    }).join('');
    const seg = INDS.map(i => `<button data-go="#/industry/${i.id}" class="${i.id === pid ? 'on' : ''}">${i.name}</button>`).join('');
    const subs = [`<button data-go="#/industry/${pid}" class="${!sid ? 'on' : ''}">全部${p.name}</button>`,
      ...p.subs.map(s => `<button data-go="#/industry/${pid}/${s.id}" class="${sid === s.id ? 'on' : ''}">${s.name}</button>`)].join('');
    const name = sid ? subMap[sid].sub.name : p.name;
    app.innerHTML = `
      <section class="page-head">
        <div class="crumb"><a href="#/">首页</a> › <a href="#/industry/${pid}">${p.name}</a>${sid ? ' › ' + name : ''}</div>
        <h1>${name}</h1>
        <p>共 ${list.length} 条规则变化：行业专属 ${own.length} 条，全行业通用 ${gen.length} 条。</p>
      </section>
      <div class="seg">${seg}</div>
      <div class="subtabs">${subs}</div>
      <h2 class="sec-title" style="font-size:26px;margin-top:40px">${name}专属</h2>
      ${own.length ? byCat(own) : `<div class="empty" style="padding:28px 0;text-align:left">${name}暂无专属规则变化，请看下方全行业通用规则。</div>`}
      <h2 class="sec-title" style="font-size:26px;margin-top:56px">全行业通用</h2>
      <p class="sec-sub" style="margin-bottom:0">以下规则对所有行业生效，${name}同样适用。</p>
      ${byCat(gen)}`;
    app.querySelectorAll('[data-go]').forEach(b => b.onclick = () => location.hash = b.dataset.go);
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === 'industry'));
  }

  // ---------- 规则详情 ----------
  const sheetLayer = document.getElementById('sheetLayer'), sheet = document.getElementById('sheet');
  const ICON = { ok: '✓', no: '✕', warn: '!', '': '' };
  function openRule(id) {
    const r = RULES.find(x => x.id === +id);
    if (!r) return;
    const blocks = r.blocks.map(b => `<div class="blk"><h5>${esc(b.h)}</h5><ul>${b.items.map(([t, s]) =>
      `<li class="${t || 'plain'}"><span class="ic">${ICON[t]}</span><span>${esc(s).replace(/#([^#]+)#/g, "<em class=\"hl\">$1</em>")}</span></li>`).join('')}</ul></div>`).join('');
    let gal = '';
    if (r.images && r.images.length) {
      const wide = r.images.every(im => !/r2_|r18_1|r22|r16_1/.test(im.src));
      gal = `<div class="blk"><h5>案例参考</h5><div class="gallery ${wide ? 'wide' : ''}">${r.images.map(im =>
        im.video ? `<figure class="vid"><div class="ph"><video src="${im.video}" poster="${im.src}" controls playsinline muted preload="none"></video>${im.type ? `<span class="badge ${im.type}">${im.type === 'ok' ? '支持' : '拒绝'}</span>` : ''}</div><figcaption>${esc(im.cap)}</figcaption></figure>` :
        `<figure data-img="${im.src}" data-cap="${esc(im.cap)}"><div class="ph"><img src="${im.src}" alt="${esc(im.cap)}" loading="lazy">${im.type ? `<span class="badge ${im.type}">${im.type === 'ok' ? '支持' : '拒绝'}</span>` : ''}</div><figcaption>${esc(im.cap)}</figcaption></figure>`).join('')}</div></div>`;
    }
    sheet.innerHTML = `<button class="close" aria-label="关闭">✕</button>
      <div class="top">${dirPill(r)}${pill('gray', catById[r.cat].name)}${pill('gray', r.l2)}</div>
      <h2>${esc(r.title)}</h2>
      <div class="sum">${esc(r.summary).replace(/#([^#]+)#/g, "<em class=\"hl\">$1</em>")}</div>
      <div class="tagpath"><span class="lb">拒审标签</span>${esc(catById[r.cat].name)} › ${esc(r.l2)} › <b>${esc(r.tag)}</b></div>
      ${r.related ? `<div class="tagpath rel"><span class="lb">相关标签</span>${r.related.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
      <div class="kv"><span>适用行业<b>${esc(indText(r))}</b></span><span>流量范围<b>${esc(r.scope)}</b></span>${r.status ? `<span>执行情况<b>${esc(r.status)}</b></span>` : ''}</div>
      ${blocks}${gal}
      <div class="rule-fb"><span>这条规则有疑问，或和实际审核结果不一致？</span><button type="button" data-fb-rule="${r.id}">反馈给我们 ›</button></div>`;
    sheetLayer.hidden = false; document.body.classList.add('lock'); sheetLayer.scrollTop = 0;
    window.Tracker && Tracker.ruleOpen(r.id, r.title);
    sheet.querySelector('.close').onclick = closeRule;
    const fbb = sheet.querySelector('[data-fb-rule]'); if (fbb) fbb.onclick = () => window.openFeedback && openFeedback(r);
  }
  function closeRule() { window.Tracker && Tracker.ruleClose(); sheetLayer.hidden = true; if (searchLayer.hidden) document.body.classList.remove('lock'); }
  sheetLayer.addEventListener('click', e => { if (e.target === sheetLayer) closeRule(); });

  // 大图
  const lb = document.getElementById('lightbox');
  document.addEventListener('click', e => {
    const f = e.target.closest('figure[data-img]');
    if (f) { document.getElementById('lbImg').src = f.dataset.img; document.getElementById('lbCap').textContent = f.dataset.cap; lb.hidden = false; const rr = f.closest('#sheet') && RULES.find(x => sheet.innerHTML.includes(x.title)); window.Tracker && Tracker.image(rr ? rr.id : null, f.dataset.cap); return; }
    const card = e.target.closest('[data-rule]');
    if (card) { openRule(card.dataset.rule); return; }
    if (e.target.closest('[data-open-search]')) openSearch();
  });
  lb.onclick = () => lb.hidden = true;

  // ---------- 搜索 ----------
  const searchLayer = document.getElementById('searchLayer'), input = document.getElementById('searchInput'), result = document.getElementById('searchResult');
  const HOT = ['仿新闻', '效果对比', '头皮屑', '防脱', '牙齿', '限时限量', '箭头', '第一', '贬低', '管道'];
  document.getElementById('searchHot').innerHTML = '<span class="label">热门</span>' + HOT.map(h => `<button data-hot="${h}">${h}</button>`).join('');
  document.getElementById('searchHot').onclick = e => { const b = e.target.closest('[data-hot]'); if (b) { input.value = b.dataset.hot; doSearch(); } };

  const fullText = r => [r.title, r.summary, r.tag, r.l2, ...(r.related || []), catById[r.cat].name, indText(r), DIR[r.dir], r.scope,
    ...r.ind.flatMap(x => subMap[x] ? [subMap[x].sub.name, subMap[x].parent.name] : indById[x] ? [indById[x].name, ...indById[x].subs.map(s => s.name)] : []),
    ...r.blocks.flatMap(b => [b.h, ...b.items.map(i => i[1])])].join('\n').replace(/#/g, '');
  const INDEX = RULES.map(r => ({ r, t: fullText(r) }));
  const hl = (s, ks) => { let h = esc(s); ks.forEach(k => { if (k) h = h.split(esc(k)).join(`<mark>${esc(k)}</mark>`); }); return h; };

  let active = 0, shown = [];
  function doSearch() {
    const q = input.value.trim();
    if (!q) { result.innerHTML = ''; shown = []; return; }
    const ks = q.split(/\s+/).filter(Boolean);
    shown = INDEX.map(({ r, t }) => {
      if (!ks.every(k => t.toLowerCase().includes(k.toLowerCase()))) return null;
      let score = 0; ks.forEach(k => { if (r.title.includes(k)) score += 5; if (r.tag.includes(k)) score += 3; if (r.summary.includes(k)) score += 2; });
      // 找命中片段
      let snip = r.summary;
      if (!ks.some(k => r.summary.includes(k))) {
        const line = r.blocks.flatMap(b => b.items.map(i => i[1])).find(l => ks.some(k => l.includes(k)));
        if (line) snip = line;
      }
      return { r, score, snip: snip.replace(/#/g, "") };
    }).filter(Boolean).sort((a, b) => b.score - a.score);
    active = 0;
    window.Tracker && Tracker.search(q, shown.length);
    result.innerHTML = shown.length
      ? `<div class="sr-count">找到 ${shown.length} 条相关规则</div>` + shown.map((x, i) =>
        `<a class="sr ${i === 0 ? 'act' : ''}" data-sr="${x.r.id}"><div class="t">${dirPill(x.r)}${hl(x.r.title, ks)}</div>
         <div class="s">${pill('gray', catById[x.r.cat].name)} ${pill('gray', indText(x.r))} ${hl(x.snip, ks)}</div></a>`).join('')
      : `<div class="empty" style="padding:40px 0">没有找到“${esc(q)}”相关规则，换个关键词试试</div>`;
  }
  input.addEventListener('input', doSearch);
  input.addEventListener('keydown', e => {
    const items = result.querySelectorAll('.sr');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (!items.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((el, i) => el.classList.toggle('act', i === active)); items[active].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && shown[active]) openRule(shown[active].r.id);
  });
  result.addEventListener('click', e => { const a = e.target.closest('[data-sr]'); if (a) openRule(a.dataset.sr); });
  function openSearch() { searchLayer.hidden = false; document.body.classList.add('lock'); setTimeout(() => input.focus(), 30); }
  function closeSearch() { searchLayer.hidden = true; if (sheetLayer.hidden) document.body.classList.remove('lock'); }
  document.getElementById('openSearch').onclick = openSearch;
  document.getElementById('closeSearch').onclick = closeSearch;
  searchLayer.addEventListener('click', e => { if (e.target === searchLayer) closeSearch(); });
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
    if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') { if (!lb.hidden) lb.hidden = true; else if (!sheetLayer.hidden) closeRule(); else if (!searchLayer.hidden) closeSearch(); }
  });

  // ---------- 路由 ----------
  function route() {
    const h = location.hash.replace(/^#\/?/, '').split('/');
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === 'home' && (h[0] === '' || h[0] === 'cat')));
    if (h[0] === 'cat') renderCat(h[1]);
    else if (h[0] === 'topic') renderTopic(h[1]);
    else if (h[0] === 'industry') renderIndustry(h[1], h[2]);
    else renderHome();
    window.scrollTo(0, 0);
    if (route.done) window.Tracker && Tracker.view();
    route.done = true;
  }
  let lastCat = null;
  window.addEventListener('hashchange', () => {
    const c = location.hash.match(/#\/cat\/(\w+)/);
    if (c && c[1] !== lastCat) catFilter = { ind: 'all', dir: 'all' };
    lastCat = c ? c[1] : null;
    route();
  });
  route();
})();
