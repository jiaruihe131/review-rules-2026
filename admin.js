window.RR_API = 'https://ghjqqz-gary-d1g24ywqt5096ad9c.service.tcloudbase.com/rr26api';
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const RULES = window.RULES || [];
  const ruleTitle = id => (RULES.find(r => r.id === id) || {}).title || ('规则 #' + id);
  let pass = sessionStorage.getItem('rr26_admin') || '';
  let all = [], days = 30, fb = [], fbTab = 'todo';

  async function load() {
    $('#status').textContent = '加载中…';
    const res = await fetch(RR_API, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'stats', pass, days }) });
    if (res.status === 401) { sessionStorage.removeItem('rr26_admin'); showLogin('密码错误'); return; }
    const d = await res.json();
    all = d.events || []; fb = d.feedback || [];
    $('#status').textContent = `近 ${days} 天 · 共 ${all.length} 条记录 · 更新于 ${new Date().toLocaleTimeString('zh-CN')}`;
    render();
  }

  function showLogin(err) {
    $('#login').hidden = false; $('#main').hidden = true;
    $('#loginErr').textContent = err || '';
    $('#pass').focus();
  }
  $('#loginForm').onsubmit = e => {
    e.preventDefault();
    pass = $('#pass').value; sessionStorage.setItem('rr26_admin', pass);
    $('#login').hidden = true; $('#main').hidden = false; load();
  };

  const count = (arr, keyFn) => {
    const m = new Map();
    arr.forEach(x => { const k = keyFn(x); if (k == null || k === '') return; m.set(k, (m.get(k) || 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const fmt = ts => { const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const T = { view: '浏览页面', rule: '查看规则', dwell: '停留', search: '搜索', image: '看案例图', identify: '登记身份' };
  const pageName = p => {
    if (!p || p === '#/' || p === '#') return '首页';
    const m = p.replace('#/', '').split('/');
    const cat = { fake: '虚假夸大', induce: '诱导点击', value: '价值观导向', exp: '平台体验' };
    const ind = { personal: '个护', home: '家清', kids: '亲子' };
    const sub = { toothpaste: '牙膏', dandruff: '去屑洗发水', hairloss: '防脱洗发水', hairdye: '染发', laundry: '衣清', envclean: '环清', privatecare: '私护', teen: '青少年洗护' };
    const top = { disparage: '贬低第三方', gross: '恶心不适' };
    if (m[0] === 'cat') return '大类 · ' + (cat[m[1]] || m[1]);
    if (m[0] === 'industry') return '行业 · ' + (ind[m[1]] || m[1]) + (m[2] ? ' / ' + (sub[m[2]] || m[2]) : '');
    if (m[0] === 'topic') return '专题 · ' + (top[m[1]] || m[1]);
    return p;
  };

  function bars(rows, max, labelFn) {
    if (!rows.length) return '<p class="empty">暂无数据</p>';
    const top = rows[0][1] || 1;
    return rows.slice(0, max).map(([k, n]) => `<div class="bar"><span class="bl">${labelFn ? labelFn(k) : esc(k)}</span><span class="bt"><i style="width:${Math.max(4, n / top * 100)}%"></i></span><b>${n}</b></div>`).join('');
  }

  function renderFb() {
    const todo = fb.filter(x => !x.done).length;
    $('#fbCount').textContent = `共 ${fb.length} 条 · 待处理 ${todo} 条`;
    const list = fb.filter(x => fbTab === 'all' || (fbTab === 'done' ? x.done : !x.done));
    $('#fbList').innerHTML = list.length ? list.map(x => `<div class="fbi${x.done ? ' done' : ''}">
      <div class="meta"><em>${esc(x.type)}</em><b>${esc(x.company)} · ${esc(x.name)}</b><span>${esc(x.role)} · ${esc(x.industry)}</span>
        ${x.rule ? `<span>针对：${esc(ruleTitle(x.rule))}</span>` : `<span>${esc(pageName(x.page))}</span>`}
        ${x.contact ? `<span>联系：${esc(x.contact)}</span>` : ''}<span>${fmt(x.ts)}</span></div>
      <p>${esc(x.text)}</p>
      <div class="act"><button data-fbk="${esc(x.key)}" data-done="${x.done ? 0 : 1}">${x.done ? '改为待处理' : '标记已处理'}</button> <button data-fbdel="${esc(x.key)}" style="color:var(--red);background:none">删除</button></div></div>`).join('')
      : `<p class="empty">${fbTab === 'todo' ? '没有待处理的反馈' : '暂无反馈'}</p>`;
    document.querySelectorAll('[data-fbk]').forEach(b => b.onclick = async () => {
      b.disabled = true;
      await fetch(RR_API, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ pass, action: 'feedback-done', key: b.dataset.fbk, done: b.dataset.done === '1' }) });
      const it = fb.find(x => x.key === b.dataset.fbk); if (it) it.done = b.dataset.done === '1';
      renderFb();
    });
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-fbdel]'); if (!b) return;
    if (!confirm('删除这条反馈？')) return;
    await fetch(RR_API, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ pass, action: 'feedback-done', key: b.dataset.fbdel, remove: true }) });
    fb = fb.filter(x => x.key !== b.dataset.fbdel); renderFb();
  });
  document.querySelectorAll('[data-fb]').forEach(b => b.onclick = () => {
    fbTab = b.dataset.fb; document.querySelectorAll('[data-fb]').forEach(x => x.classList.toggle('on', x === b)); renderFb();
  });

  function render() {
    renderFb();
    const q = $('#filter').value.trim().toLowerCase();
    const ev = q ? all.filter(e => [e.company, e.name, e.role, e.industry].join(' ').toLowerCase().includes(q)) : all;
    const visitors = new Set(ev.map(e => e.vid));
    const companies = new Set(ev.map(e => e.company));
    const today = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
    const todayN = new Set(ev.filter(e => new Date(e.ts + 8 * 3600e3).toISOString().slice(0, 10) === today).map(e => e.vid)).size;
    const ruleViews = ev.filter(e => e.t === 'rule').length;
    const dw = ev.filter(e => e.t === 'dwell' && e.sec);
    const avg = dw.length ? Math.round(dw.reduce((s, e) => s + e.sec, 0) / dw.length) : 0;

    $('#kpi').innerHTML = [
      ['访客', visitors.size], ['公司 / 品牌', companies.size], ['今日访客', todayN],
      ['规则查看次数', ruleViews], ['平均阅读时长', avg ? avg + ' 秒' : '—']
    ].map(([l, v]) => `<div class="k"><b>${v}</b><span>${l}</span></div>`).join('');

    // 每日趋势
    const byDay = new Map();
    for (let i = days - 1; i >= 0; i--) byDay.set(new Date(Date.now() + 8 * 3600e3 - i * 86400e3).toISOString().slice(5, 10), new Set());
    ev.forEach(e => { const k = new Date(e.ts + 8 * 3600e3).toISOString().slice(5, 10); if (byDay.has(k)) byDay.get(k).add(e.vid); });
    const tv = [...byDay.entries()].map(([k, s]) => [k, s.size]);
    const tmax = Math.max(1, ...tv.map(x => x[1]));
    $('#trend').innerHTML = tv.map(([k, n]) => `<div class="col" title="${k}：${n} 位访客"><i style="height:${n / tmax * 100}%"></i><span>${k.slice(3)}</span></div>`).join('');

    $('#topRules').innerHTML = bars(count(ev.filter(e => e.t === 'rule'), e => e.rule), 10, k => esc(ruleTitle(Number(k))));
    $('#topSearch').innerHTML = bars(count(ev.filter(e => e.t === 'search'), e => e.q), 10);
    $('#zeroSearch').innerHTML = bars(count(ev.filter(e => e.t === 'search' && e.hits === 0), e => e.q), 10);
    $('#topPages').innerHTML = bars(count(ev.filter(e => e.t === 'view'), e => pageName(e.page)), 10);
    // 多选：拆开后每项都计入
    const uniq = [...new Map(ev.map(e => [e.vid, e])).values()];
    const split = f => uniq.flatMap(e => String(e[f] || '').split('、').filter(Boolean).map(v => ({ v })));
    $('#byInd').innerHTML = bars(count(split('industry'), x => x.v), 6);
    $('#byRole').innerHTML = bars(count(split('role'), x => x.v), 6);

    // 访客明细
    const people = new Map();
    ev.forEach(e => {
      const p = people.get(e.vid) || { ...e, n: 0, rules: new Set(), first: e.ts, last: e.ts, sec: 0 };
      p.n++; if (e.t === 'rule' && e.rule) p.rules.add(e.rule);
      if (e.t === 'dwell') p.sec += e.sec || 0;
      p.first = Math.min(p.first, e.ts); p.last = Math.max(p.last, e.ts);
      if (e.ts >= p.last) Object.assign(p, { company: e.company, name: e.name, role: e.role, industry: e.industry, region: e.region || p.region });
      people.set(e.vid, p);
    });
    const list = [...people.values()].sort((a, b) => b.last - a.last);
    $('#people').innerHTML = list.length ? list.map(p => `<tr data-vid="${esc(p.vid)}">
      <td><b>${esc(p.company)}</b><small>${esc(p.name)}</small></td><td>${esc(p.role)}</td><td>${esc(p.industry)}</td>
      <td>${p.rules.size}</td><td>${p.sec ? Math.round(p.sec / 60 * 10) / 10 + ' 分钟' : '—'}</td><td>${esc(p.region || '—')}</td><td>${fmt(p.last)}</td></tr>`).join('')
      : '<tr><td colspan="7" class="empty">暂无访客</td></tr>';
    document.querySelectorAll('#people tr[data-vid]').forEach(tr => tr.onclick = () => showPerson(tr.dataset.vid));
  }

  function showPerson(vid) {
    const ev = all.filter(e => e.vid === vid).sort((a, b) => b.ts - a.ts);
    const p = ev[0];
    $('#pTitle').textContent = `${p.company} · ${p.name}`;
    $('#pMeta').textContent = `${p.role} · ${p.industry}${p.region ? ' · ' + p.region : ''}`;
    $('#pList').innerHTML = ev.map(e => {
      let d = '';
      if (e.t === 'view') d = pageName(e.page);
      else if (e.t === 'rule') d = ruleTitle(e.rule);
      else if (e.t === 'dwell') d = `${ruleTitle(e.rule)}（${e.sec} 秒）`;
      else if (e.t === 'search') d = `“${e.q}”，${e.hits} 条结果`;
      else if (e.t === 'image') d = (e.rule ? ruleTitle(e.rule) + ' · ' : '') + e.title;
      else d = e.title;
      return `<li><time>${fmt(e.ts)}</time><em>${T[e.t] || e.t}</em><span>${esc(d)}</span></li>`;
    }).join('');
    $('#pDel').onclick = async () => {
      if (!confirm(`删除「${p.company} · ${p.name}」的全部访问记录？删除后不可恢复。`)) return;
      await fetch(RR_API, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ pass, action: 'delete', vid }) });
      $('#person').hidden = true; load();
    };
    $('#person').hidden = false;
  }
  $('#person').onclick = e => { if (e.target.id === 'person' || e.target.classList.contains('x')) $('#person').hidden = true; };

  $('#days').onchange = e => { days = +e.target.value; load(); };
  $('#filter').oninput = render;
  $('#refresh').onclick = load;
  $('#csv').onclick = () => {
    const head = ['时间', '公司', '称呼', '身份', '行业', '地区', '动作', '页面', '规则', '内容', '搜索词', '结果数', '停留秒'];
    const rows = all.map(e => [new Date(e.ts).toLocaleString('zh-CN'), e.company, e.name, e.role, e.industry, e.region, T[e.t] || e.t, pageName(e.page), e.rule ? ruleTitle(e.rule) : '', e.title, e.q, e.hits ?? '', e.sec ?? '']);
    const csv = '\ufeff' + [head, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `访问记录_近${days}天_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  if (pass) { $('#login').hidden = true; $('#main').hidden = false; load(); } else showLogin();
})();
