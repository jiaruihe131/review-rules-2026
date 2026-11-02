window.RR_API = 'https://ghjqqz-gary-d1g24ywqt5096ad9c.service.tcloudbase.com/rr26api';
// 访客身份 + 访问记录
(function () {
  const KEY = 'rr26_user', VKEY = 'rr26_vid';
  const ROLES = ['品牌方', '代理商 / 服务商', '代运营', '其他'];
  const INDS = ['个护', '家清', '亲子', '其他'];

  let vid = localStorage.getItem(VKEY);
  if (!vid) { vid = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); localStorage.setItem(VKEY, vid); }
  let user = null;
  try { user = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}

  let queue = [];
  let timer = null;
  function flush(beacon) {
    if (!user || !queue.length) return;
    const body = JSON.stringify({ action: 'track', vid, user, events: queue.splice(0, 30) });
    if (beacon && navigator.sendBeacon) navigator.sendBeacon(RR_API, new Blob([body], { type: 'text/plain' }));
    else fetch(RR_API, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body, keepalive: true }).catch(() => {});
  }
  function track(t, data) {
    queue.push(Object.assign({ t, page: location.hash || '#/' }, data || {}));
    clearTimeout(timer);
    timer = setTimeout(flush, 1500);
  }

  // 规则详情停留时长
  let open = null;
  function ruleOpen(id, title) {
    ruleClose();
    open = { id, title, at: Date.now() };
    track('rule', { rule: id, title });
  }
  function ruleClose() {
    if (!open) return;
    const sec = Math.round((Date.now() - open.at) / 1000);
    if (sec >= 2) track('dwell', { rule: open.id, title: open.title, sec });
    open = null;
  }

  let lastQ = '', qTimer = null;
  function search(q, hits) {
    clearTimeout(qTimer);
    if (!q || q.length < 1) return;
    qTimer = setTimeout(() => { if (q !== lastQ) { lastQ = q; track('search', { q, hits }); } }, 1200);
  }

  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { ruleClose(); flush(true); } });
  window.addEventListener('pagehide', () => { ruleClose(); flush(true); });

  // ---------- 身份表单 ----------
  function opts(list, name) {
    return list.map(v => `<label class="idf-chip"><input type="checkbox" name="${name}" value="${v}"><span>${v}</span></label>`).join('');
  }
  function showForm(edit) {
    const el = document.createElement('div');
    el.className = 'idf-layer';
    el.innerHTML = `
      <form class="idf" autocomplete="on">
        <div class="idf-eyebrow">2026 个护家清亲子行业审核规则</div>
        <h2>${edit ? '修改身份信息' : '欢迎查看，先认识一下你'}</h2>
        <p class="idf-sub">只需填写一次，之后打开会自动记住。</p>
        <label class="idf-field"><span>公司 / 品牌名称<i>*</i></span><input name="company" maxlength="60" required placeholder="例如：某某日化"></label>
        <label class="idf-field"><span>你的称呼<i>*</i></span><input name="name" maxlength="30" required placeholder="例如：王经理"></label>
        <div class="idf-field"><span>身份<i>*</i><em class="idf-multi">可多选</em></span><div class="idf-chips">${opts(ROLES, 'role')}</div></div>
        <div class="idf-field"><span>主营行业<i>*</i><em class="idf-multi">可多选</em></span><div class="idf-chips">${opts(INDS, 'industry')}</div></div>
        <p class="idf-err" hidden>请把信息填写完整，身份和主营行业至少各选一项</p>
        <button type="submit" class="idf-btn">进入查看</button>
        ${edit ? '<button type="button" class="idf-cancel">取消</button>' : ''}
        <p class="idf-note">信息仅用于了解规则阅读情况、改进内容，不会对外公开。</p>
      </form>`;
    document.body.appendChild(el);
    document.body.classList.add('lock');
    const f = el.querySelector('form');
    if (user) {
      f.company.value = user.company; f.name.value = user.name;
      [['role', user.role], ['industry', user.industry]].forEach(([n, v]) => {
        String(v || '').split('、').forEach(x => { const r = f.querySelector(`input[name="${n}"][value="${x}"]`); if (r) r.checked = true; });
      });
    }
    f.addEventListener('input', () => { el.querySelector('.idf-err').hidden = true; });
    f.addEventListener('change', () => { el.querySelector('.idf-err').hidden = true; });
    setTimeout(() => f.company.focus(), 50);
    const c = el.querySelector('.idf-cancel');
    if (c) c.onclick = () => { el.remove(); document.body.classList.remove('lock'); };
    f.onsubmit = e => {
      e.preventDefault();
      const u = {
        company: f.company.value.trim(), name: f.name.value.trim(),
        role: [...f.querySelectorAll('input[name="role"]:checked')].map(x => x.value).join('、'),
        industry: [...f.querySelectorAll('input[name="industry"]:checked')].map(x => x.value).join('、')
      };
      if (!u.company || !u.name || !u.role || !u.industry) { el.querySelector('.idf-err').hidden = false; return; }
      user = u;
      localStorage.setItem(KEY, JSON.stringify(u));
      el.remove(); document.body.classList.remove('lock');
      renderBadge();
      track('identify', { title: edit ? '修改身份' : '首次登记' });
      track('view', {});
    };
  }

  function renderBadge() {
    let b = document.getElementById('idBadge');
    if (!b) {
      b = document.createElement('button');
      b.id = 'idBadge'; b.className = 'id-badge'; b.title = '修改身份信息';
      b.onclick = () => showForm(true);
      const nav = document.querySelector('.nav-inner');
      if (nav) nav.appendChild(b);
    }
    b.textContent = user ? `${user.company} · ${user.name}` : '';
    b.hidden = !user;
  }

  // ---------- 意见反馈 ----------
  const FB_TYPES = ['内容有误', '看不懂', '想看的规则没有', '页面体验', '其他'];
  function showFeedback(rule) {
    if (!user) { showForm(false); return; }
    const el = document.createElement('div');
    el.className = 'idf-layer';
    el.innerHTML = `
      <form class="idf fb">
        <div class="idf-eyebrow">意见反馈</div>
        <h2>帮我们把内容做得更好</h2>
        <p class="idf-sub">${rule ? '针对：' + rule.title.replace(/[<>&]/g, '') : '规则写得不清楚、有遗漏，或想看哪些内容，都可以告诉我们。'}</p>
        <div class="idf-field"><span>反馈类型</span><div class="idf-chips">${FB_TYPES.map((v, i) => `<label class="idf-chip"><input type="radio" name="type" value="${v}" ${i === 0 && rule ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div></div>
        <label class="idf-field"><span>具体内容<i>*</i></span><textarea name="text" maxlength="1000" rows="5" required placeholder="例如：去屑洗发水的头皮屑画面，打码后具体要多模糊才能过？"></textarea></label>
        <label class="idf-field"><span>联系方式（选填）</span><input name="contact" maxlength="60" placeholder="微信 / 手机，方便我们回复你"></label>
        <p class="idf-err" hidden>请填写反馈内容</p>
        <button type="submit" class="idf-btn">提交反馈</button>
        <button type="button" class="idf-cancel">取消</button>
      </form>`;
    document.body.appendChild(el);
    document.body.classList.add('lock');
    const f = el.querySelector('form');
    const close = () => { el.remove(); if (!document.querySelector('.overlay:not([hidden])')) document.body.classList.remove('lock'); };
    el.querySelector('.idf-cancel').onclick = close;
    el.addEventListener('click', e => { if (e.target === el) close(); });
    setTimeout(() => f.text.focus(), 50);
    f.onsubmit = async e => {
      e.preventDefault();
      const text = f.text.value.trim();
      if (!text) { el.querySelector('.idf-err').hidden = false; return; }
      const btn = f.querySelector('.idf-btn'); btn.disabled = true; btn.textContent = '提交中…';
      try {
        const r = await fetch(RR_API, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'feedback',
          vid, user, text, contact: f.contact.value.trim(),
          type: (f.querySelector('input[name="type"]:checked') || {}).value || '其他',
          rule: rule ? rule.id : null, page: location.hash || '#/'
        }) });
        if (!r.ok) throw new Error();
        f.innerHTML = '<div class="fb-done"><b>✓</b><h2>收到，谢谢你的反馈</h2><p class="idf-sub">我们会尽快核实并更新内容。</p><button type="button" class="idf-btn">好的</button></div>';
        f.querySelector('.idf-btn').onclick = close;
      } catch (err) {
        btn.disabled = false; btn.textContent = '提交反馈';
        const er = el.querySelector('.idf-err'); er.textContent = '提交失败，请稍后再试'; er.hidden = false;
      }
    };
  }
  window.openFeedback = showFeedback;
  const fab = document.createElement('button');
  fab.className = 'fb-fab'; fab.type = 'button'; fab.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span>意见反馈</span>';
  fab.onclick = () => showFeedback(null);
  document.body.appendChild(fab);

  window.Tracker = {
    view: () => track('view', {}),
    ruleOpen, ruleClose, search,
    image: (rule, cap) => track('image', { rule, title: cap })
  };

  if (user) { renderBadge(); track('view', {}); }
  else showForm(false);
})();
