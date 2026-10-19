(() => {
  'use strict';

  /* ============ Tiện ích ============ */
  /* Random an toàn bằng CSPRNG – crypto.getRandomValues() thay cho secureRandom() */
  const secureRandom = (() => {
    const buf = new Uint32Array(1);
    return () => {
      crypto.getRandomValues(buf);
      return buf[0] / 4294967296;   // [0, 1)
    };
  })();

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rand = (a, b) => secureRandom() * (b - a) + a;
  const pick = arr => arr[Math.floor(secureRandom() * arr.length)];
  const pickAvoid = (arr, prev) => {
    if (arr.length < 2) return arr[0];
    let it;
    do { it = pick(arr); } while (it === prev);
    return it;
  };
  const sample = (arr, n) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(secureRandom() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, n);
  };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const clone = o => JSON.parse(JSON.stringify(o));
  const shorten = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
  const slug = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'mon';
  const fmtPrice = n => (n > 0 ? n.toLocaleString('vi-VN') + 'đ' : n === 0 ? 'Miễn phí' : '');
  function parsePrice(v) {
    if (typeof v === 'number') return Math.max(0, Math.round(v));
    const s = String(v ?? '').trim().toLowerCase().replace(/\s/g, '');
    if (!s) return 0;
    const m = s.match(/^(\d+(?:[.,]\d+)?)k$/);
    if (m) return Math.round(parseFloat(m[1].replace(',', '.')) * 1000);
    const nums = [...s.matchAll(/\d+/g)].map(x => Number(x[0]));
    if (!nums.length) return 0;
    const k = /k/.test(s) ? 1000 : 1;
    const a = nums[0] * k, b = (nums[1] ?? nums[0]) * k;
    return Math.round((a + b) / 2 / 1000) * 1000 || Math.round((a + b) / 2);
  }

  const store = {
    get(k, d) { try { const v = localStorage.getItem('hnag:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('hnag:' + k, JSON.stringify(v)); } catch { /* bỏ qua */ } },
    del(k) { try { localStorage.removeItem('hnag:' + k); } catch { /* bỏ qua */ } }
  };

  const PX = {
    cache: new Map(),
    src(e) {
      e = String(e ?? '').trim();
      let url = this.cache.get(e);
      if (url) return url;
      const g = 16;
      const c = document.createElement('canvas');
      c.width = c.height = g;
      const x = c.getContext('2d');
      x.font = `${Math.round(g * 0.8)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(e, g / 2, g / 2 + 1);
      url = c.toDataURL('image/png');
      this.cache.set(e, url);
      return url;
    },
    set(el, e) { if (el) el.innerHTML = `<img class="px-i" src="${this.src(e)}" alt="">`; },
    scan(root = document) {
      $$('.pxi, .emoji-fallback, .brand-emoji, .loader-emoji, .slot-emoji, .side-emoji, .coin .face, .face .e, .vact button', root)
        .forEach(el => {
          if (el.querySelector('img.px-i')) return;
          const t = el.textContent.trim();
          if (t) PX.set(el, t);
        });
    }
  };

  /* ============ Độ hiếm (tự tính theo giá, hoặc đặt tay trong data) ============ */
  const RARITY = {
    thuong:     { label: 'Thường',      color: '#9aa3ad' },
    hiem:       { label: 'Hiếm',        color: '#4aa3ff' },
    suthi:      { label: 'Sử thi',      color: '#b57bff' },
    huyenthoai: { label: 'Huyền thoại', color: '#ffa62b' },
    covat:      { label: 'Cổ vật',      color: '#ff4d5e' }
  };
  const RKEYS = Object.keys(RARITY);
  /* ============ Streak & Kho trồng cây ============ */
  const STREAK_MILESTONES = [5, 15, 20, 30];
  const GARDEN_ITEMS = [
    { id: 'hat-tuoi', emoji: '🌱', name: 'Hạt giống tươi', rate: 0.08 },
    { id: 'chai-nuoc', emoji: '💧', name: 'Chai rửa nước', rate: 0.06 },
    { id: 'phan-bon', emoji: '🧪', name: 'Phân bón', rate: 0.05 },
    { id: 'chau-gom', emoji: '🏺', name: 'Chậu gốm', rate: 0.04 },
    { id: 'thuoc-bot', emoji: '💊', name: 'Thuốc trừ sâu', rate: 0.03 },
    { id: 'bat-sau', emoji: '🪤', name: 'Bẫy bắt sâu', rate: 0.02 }
  ];
  /* ============ Hệ thống chậu cây (đơn giản) ============ */
  const POT_LEVELS = [
    { emoji: '🪨', name: 'Chậu đất' },
    { emoji: '🥉', name: 'Chậu đồng' },
    { emoji: '🔧', name: 'Chậu sắt' },
    { emoji: '🥇', name: 'Chậu vàng' },
    { emoji: '💎', name: 'Chậu kim cương' }
  ];
  let potLevel = 0;
  let plantedItemId = null;
  let plantedDate = null;
  let plantGrowth = 0;
  const PLANT_STAGES = [
    { min: 0, emoji: '🌱', label: 'Mầm non' },
    { min: 20, emoji: '🌿', label: 'Cây non' },
    { min: 45, emoji: '🪴', label: 'Cây đang lớn' },
    { min: 70, emoji: '🌳', label: 'Cây trưởng thành' },
    { min: 90, emoji: '🌻', label: 'Cây ra hoa' }
  ];
  function plantStage() {
    let s = PLANT_STAGES[0];
    for (const st of PLANT_STAGES) if (plantGrowth >= st.min) s = st;
    return s;
  }
  function consumeItem(id) {
    if ((inventory[id] || 0) <= 0) return false;
    inventory[id]--;
    if (inventory[id] <= 0) delete inventory[id];
    store.set('inventory', inventory);
    renderGarden();
    return true;
  }

  function potHasUnlocked() {
    return inventory['chau-gom'] && inventory['chau-gom'] > 0;
  }

  function canUpgrade() {
    return potLevel < POT_LEVELS.length - 1;
  }

  function renderPot() {
    const display = $('#potDisplay');
    const btnPlant = $('#btnPlant');
    const btnWater = $('#btnWater');
    const btnFert = $('#btnFert');
    const btnUpgrade = $('#btnUpgrade');
    const hint = $('#potHint');

    if (!potHasUnlocked()) {
      display.innerHTML = `<div class="pot-slot"><div class="pot-emoji">❓</div><div class="pot-name">Chưa mở khóa</div><div class="pot-level">Nhận chậu đất từ kho</div></div>`;
      btnPlant.disabled = true;
      btnWater.disabled = true;
      btnFert.disabled = true;
      btnUpgrade.disabled = true;
      hint.hidden = false;
      hint.textContent = 'Chưa có chậu. Nhận chậu đất từ kho trồng cây để bắt đầu.';
      return;
    }

    const pot = POT_LEVELS[potLevel];
    let plantHtml;
    if (plantedItemId) {
      const st = plantStage();
      const scale = (1 + plantGrowth / 100 * 0.8).toFixed(2);
      plantHtml = `<div class="plant-slot"><div class="plant-emoji" style="font-size:calc(64px * ${scale});">${st.emoji}</div><div class="plant-name">${st.label} · +${plantGrowth}%</div><div class="growth-bar"><i style="width:${plantGrowth}%"></i></div></div>`;
    } else {
      plantHtml = `<div class="plant-slot"><div class="plant-emoji" style="opacity:.35">🌱</div><div class="plant-name">Chưa trồng</div></div>`;
    }
    display.innerHTML = `<div class="pot-row">${plantHtml}<div class="pot-slot"><div class="pot-emoji">${pot.emoji}</div><div class="pot-name">${pot.name}</div><div class="pot-level">Cấp ${potLevel + 1}/${POT_LEVELS.length}</div></div></div>`;

    btnPlant.disabled = !!plantedItemId || (inventory['hat-tuoi'] || 0) <= 0;
    btnWater.disabled = !plantedItemId || (inventory['chai-nuoc'] || 0) <= 0 || plantGrowth >= 100;
    btnFert.disabled = !plantedItemId || (inventory['phan-bon'] || 0) <= 0 || plantGrowth >= 100;
    btnUpgrade.disabled = !canUpgrade();
    hint.hidden = true;
  }

  function doPlant() {
    if (plantedItemId) return;
    if (!consumeItem('hat-tuoi')) return;
    plantedItemId = 'hat-tuoi';
    plantedDate = todayKey();
    plantGrowth = 0;
    store.set('plantedItemId', plantedItemId);
    store.set('plantedDate', plantedDate);
    store.set('plantGrowth', plantGrowth);
    renderPot();
    toast('🌱 Đã trồng hạt giống vào chậu!');
  }

  function growPlant(amount, label) {
    if (!plantedItemId) { toast('Chưa có cây để chăm!'); return; }
    if (plantGrowth >= 100) { toast('Cây đã trưởng thành tối đa!'); return; }
    plantGrowth = Math.min(100, plantGrowth + amount);
    store.set('plantGrowth', plantGrowth);
    renderPot();
    toast(`${label} +${amount}% · Cây đạt ${plantGrowth}%`);
  }
  function doWater() {
    if (!consumeItem('chai-nuoc')) { toast('Hết nước, hãy random thêm!'); return; }
    growPlant(4, '💧 Tưới nước');
  }
  function doFert() {
    if (!consumeItem('phan-bon')) { toast('Hết phân bón, hãy random thêm!'); return; }
    growPlant(7, '🧪 Bón phân');
  }

  function doUpgrade() {
    if (!canUpgrade()) return;
    potLevel++;
    store.set('potLevel', potLevel);
    renderPot();
    toast(`⬆️ Nâng cấp lên ${POT_LEVELS[potLevel].name}!`);
  }
  function computeStreakFromHistory() {
    const days = new Set();
    history.forEach(h => { if (h.date) days.add(h.date); });
    if (!days.size) { streak = 0; lastStreakDate = null; return 0; }
    const sorted = [...days].sort();
    let cur = 1, best = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) cur++; else cur = 1;
      if (cur > best) best = cur;
    }
    streak = best;
    lastStreakDate = sorted[sorted.length - 1];
    store.set('streak', streak);
    store.set('lastStreakDate', lastStreakDate);
    return streak;
  }
  function addInventoryItem(id) {
    inventory[id] = (inventory[id] || 0) + 1;
    store.set('inventory', inventory);
    renderGarden();
  }
  function rollGardenItem() {
    let acc = 0; const r = Math.random();
    for (const it of GARDEN_ITEMS) {
      acc += it.rate;
      if (r < acc) return it;
    }
    return null;
  }
  function renderStreak() { $('#streakVal').textContent = streak; }
  function renderGarden() {
    const grid = $('#gardenGrid'); const empty = $('#gardenEmpty');
    grid.innerHTML = '';
    for (const it of GARDEN_ITEMS) {
      const qty = inventory[it.id] || 0;
      grid.insertAdjacentHTML('beforeend', `<div class="garden-slot${qty ? '' : ' empty'}">
        <div class="emoji">${it.emoji}</div>
        <div class="name">${it.name}</div>
        <div class="qty">x${qty}</div>
      </div>`);
    }
    empty.hidden = Object.values(inventory).some(q => q > 0);
  }
  function showStreakMilestone(days, rewardId) {
    const it = GARDEN_ITEMS.find(x => x.id === rewardId);
    const msg = document.createElement('div');
    msg.className = 'drop-toast';
    msg.innerHTML = `<div class="drop-emoji">${it ? it.emoji : '🎉'}</div>
      <div class="drop-msg">🔥 Streak ${days} ngày! Nhận ${it ? it.name : 'phần thưởng'}</div>`;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2500);
  }
  // Mốc giá để lên bậc. Ví dụ đồ ăn: dưới 40k = Thường, 40–70k = Hiếm, ...
  const TIERS = { food: [40000, 70000, 120000, 180000], drink: [25000, 40000, 55000, 70000] };
  function rarityOfTab(tab, it) {
    if (it.rarity && RARITY[it.rarity]) return it.rarity;
    const t = TIERS[tab] || TIERS.food, p = it.price || 0;
    let i = 0;
    while (i < t.length && p >= t[i]) i++;
    return RKEYS[i];
  }
  const rarityOf = it => rarityOfTab(state.tab, it);
  const rcolor = it => RARITY[rarityOf(it)].color;

  /* ============ Nội dung theo tab ============ */
  const TABS = {
    food: {
      emoji: '🍜',
      title: 'Hôm nay ăn gì?',
      subtitle: 'Mở két ra, số phận sẽ chọn bữa này cho bạn.',
      jokes: [
        'Ý trời đã định, ăn đi đừng cãi! 🙏',
        'Calo tính sau, ngon tính trước 😋',
        'Vũ trụ vừa gửi bạn một thông điệp: ĂN. 🌌',
        'Ví nói: được thôi, ví chịu 🥲',
        'Không phải bạn chọn món, mà món chọn bạn ✨',
        'Thợ lùn đã rèn xong bữa này cho bạn ⚒️'
      ]
    },
    drink: {
      emoji: '🧋',
      title: 'Hôm nay uống gì?',
      subtitle: 'Khát thì có rồi, chỉ thiếu mỗi cái tên thôi.',
      jokes: [
        'Uống xong deadline sẽ tự chạy 🏃',
        'Nước vào là tỉnh, tiền ra là nghèo 💸',
        'Ly này là của số phận, ly sau mới là của bạn 🥤',
        'Đừng hỏi vì sao, cứ hút đi 🧋',
        'Hôm nay trời nóng, ly này đã được định sẵn ☀️',
        'Thợ lùn bảo: ly này ngon, tin lùn đi 🍺'
      ]
    }
  };

  const REROLL_JOKES = [
    'Hmm, chưa ưng à? Mở lại nào!',
    'Lần 2 rồi nha, đừng khó tính quá 🙄',
    'Lần 3 rồi đó! Thợ lùn bắt đầu thấy phiền 😤',
    'Bạn chọn người yêu còn nhanh hơn chọn món 😂',
    'Thôi nhịn luôn đi? 😏 Đùa thôi, chọn đại đi!',
    'Sao hỏa còn dễ chọn hơn bạn 👽'
  ];

  /* ============ Dữ liệu (nguồn: data.js, bản nháp chưa lưu nằm ở localStorage) ============ */
  const state = {
    tab: 'food', mode: 'case', tag: 'all', budget: 0,
    busy: false, rerolls: 0, lastPick: null, lastPickTab: null,
    muted: store.get('muted', false)
  };

  function normalize(M) {
    const out = { food: [], drink: [] };
    for (const t of ['food', 'drink']) {
      out[t] = ((M && M[t]) || []).map(i => ({
        id: String(i.id || slug(i.name)),
        name: String(i.name || ''),
        emoji: i.emoji || '🍽️',
        desc: i.desc || '',
        tags: Array.isArray(i.tags) ? i.tags : [],
        price: parsePrice(i.price),
        link: i.link || '',
        image: i.image || '',
        rarity: i.rarity || '',
        off: !!i.off
      }));
    }
    return out;
  }

  const draft = store.get('draft', null);
  let DATA = normalize(draft || window.MENU);
  let dirty = Boolean(draft);
  let history = store.get('history', []);
  let openCount = store.get('count', 0);
  let fileHandle = null;

  /* ============ F1: Đã ăn + chống lặp 7 ngày / F2: Sổ sưu tầm / F3: Thực đơn tuần ============ */
  const dkey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayKey = (off = 0) => { const d = new Date(); d.setDate(d.getDate() + off); return dkey(d); };
  const weekMondayKey = () => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return dkey(d);
  };
  const dexKey = (tab, id) => tab + ':' + id;

  let ate = store.get('ate', {});
  let dex = store.get('dex', {});
  let antiR = store.get('antiR', true);
  let plan = store.get('plan', null);

  (function pruneAte() {
    const alive = new Set();
    for (let i = 0; i < 7; i++) alive.add(todayKey(-i));
    for (const k of Object.keys(ate)) if (!alive.has(k)) delete ate[k];
  })();

  function eatenSet(days = 7) {
    const s = new Set();
    for (let i = 0; i < days; i++) (ate[todayKey(-i)] || []).forEach(k => s.add(k));
    return s;
  }

  function markAte(tab, id) {
    const d = todayKey(), k = dexKey(tab, id);
    (ate[d] = ate[d] || []);
    if (!ate[d].includes(k)) ate[d].push(k);
    store.set('ate', ate);
  }
  function unmarkAte(tab, id) {
    const d = todayKey();
    ate[d] = (ate[d] || []).filter(k => k !== dexKey(tab, id));
    store.set('ate', ate);
  }

  function dexAdd(tab, item) {
    const k = dexKey(tab, item.id), rec = dex[k];
    if (rec) { rec.n++; rec.last = Date.now(); }
    else dex[k] = { n: 1, first: Date.now(), last: Date.now() };
    store.set('dex', dex);
  }

  function poolFor(tab, anti) {
    let list = DATA[tab].filter(i => !i.off);
    if (anti) {
      const es = eatenSet();
      const f = list.filter(i => !es.has(dexKey(tab, i.id)));
      if (f.length) list = f;
    }
    return list;
  }

  const getAll = () => DATA[state.tab];
  const getPool = () => poolFor(state.tab, antiR).filter(i =>
    (state.tag === 'all' || i.tags.includes(state.tag)) &&
    (!state.budget || i.price <= state.budget)
  );

  const FILE_HEADER = `/* ==========================================================
   DỮ LIỆU MÓN – trang web tự ghi file này khi bạn bấm "Lưu vào data.js".
   Cũng có thể sửa tay, mỗi món là 1 dòng:
   id     : không dấu, không trùng nhau
   name   : tên món            emoji : hiện khi chưa có ảnh
   desc   : mô tả ngắn         tags  : nhóm để lọc
   price  : giá (số, đơn vị đồng) – dùng để lọc ngân sách và tính độ hiếm
   link   : link đặt món (trống = mở Google Maps tìm quán)
   image  : đường dẫn ảnh (trống = images/<id>.jpg, không có thì hiện emoji)
   rarity : trống = tự tính theo giá, hoặc thuong | hiem | suthi | huyenthoai | covat
   off    : true = ẩn món khỏi két
   ========================================================== */

`;
  function serialize() {
    const row = i => JSON.stringify({
      id: i.id, name: i.name, emoji: i.emoji, desc: i.desc, tags: i.tags,
      price: i.price, link: i.link, image: i.image, rarity: i.rarity, off: i.off
    });
    const block = k => `  ${k}: [\n` + DATA[k].map(i => '    ' + row(i)).join(',\n') + '\n  ]';
    return FILE_HEADER + 'window.MENU = {\n' + block('food') + ',\n\n' + block('drink') + '\n};\n';
  }

  /* ============ Âm thanh (Web Audio, không cần file mp3) ============ */
  const Sound = {
    ctx: null, timer: null, step: 0,
    init() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    tone(freq, dur = 0.12, type = 'triangle', vol = 0.12, when = 0) {
      if (state.muted || !this.ctx) return;
      const t = this.ctx.currentTime + when;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    tick() { this.tone(850 + secureRandom() * 250, 0.045, 'square', 0.045); },
    flip() { this.tone(300, 0.08, 'sine', 0.12); this.tone(520, 0.1, 'sine', 0.1, 0.06); },
    startMusic() {
      this.init();
      this.stopMusic();
      // Giai điệu ngũ cung vui nhộn – muốn đổi nhạc thì sửa mảng này
      const notes = [261.6, 329.6, 392, 523.3, 392, 329.6, 293.7, 370, 440, 587.3, 440, 370];
      this.step = 0;
      this.timer = setInterval(() => {
        const n = notes[this.step % notes.length];
        this.tone(n, 0.16, 'triangle', 0.09);
        if (this.step % 4 === 0) this.tone(n / 2, 0.22, 'sine', 0.12);
        this.step++;
      }, 150);
    },
    stopMusic() { clearInterval(this.timer); this.timer = null; },
    // level 0..4 theo độ hiếm: càng hiếm, fanfare càng dài
    win(level = 0) {
      this.init();
      [523.3, 659.3, 784, 1046.5].forEach((f, i) => this.tone(f, 0.26, 'triangle', 0.15, i * 0.1));
      this.tone(1318.5, 0.55, 'triangle', 0.15, 0.45);
      if (level >= 3) [1568, 1318.5, 1568, 2093].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.12, 0.6 + i * 0.12));
      if (level >= 4) { this.tone(110, 0.9, 'sawtooth', 0.12, 0.2); this.tone(165, 0.9, 'sawtooth', 0.08, 0.2); }
    }
  };

  /* ============ Đồng xu pixel ============ */
  const GLYPH_SAP = [[6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [6, 6], [6, 7], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [10, 9], [10, 10], [9, 11], [8, 11], [7, 11], [6, 11]];
  const GLYPH_NGUA = [[6, 5], [7, 5], [6, 6], [7, 6], [8, 6], [6, 7], [9, 7], [6, 8], [10, 8], [6, 9], [10, 9], [6, 10], [10, 10], [6, 11], [7, 11], [10, 11]];
  const GLYPH_S = [[8, 6], [7, 7], [9, 7], [7, 8], [8, 8], [9, 8], [7, 9], [9, 9], [7, 10], [8, 10], [9, 10]];
  const GLYPH_STAR = [
    [8, 3], [7, 4], [8, 4], [9, 4],
    [6, 5], [7, 5], [8, 5], [9, 5], [10, 5],
    [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6],
    [7, 7], [8, 7], [9, 7],
    [6, 8], [7, 8], [8, 8], [9, 8], [10, 8],
    [5, 9], [6, 9], [8, 9], [10, 9], [11, 9],
    [4, 10], [5, 10], [11, 10], [12, 10]
  ];
  const CoinRain = {
    cv: $('#confetti'), parts: [], raf: 0, tex: null, cache: new Map(),
    imgs: null,
    coinSrc() { return [ 'images/matup_2d.png', 'images/matngua_2d.png' ]; },
    darken(hex, f = 0.45) {
      const n = parseInt(hex.slice(1), 16);
      const r = Math.round(((n >> 16) & 255) * f);
      const g = Math.round(((n >> 8) & 255) * f);
      const b = Math.round((n & 255) * f);
      return `rgb(${r},${g},${b})`;
    },
    makeTex(body, glyph = GLYPH_S) {
      const s = 16, c = document.createElement('canvas');
      c.width = c.height = s;
      const g = c.getContext('2d');
      const edge = this.darken(body), hi = '#fff7cf';
      const cx = 7.5, cy = 7.5;
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const d = Math.hypot(x - cx, y - cy);
          if (d > 7.4) continue;
          g.fillStyle = d > 6.1 ? edge : body;
          g.fillRect(x, y, 1, 1);
        }
      }
      [[5, 4], [6, 4], [7, 4], [4, 5], [5, 5], [6, 5], [4, 6], [5, 6]].forEach(([x, y]) => {
        g.fillStyle = hi; g.fillRect(x, y, 1, 1);
      });
      glyph.forEach(([x, y]) => {
        g.fillStyle = edge; g.fillRect(x, y, 1, 1);
      });
      return c;
    },
    texOf(color) {
      if (!color || !/^#[0-9a-f]{6}$/i.test(color)) return this.tex;
      if (!this.cache.has(color)) this.cache.set(color, this.makeTex(color));
      return this.cache.get(color);
    },
    loadImgs() {
      if (!this.imgs) this.imgs = this.coinSrc().map(src => { const im = new Image(); im.src = src; return im; });
      return this.imgs;
    },
    burst(color) {
      const cv = this.cv;
      cv.width = innerWidth;
      cv.height = innerHeight;
      this.loadImgs();
      const floor = cv.height - 8;
      for (let i = 0; i < 42; i++) {
        const img = this.imgs[i % this.imgs.length];
        this.parts.push({
          x: rand(cv.width * 0.15, cv.width * 0.85),
          y: rand(-cv.height * 0.35, -30),
          vx: rand(-4.2, 4.2), vy: rand(-1, 3.5),
          s: rand(22, 44),
          r: rand(-0.4, 0.4), vr: rand(-0.08, 0.08),
          ph: rand(0, 6.3), vph: rand(0.09, 0.2) * (Math.random() < 0.5 ? -1 : 1),
          img, bounces: 0, life: 0, alpha: 1
        });
      }
      if (!this.raf) this.loop();
    },
    loop() {
      const cv = this.cv, ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.imageSmoothingEnabled = false;
      const floor = cv.height - 8;
      this.parts = this.parts.filter(p => p.life < 900 && p.alpha > 0.02);
      for (const p of this.parts) {
        p.vy += 0.45; p.vx *= 0.992;
        p.x += p.vx; p.y += p.vy; p.r += p.vr; p.ph += p.vph; p.life++;
        const bottom = p.y + p.s / 2;
        if (bottom >= floor && p.vy > 0) {
          p.y = floor - p.s / 2;
          p.bounces++;
          p.vy = -Math.abs(p.vy) * (p.bounces <= 1 ? 0.72 : p.bounces === 2 ? 0.55 : 0.38);
          p.vx *= 0.82;
          p.vr *= 0.9;
          if (Math.abs(p.vy) < 1.1) p.vy = -rand(1.4, 2.6);
        }
        if (p.x < p.s / 2) { p.x = p.s / 2; p.vx = Math.abs(p.vx) * 0.8; }
        if (p.x > cv.width - p.s / 2) { p.x = cv.width - p.s / 2; p.vx = -Math.abs(p.vx) * 0.8; }
        if (p.life > 640) p.alpha -= 0.03;
        const flip = Math.abs(Math.cos(p.ph));
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        if (p.img && p.img.complete && p.img.naturalWidth) {
          ctx.scale(Math.max(0.12, flip), 1);
          ctx.drawImage(p.img, -p.s / 2, -p.s / 2, p.s, p.s);
        } else {
          ctx.scale(Math.max(0.12, flip), 1);
          ctx.drawImage(this.tex || (this.tex = this.makeTex('#f7cd45')), -p.s / 2, -p.s / 2, p.s, p.s);
        }
        ctx.restore();
      }
      if (this.parts.length) this.raf = requestAnimationFrame(() => this.loop());
      else { this.raf = 0; ctx.clearRect(0, 0, cv.width, cv.height); }
    }
  };

  /* ============ Ảnh món ============ */
  // Ưu tiên: item.image -> images/<id>.jpg -> emoji
  function imgHTML(item) {
    const src = item.image || `images/${item.id}.jpg`;
    return `<span class="emoji-fallback">${esc(item.emoji || '🍽️')}</span>` +
           `<img src="${esc(src)}" alt="${esc(item.name)}" onerror="this.remove()">`;
  }

  /* ============ CÁC CHẾ ĐỘ RANDOM ============
     Muốn thêm kiểu random mới: thêm 1 object vào MODES.
       label, icon, cta : chữ hiển thị
       mount(stage, api): vẽ giao diện ban đầu vào khung stage
       run(api)         : chạy hiệu ứng, trả về món được chọn
                          (hoặc null nếu tự gọi api.finish(item) sau)
     api = { pool, stage, finish(item) }
  ================================================ */
  const W = { cv: null, items: [], rot: 0 };
  const crate = { focus: 0 };
  let cardsLocked = true;
  let coinAngle = 0;
  let streak = 0;
  let lastStreakDate = null;
  const inventory = {};

  function laurelSVG() {
    let leaves = '';
    for (const side of [0, 1]) {
      for (let k = 0; k < 7; k++) {
        const t = (k - 3) / 3;
        const ang = (side ? 0 : 180) + t * 58;
        const rad = ang * Math.PI / 180;
        const x = 95 + 56 * Math.cos(rad), y = 70 + 56 * Math.sin(rad);
        const tilt = ang + 90 + (side ? 28 : -28) * (t < 0 ? 1 : 1);
        leaves += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5.5" ry="13" transform="rotate(${tilt.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="url(#gold)" stroke="#7a4a00" stroke-width="1"/>`;
      }
    }
    return `<svg viewBox="0 0 190 140" aria-hidden="true">
      <defs><radialGradient id="gold" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff0a8"/><stop offset=".55" stop-color="#f2b632"/><stop offset="1" stop-color="#b9780f"/></radialGradient></defs>
      ${leaves}
      <circle cx="95" cy="70" r="37" fill="url(#gold)" stroke="#7a4a00" stroke-width="3"/>
      <circle cx="95" cy="70" r="29" fill="none" stroke="#fff0a8" stroke-width="2" opacity=".8"/>
      <text x="95" y="84" text-anchor="middle" font-family="Alfa Slab One, serif" font-size="44" fill="#fffdf0" stroke="#7a4a00" stroke-width="1.5" paint-order="stroke">?</text>
    </svg>`;
  }
  const cardHTML = it =>
    `<div class="ccard" style="--rc:${rcolor(it)}"><div class="cimg">${imgHTML(it)}</div><div class="cname">${esc(it.name)}</div></div>`;
  const mysteryHTML = () => `<div class="ccard mystery">${laurelSVG()}</div>`;

  function layoutCrate() {
    const view = $('#crateView'), track = $('#track');
    if (!view || !track) return;
    const el = track.children[crate.focus];
    if (!el) return;
    track.style.transform = `translateX(${-(el.offsetLeft + el.offsetWidth / 2 - view.clientWidth / 2)}px)`;
  }

  const MODES = {
    /* ---- 1. Mở két: băng chuyền chạy phải sang trái, vạch vàng chỉ món trúng ---- */
    case: {
      label: 'Chọn món', icon: '📦', cta: 'Chọn Món',
      mount(stage, api) {
        stage.innerHTML = `
          <div class="crate"><div class="crate-view" id="crateView"><div class="crate-track" id="track"></div><i class="crate-line"></i></div></div>
          <p class="stage-hint">Bấm nút bên dưới, két sẽ trượt và dừng đúng món số phận chọn.</p>`;
        const seq = [];
        let prev = null;
        for (let i = 0; i < 9; i++) { const it = pickAvoid(api.pool, prev); seq.push(it); prev = it; }
        $('#track').innerHTML = seq.map((it, i) => (i === 4 ? mysteryHTML() : cardHTML(it))).join('');
        PX.scan($('#track'));
        crate.focus = 4;
        layoutCrate();
        requestAnimationFrame(layoutCrate);
      },
      async run({ pool }) {
        const view = $('#crateView'), track = $('#track');
        const N = 60, WI = 46 + Math.floor(secureRandom() * 8);
        const winner = pick(pool);
        const seq = [];
        let prev = null;
        for (let i = 0; i < N; i++) {
          const it = i === WI ? winner : pickAvoid(pool, prev);
          seq.push(it); prev = it;
        }
        track.innerHTML = seq.map(cardHTML).join('');
        PX.scan(track);
        const cs = track.children;
        const cw = cs[0].offsetWidth, first = cs[0].offsetLeft;
        const step = cs.length > 1 ? cs[1].offsetLeft - first : cw;
        const C = view.clientWidth / 2;
        const posOf = i => cs[i].offsetLeft + cw / 2 - C;
        const t0 = posOf(3);
        const t1 = posOf(WI) + rand(-0.36, 0.36) * cw;   // vạch vàng rơi lệch tâm một chút cho thật
        track.style.transform = `translateX(${-t0}px)`;
        crate.focus = WI;
        const dur = 6500, ts = performance.now();
        let lastI = -1;
        Sound.startMusic();
        await new Promise(res => {
          const frame = now => {
            const p = Math.min(1, (now - ts) / dur);
            const t = t0 + (t1 - t0) * (1 - Math.pow(1 - p, 4));
            track.style.transform = `translateX(${-t}px)`;
            const idx = Math.floor((t + C - first) / step);
            if (idx !== lastI) { if (lastI !== -1) Sound.tick(); lastI = idx; }
            p < 1 ? requestAnimationFrame(frame) : res();
          };
          requestAnimationFrame(frame);
        });
        [...cs].forEach((c, i) => c.classList.add(i === WI ? 'win' : 'dim'));
        await sleep(550);
        return winner;
      }
    },

    /* ---- 2. Random nhanh ---- */
    shuffle: {
      label: 'Random nhanh', icon: '🎲', cta: 'RANDOM!',
      mount(stage) {
        stage.innerHTML = `
          <div class="slot" id="slot">
            <div class="slot-emoji">${TABS[state.tab].emoji}</div>
            <div class="slot-name">Sẵn sàng chưa?</div>
          </div>
          <p class="stage-hint">Bấm nút bên dưới để món tự nhảy ra.</p>`;
      },
      async run({ pool }) {
        const slot = $('#slot'), emoji = $('.slot-emoji', slot), name = $('.slot-name', slot);
        const winner = pick(pool);
        slot.classList.add('spinning');
        Sound.startMusic();
        let delay = 55, last = null;
        while (delay < 380) {
          const it = pickAvoid(pool, last);
          last = it;
          PX.set(emoji, it.emoji || '🍽️');
          name.textContent = it.name;
          Sound.tick();
          await sleep(delay);
          delay *= 1.1;
        }
        slot.classList.remove('spinning');
        PX.set(emoji, winner.emoji || '🍽️');
        name.textContent = winner.name;
        return winner;
      }
    },

    /* ---- 3. Vòng quay ---- */
    wheel: {
      label: 'Vòng quay', icon: '🎡', cta: 'QUAY!',
      mount(stage, api) {
        stage.innerHTML = `
          <div class="wheel-wrap"><i class="wheel-pointer"></i><canvas id="wheel" width="600" height="600"></canvas></div>
          <p class="stage-hint">${api.pool.length > 10 ? 'Vòng quay lấy ngẫu nhiên 10 món trong danh sách.' : 'Bấm nút để quay.'}</p>`;
        W.cv = $('#wheel', stage);
        W.items = sample(api.pool, 10);
        W.rot = 0;
        drawWheel();
      },
      async run({ pool }) {
        if (pool.length > 10) { W.items = sample(pool, 10); drawWheel(); }
        const n = W.items.length, seg = Math.PI * 2 / n, full = Math.PI * 2;
        const idx = Math.floor(secureRandom() * n);
        const target = -Math.PI / 2 - (idx + 0.5) * seg + rand(-0.35, 0.35) * seg;
        const start = W.rot;
        const end = target + full * Math.ceil((start + full * 6 - target) / full);
        const dur = 5200, t0 = performance.now();
        let lastI = -1;
        Sound.startMusic();
        await new Promise(res => {
          const frame = now => {
            const p = Math.min(1, (now - t0) / dur);
            W.rot = start + (end - start) * (1 - Math.pow(1 - p, 3.2));
            drawWheel();
            const pa = (((-Math.PI / 2 - W.rot) % full) + full) % full;
            const i = Math.floor(pa / seg);
            if (i !== lastI) { if (lastI !== -1) Sound.tick(); lastI = i; }
            p < 1 ? requestAnimationFrame(frame) : res();
          };
          requestAnimationFrame(frame);
        });
        W.rot = ((end % full) + full) % full;
        drawWheel();
        return W.items[idx];
      }
    },

    /* ---- 4. Bốc thẻ ---- */
    cards: {
      label: 'Bốc thẻ', icon: '🃏', cta: 'XÀO BÀI',
      mount(stage, api) { deal(stage, api, false); },
      async run(a) {
        Sound.startMusic();
        await shuffleCards($('.cards', a.stage));
        Sound.stopMusic();
        deal(a.stage, a, true);
        return null; // người chơi tự chọn lá bài
      }
    },

    /* ---- 5. Tung đồng xu (A hay B?) ---- */
    coin: {
      label: 'Tung xu', icon: '🪙', cta: 'TUNG XU!',
      mount(stage) {
        coinAngle = 0;
        stage.innerHTML = `
          <div class="coin-arena">
            <div class="side" id="sideA"><div class="side-tag">Mặt sấp</div><div class="side-emoji">❔</div><div class="side-name">???</div></div>
            <div class="coin-scene" id="coinScene"><div class="coin" id="coin"><div class="face front">❔</div><div class="face back">❔</div></div></div>
            <div class="side" id="sideB"><div class="side-tag">Mặt ngửa</div><div class="side-emoji">❔</div><div class="side-name">???</div></div>
          </div>
          <p class="stage-hint">Hai món đối đầu, đồng xu phân xử.</p>`;
      },
      async run({ pool }) {
        if (pool.length < 2) return pool[0];
        const [a, b] = sample(pool, 2);
        const sideA = $('#sideA'), sideB = $('#sideB'), coin = $('#coin'), scene = $('#coinScene');
        const fill = (el, it) => {
          el.classList.remove('win', 'lose');
          PX.set($('.side-emoji', el), it.emoji || '🍽️');
          $('.side-name', el).textContent = it.name;
        };
        fill(sideA, a); fill(sideB, b);
        PX.set($('.front', coin), a.emoji || '🍽️');
        PX.set($('.back', coin), b.emoji || '🍽️');
        const winA = secureRandom() < 0.5;
        const cur = ((coinAngle % 360) + 360) % 360;
        const need = winA ? (360 - cur) % 360 : (540 - cur) % 360;
        coinAngle += 360 * 5 + need;
        scene.classList.remove('tossing'); void scene.offsetWidth; scene.classList.add('tossing');
        Sound.startMusic();
        coin.style.transform = `rotateY(${coinAngle}deg)`;

        $(".coin-overlay")?.remove();
        const ov = document.createElement('div');
        ov.className = 'coin-overlay single';
        ov.innerHTML = `
          <canvas class="coin-ov-canvas" id="ovCanvas"></canvas>
          <p class="coin-verdict" id="ovVerdict"></p>`;
        document.body.appendChild(ov);
        const winner = winA ? a : b;
        $('#ovVerdict', ov).textContent = `${winA ? 'M\u1EAFT S\u1EACP' : 'M\u1EB6T NG\u1EECA'} · ${winner.emoji || 'F37D️'} ${winner.name}`;
        const cv = $('#ovCanvas', ov);
        const cx = cv.getContext('2d');
        const resize = () => { cv.width = ov.clientWidth || innerWidth; cv.height = ov.clientHeight || innerHeight; };
        resize();
        const imgS = new Image(); imgS.src = 'images/matup_2d.png';
        const imgN = new Image(); imgN.src = 'images/matngua_2d.png';
        await Promise.all([imgS.decode().catch(() => {}), imgN.decode().catch(() => {})]);
        try {
          void ov.offsetWidth;
          ov.classList.add('show');
          await sleep(300);
          Sound.tick();
          const S = Math.min(cv.width, cv.height) > 520 ? 210 : 170;
          const floor = cv.height * 0.56;
          const coinAnim = {
            x: cv.width / 2 + rand(-30, 30), y: -S,
            vx: rand(-1.5, 1.5), vy: rand(9, 12),
            rot: rand(-0.25, 0.25), vr: rand(-0.09, 0.09),
            ph: rand(0, 6.3), vph: rand(0.85, 1.05),
            bounces: 0
          };
          const targetPh = (winA ? 0 : Math.PI) + Math.PI * 2 * 3;
          const T_END = 950;
          const t0 = performance.now();
          let landed = false;
          await new Promise(res => {
            const frame = now => {
              const el = now - t0;
              cx.clearRect(0, 0, cv.width, cv.height);
              cx.imageSmoothingEnabled = false;
              coinAnim.vy += 0.95;
              coinAnim.vx *= 0.992;
              coinAnim.x += coinAnim.vx;
              coinAnim.y += coinAnim.vy;
              coinAnim.rot += coinAnim.vr;
              coinAnim.ph += coinAnim.vph;
              {
                const want = floor - S / 2;
                if (coinAnim.y >= want && coinAnim.vy > 0) {
                  coinAnim.y = want;
                  coinAnim.bounces++;
                  coinAnim.vy = -Math.abs(coinAnim.vy) * (coinAnim.bounces === 1 ? 0.68 : coinAnim.bounces === 2 ? 0.52 : 0.36);
                  coinAnim.vx *= 0.8;
                  coinAnim.vr *= 0.85;
                  if (Math.abs(coinAnim.vy) < 1.4) coinAnim.vy = -rand(2.2, 3.4);
                  Sound.tick();
                  if (coinAnim.bounces === 2 && !landed) {
                    landed = true;
                    ov.classList.add('landed');
                    (winA ? sideA : sideB).classList.add('win');
                    (winA ? sideB : sideA).classList.add('lose');
                  }
                }
              }
              if (coinAnim.x < S / 2) { coinAnim.x = S / 2; coinAnim.vx = Math.abs(coinAnim.vx) * 0.8; }
              if (coinAnim.x > cv.width - S / 2) { coinAnim.x = cv.width - S / 2; coinAnim.vx = -Math.abs(coinAnim.vx) * 0.8; }
              if (landed) coinAnim.ph += (targetPh - coinAnim.ph) * 0.12;
              if (el >= T_END) {
                coinAnim.ph = targetPh;
                cx.save();
                cx.globalAlpha = 0.35;
                cx.fillStyle = '#000';
                cx.beginPath();
                cx.ellipse(coinAnim.x, floor + S / 2 + 8, S * 0.42, 12, 0, 0, Math.PI * 2);
                cx.fill();
                cx.restore();
                const flip = Math.abs(Math.cos(coinAnim.ph));
                cx.save();
                cx.translate(coinAnim.x, coinAnim.y + S / 2);
                cx.rotate(coinAnim.rot);
                cx.scale(Math.max(0.12, flip), 1);
                const im = winA ? imgS : imgN;
                if (im.complete && im.naturalWidth) cx.drawImage(im, -S / 2, -S / 2, S, S);
                cx.restore();
                res(); return;
              }
              cx.save();
              cx.globalAlpha = 0.3;
              cx.fillStyle = '#000';
              const shScale = Math.max(0.2, Math.min(1, (coinAnim.y + S) / (floor + S)));
              cx.beginPath();
              cx.ellipse(coinAnim.x, floor + S / 2 + 8, S * 0.42 * shScale, 12 * shScale, 0, 0, Math.PI * 2);
              cx.fill();
              cx.restore();
              const flip = Math.abs(Math.cos(coinAnim.ph));
              cx.save();
              cx.translate(coinAnim.x, coinAnim.y + S / 2);
              cx.rotate(coinAnim.rot);
              cx.scale(Math.max(0.12, flip), 1);
              const both = !landed;
              const im = both ? (Math.cos(coinAnim.ph) >= 0 ? imgS : imgN) : (winA ? imgS : imgN);
              if (im.complete && im.naturalWidth) cx.drawImage(im, -S / 2, -S / 2, S, S);
              cx.restore();
              requestAnimationFrame(frame);
            };
            requestAnimationFrame(frame);
          });
          await sleep(450);
          ov.classList.remove('show');
          await sleep(250);
        } finally {
          ov.remove();
        }
        scene.classList.remove('tossing');
        await sleep(250);
        return winA ? a : b;
      }
    }
  };

  /* ---- Vẽ vòng quay (màu theo độ hiếm) ---- */
  function drawWheel() {
    const { cv, items, rot } = W;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const S = cv.width, C = S / 2, R = C - 12;
    const n = items.length, seg = Math.PI * 2 / n;
    ctx.clearRect(0, 0, S, S);
    items.forEach((it, i) => {
      const a0 = rot + i * seg;
      ctx.beginPath();
      ctx.moveTo(C, C);
      ctx.arc(C, C, R, a0, a0 + seg);
      ctx.closePath();
      ctx.fillStyle = rcolor(it);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.stroke();
      const hubClear = R * 0.18 + 34;
      const maxW = Math.max(60, R - 24 - hubClear);
      ctx.save();
      ctx.translate(C, C);
      ctx.rotate(a0 + seg / 2);
      ctx.beginPath();
      ctx.arc(0, 0, R - 2, 0, Math.PI * 2);
      ctx.arc(0, 0, hubClear - 6, 0, Math.PI * 2, true);
      ctx.clip();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#14100d';
      let label = `${shorten(it.name, n > 7 ? 16 : 22)}${it.emoji ? ' ' + it.emoji : ''}`;
      let fs = 25;
      ctx.font = `700 ${fs}px "Be Vietnam Pro", sans-serif`;
      while (fs > 15 && ctx.measureText(label).width > maxW) {
        fs -= 1;
        ctx.font = `700 ${fs}px "Be Vietnam Pro", sans-serif`;
      }
      if (ctx.measureText(label).width > maxW) {
        let cut = label.length;
        while (cut > 5 && ctx.measureText(label.slice(0, cut) + '…').width > maxW) cut -= 1;
        label = label.slice(0, cut).trimEnd() + '…';
      }
      ctx.fillText(label, R - 22, 0);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(C, C, R, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(255,255,255,.95)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(C, C, 36, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#f0a832';
    ctx.stroke();
    ctx.font = '34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(TABS[state.tab].emoji, C, C + 2);
  }

  /* ---- Xáo 3 lá kiểu 3-card monte: tráo từng cặp theo đường vòng ---- */
  async function shuffleCards(wrap) {
    if (!wrap) return;
    const cards = $$('.pcard', wrap);
    if (cards.length < 2) { await sleep(700); return; }
    wrap.classList.add('shuffling');
    cards.forEach(c => { try { c.getAnimations().forEach(a => a.cancel()); } catch (e) {} c.style.transform = ''; c.style.zIndex = ''; });
    const homeX = new Map(cards.map(c => [c, c.offsetLeft]));
    const slotX = cards.map(c => c.offsetLeft);
    const pos = new Map(cards.map((c, i) => [c, i]));
    const anim = (c, kf, opt) => c.animate(kf, opt).finished.catch(() => {});
    const n = cards.length;
    const swaps = 8, dur = 260;
    for (let r = 0; r < swaps; r++) {
      let a = Math.floor(secureRandom() * n), b = Math.floor(secureRandom() * n);
      if (a === b) b = (b + 1) % n;
      const ca = cards.find(c => pos.get(c) === a);
      const cb = cards.find(c => pos.get(c) === b);
      if (!ca || !cb) continue;
      const over = secureRandom() < 0.5 ? ca : cb;
      const jobs = [];
      [[ca, a, b], [cb, b, a]].forEach(([c, from, to]) => {
        const fromX = slotX[from] - homeX.get(c);
        const toX = slotX[to] - homeX.get(c);
        const dx = toX - fromX;
        const isOver = c === over;
        c.style.zIndex = isOver ? '40' : '30';
        const lift = isOver ? -78 : 26;
        const rot = (dx > 0 ? 1 : -1) * (isOver ? 14 : 10);
        jobs.push(anim(c, [
          { transform: `translate(${fromX}px,0) rotate(0deg) scale(1)` },
          { transform: `translate(${fromX + dx * 0.5}px,${lift}px) rotate(${rot}deg) scale(${isOver ? 1.06 : 0.94})`, offset: 0.5 },
          { transform: `translate(${toX}px,0) rotate(0deg) scale(1)` }
        ], { duration: dur, easing: 'cubic-bezier(.4,.7,.3,1)', fill: 'forwards' }));
      });
      cards.forEach(c => {
        if (c === ca || c === cb) return;
        const bx = slotX[pos.get(c)] - homeX.get(c);
        jobs.push(anim(c, [
          { transform: `translate(${bx}px,0) scale(1)` },
          { transform: `translate(${bx + rand(-8, 8)}px,-12px) scale(.97)`, offset: 0.5 },
          { transform: `translate(${bx}px,0) scale(1)` }
        ], { duration: dur, easing: 'ease-in-out', fill: 'forwards' }));
      });
      Sound.tick();
      await Promise.all(jobs);
      pos.set(ca, b); pos.set(cb, a);
      cards.forEach(c => { c.style.transform = `translate(${slotX[pos.get(c)] - homeX.get(c)}px,0)`; c.style.zIndex = ''; });
      ca.style.zIndex = '12'; cb.style.zIndex = '12';
      await sleep(40);
    }
    Sound.tick();
    await Promise.all(cards.map(c => {
      const bx = slotX[pos.get(c)] - homeX.get(c);
      return anim(c, [
        { transform: `translate(${bx}px,0) rotate(0deg) scale(1)` },
        { transform: 'translate(0,0) rotate(0deg) scale(1)' }
      ], { duration: 320, easing: 'cubic-bezier(.2,1.2,.35,1)', fill: 'forwards' });
    }));
    $$('.pcard', wrap).forEach(c => {
      try { c.getAnimations().forEach(an => an.cancel()); } catch (e) {}
      c.style.transition = ''; c.style.transform = ''; c.style.zIndex = '';
    });
    wrap.classList.remove('shuffling');
  };

  /* ---- Chia bài ---- */
  function deal(stage, a, resetHint) {
    const items = sample(a.pool, 3);
    cardsLocked = false;
    stage.innerHTML = `
      <div class="cards">
        ${items.map((it, i) => `
          <button class="pcard" data-i="${i}" style="--rc:${rcolor(it)}" aria-label="Lá bài ${i + 1}">
            <div class="pcard-inner">
              <div class="face front">?</div>
              <div class="face back"><span class="e">${esc(it.emoji || '🍽️')}</span><span class="n">${esc(it.name)}</span></div>
            </div>
          </button>`).join('')}
      </div>
      <p class="stage-hint">Chọn 1 lá bài bất kỳ. ${resetHint ? 'Đã xào xong, mời bốc!' : ''}</p>`;
    PX.scan(stage);
    $$('.pcard', stage).forEach(card => {
      card.addEventListener('click', () => {
        if (cardsLocked || state.busy) return;
        cardsLocked = true;
        Sound.init();
        Sound.flip();
        if (state.lastPick) state.rerolls++;
        const chosen = items[Number(card.dataset.i)];
        card.classList.add('flipped');
        setTimeout(() => {
          $$('.pcard', stage).forEach(c => { if (c !== card) c.classList.add('flipped', 'dim'); });
        }, 550);
        setTimeout(() => showResult(chosen), 650);
      });
    });
  }

  /* ============ Kết quả ============ */
  function showResult(item) {
    state.lastPick = item;
    if (!item.date) item.date = todayKey();
    const tab = TABS[state.tab];
    const rk = rarityOf(item), r = RARITY[rk];
    const joke = state.rerolls > 0
      ? REROLL_JOKES[Math.min(state.rerolls, REROLL_JOKES.length) - 1]
      : pick(tab.jokes);

    const box = $('#result');
    box.style.setProperty('--rc', r.color);
    $('#rImg').innerHTML = imgHTML(item);
    PX.scan($('#rImg'));
    $('#rJoke').textContent = joke;
    $('#rTitle').textContent = item.name;
    $('#rDesc').textContent = item.desc || '';
    $('#rMeta').innerHTML =
      `<span class="tag rare">${r.label}</span>` +
      (item.price ? `<span class="tag price">${fmtPrice(item.price)}</span>` : '') +
      item.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('');

    const order = $('#rOrder');
    const hasLink = Boolean(item.link);
    order.href = hasLink ? item.link : `https://www.google.com/maps/search/${encodeURIComponent(item.name)}`;
    order.textContent = hasLink ? '🛵 Đặt ngay' : '📍 Tìm quán gần bạn';

    box.hidden = false;
    box.classList.remove('pop');
    void box.offsetWidth;
    box.classList.add('pop');
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    state.lastPickTab = state.tab;
    dexAdd(state.tab, item);
    renderDex();
    updateAteBtn();

    history.unshift({ id: item.id, name: item.name, emoji: item.emoji, tab: state.tab, date: item.date });
    history = history.slice(0, 10);
    store.set('history', history);
    renderHistory();

    computeStreakFromHistory();
    renderStreak();
    renderGarden();
    const m = STREAK_MILESTONES.find(d => streak === d);
    if (m) {
      const reward = GARDEN_ITEMS[m % GARDEN_ITEMS.length];
      addInventoryItem(reward.id);
      showStreakMilestone(m, reward.id);
    }
    const drop = rollGardenItem();
    if (drop) {
      addInventoryItem(drop.id);
      const dmsg = document.createElement('div');
      dmsg.className = 'drop-toast';
      dmsg.innerHTML = `<div class="drop-emoji">${drop.emoji}</div>
        <div class="drop-msg">🎁 Rơi vật phẩm: ${drop.name}</div>`;
      document.body.appendChild(dmsg);
      setTimeout(() => dmsg.remove(), 2500);
    }

    openCount++;
    store.set('count', openCount);
    $('#openCount').textContent = openCount.toLocaleString('vi-VN');

    box.dataset.r = rk;
    const gain = 10 + RKEYS.indexOf(rk) * 15;
    const oldL = levelOf(xp);
    xp += gain;
    store.set('xp', xp);
    renderHud();
    popScore('+' + gain, r.color);
    flashScreen(r.color);
    shakeScreen();

    CoinRain.burst(r.color);
    const newL = levelOf(xp);
    if (newL > oldL) {
      CoinRain.burst('#f0a832');
      Sound.win(4);
      toast(`🎉 LÊN CẤP ${newL}! Mở két tiếp để sưu tầm thực đơn nhé.`);
    } else {
      Sound.win(RKEYS.indexOf(rk));
      if (ACHIEVES.includes(openCount)) toast(`🏅 Thành tựu mới: Mở két ${openCount} lần!`);
    }
  }

  function resetResult() {
    state.rerolls = 0;
    state.lastPick = null;
    $('#result').hidden = true;
  }

  /* ============ Chạy chế độ ============ */
  const api = () => ({ pool: getPool(), stage: $('#stage'), finish: showResult });

  async function runMode() {
    if (state.busy) return;
    const a = api();
    if (!a.pool.length) return;
    Sound.init();
    if (state.lastPick) state.rerolls++;
    setBusy(true);
    try {
      const item = await MODES[state.mode].run(a);
      if (item && !state.lastPick) showResult(item);
    } finally {
      Sound.stopMusic();
      setBusy(false);
    }
  }

  function setBusy(b) {
    state.busy = b;
    document.body.classList.toggle('is-busy', b);
    $('#cta').classList.toggle('busy', b);
    $('#cta').disabled = b || !getPool().length;
    $$('.tab, .mode, #tagSel, #budgetSel, #antiChk, #planGen, #planAteAll').forEach(el => { el.disabled = b; });
  }

  function mountMode() {
    Sound.stopMusic();
    const stage = $('#stage');
    const a = api();
    const m = MODES[state.mode];
    $('#cta').innerHTML = `<i class="pxi">${m.icon}</i> ${m.cta}`;
    $('#cta').disabled = !a.pool.length;
    if (!a.pool.length) {
      stage.innerHTML = `<div class="empty"><b>Két đang trống</b><p>Hãy đổi nhóm, nới ngân sách hoặc bật lại món trong mục "Trong kho có gì?" bên dưới.</p></div>`;
      return;
    }
    m.mount(stage, a);
    PX.scan(stage);
  }

  /* ============ Giao diện ============ */
  function renderModes() {
    $('#modes').innerHTML = Object.entries(MODES).map(([key, m]) =>
      `<button class="mode" data-mode="${key}" aria-pressed="${key === state.mode}"><i class="pxi">${m.icon}</i> ${m.label}</button>`
    ).join('');
    PX.scan($('#modes'));
  }

  function renderTagSel() {
    const tags = [...new Set(getAll().flatMap(i => i.tags))];
    if (state.tag !== 'all' && !tags.includes(state.tag)) state.tag = 'all';
    $('#tagSel').innerHTML = `<option value="all">Tất cả</option>` +
      tags.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    $('#tagSel').value = state.tag;
  }

  function renderPoolInfo() {
    const n = getPool().length;
    const anti = antiR && eatenSet().size ? ` · chống lặp ${eatenSet().size} món` : '';
    $('#poolInfo').innerHTML = n ? `Trong két có <b>${n}</b> món${anti}` : 'Két trống, chưa có món nào hợp bộ lọc';
  }

  function renderVault() {
    const grid = $('#vaultGrid');
    if (!getAll().length) { grid.innerHTML = '<p class="vault-note">Chưa có món nào. Bấm "＋ Thêm món" để bắt đầu.</p>'; return; }
    grid.innerHTML = getAll().map(it => {
      const rk = rarityOf(it);
      return `
      <article class="vcard ${it.off ? 'is-off' : ''}" style="--rc:${RARITY[rk].color}" data-id="${esc(it.id)}">
        <div class="vthumb">${imgHTML(it)}</div>
        <div class="vinfo">
          <h4>${esc(it.name)}</h4>
          <div class="vmeta"><span class="rbadge">${RARITY[rk].label}</span><span class="vprice">${fmtPrice(it.price)}</span></div>
          <p>${esc(it.tags.join(', '))}${it.off ? ' · đang ẩn' : ''}</p>
        </div>
        <div class="vact">
          <button data-act="toggle" title="${it.off ? 'Hiện lại trong két' : 'Ẩn khỏi két'}" aria-label="${it.off ? 'Hiện lại' : 'Ẩn'} ${esc(it.name)}">${it.off ? '🙈' : '👁️'}</button>
          <button data-act="edit" title="Sửa" aria-label="Sửa ${esc(it.name)}">✏️</button>
          <button data-act="del" title="Xoá" aria-label="Xoá ${esc(it.name)}">🗑️</button>
        </div>
      </article>`;
    }).join('');
    PX.scan(grid);
  }

  function renderHistory() {
    const box = $('#history');
    if (!history.length) { box.innerHTML = '<p class="history-empty">Chưa có gì. Mở két thôi!</p>'; return; }
    box.innerHTML = history.map(h =>
      `<span class="chip"><i class="pxi">${esc(h.emoji || '🍽️')}</i> ${esc(h.name)}</span>`
    ).join('');
    PX.scan(box);
  }

  function updateSaveUI() {
    const canPick = typeof window.showSaveFilePicker === 'function';
    $('#saveBtn').textContent = dirty ? '💾 Lưu vào data.js ●' : '💾 Lưu vào data.js';
    $('#discardBtn').hidden = !dirty;
    const note = $('#vaultNote');
    note.classList.toggle('dirty', dirty);
    note.textContent = dirty
      ? 'Có thay đổi chưa lưu. Bấm Lưu rồi chọn đúng file data.js trong thư mục dự án để ghi đè.'
      : (canPick
        ? 'Mọi thay đổi đã khớp với data.js. Sửa xong nhớ bấm Lưu.'
        : 'Trình duyệt này không ghi trực tiếp được vào file, nút Lưu sẽ tải data.js về để bạn chép đè vào thư mục dự án.');
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => { t.hidden = true; }, 3800);
  }

  const LEVEL_XP = 150;
  const ACHIEVES = [10, 25, 50, 100, 200, 500];
  let xp = store.get('xp', store.get('count', 0) * 10);
  const levelOf = x => Math.floor(x / LEVEL_XP) + 1;

  function renderHud() {
    $('#lvlNum').textContent = levelOf(xp);
    $('#xpFill').style.width = (xp % LEVEL_XP) / LEVEL_XP * 100 + '%';
  }

  function popScore(text, color) {
    const s = document.createElement('div');
    s.className = 'score-pop';
    s.textContent = text;
    s.style.color = color;
    document.body.appendChild(s);
    s.addEventListener('animationend', () => s.remove(), { once: true });
  }

  function flashScreen(color) {
    const f = $('#flash');
    f.style.setProperty('--fc', color);
    f.classList.remove('on');
    void f.offsetWidth;
    f.classList.add('on');
  }

  function shakeScreen() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const a = document.querySelector('.app');
    a.classList.remove('shaking');
    void a.offsetWidth;
    a.classList.add('shaking');
  }

  function refreshPool() {
    renderTagSel();
    renderPoolInfo();
    renderVault();
    renderAte();
    renderDex();
    renderPlan();
    mountMode();
  }

  function applyTab(tab) {
    state.tab = tab;
    state.tag = 'all';
    const t = TABS[tab];
    document.body.dataset.tab = tab;
    document.title = t.title;
    $('#title').textContent = t.title;
    $('#subtitle').textContent = t.subtitle;
    PX.set($('#brandEmoji'), t.emoji);
    $$('.tab').forEach(b => b.classList.toggle('is-active', b.dataset.tab === tab));
    resetResult();
    refreshPool();
  }

  function applyMode(mode) {
    state.mode = mode;
    $$('.mode').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    mountMode();
  }

  /* ============ F1: Giao diện "đã ăn" ============ */
  function renderAte() {
    const line = $('#ateLine');
    const today = ate[todayKey()] || [];
    const n7 = eatenSet().size;
    if (!antiR && !today.length) { line.hidden = true; return; }
    line.hidden = false;
    const chips = today.map(k => {
      const [tab, id] = k.split(':');
      const it = (DATA[tab] || []).find(x => x.id === id);
      return `<button class="ate-chip" data-k="${esc(k)}" title="Bỏ khỏi sổ hôm nay"><i class="pxi">${esc(it ? it.emoji : '🍽️')}</i> ${esc(it ? it.name : id)} <b>✕</b></button>`;
    }).join('');
    line.innerHTML = `<b>${antiR ? '🚫' : '📖'}</b> 7 ngày qua đã ăn <b>${n7}</b> món` +
      (today.length ? ` · Hôm nay: ${chips}` : ' · Hôm nay chưa ghi gì');
    PX.scan(line);
  }

  function updateAteBtn() {
    const b = $('#rAte'), it = state.lastPick;
    if (!it || $('#result').hidden) return;
    const done = (ate[todayKey()] || []).includes(dexKey(state.lastPickTab || state.tab, it.id));
    b.disabled = done;
    b.classList.toggle('is-done', done);
    b.textContent = done ? '✅ Đã ghi sổ hôm nay' : '✅ Ăn rồi, ghi sổ';
  }

  /* ============ F2: Sổ sưu tầm ============ */
  function renderDex() {
    const grid = $('#dexGrid');
    let total = 0, found = 0, best = null;
    const cards = ['food', 'drink'].flatMap(tab => DATA[tab].map(it => {
      total++;
      const rec = dex[dexKey(tab, it.id)];
      if (!rec) {
        return `<article class="dex-card locked"><span class="dex-q">?</span><h4>???</h4><p>${tab === 'food' ? 'Đồ ăn' : 'Đồ uống'}</p></article>`;
      }
      found++;
      if (!best || rec.n > best.rec.n) best = { it, rec };
      const r = RARITY[rarityOfTab(tab, it)];
      return `<article class="dex-card" style="--rc:${r.color}" title="Ăn ${rec.n} lần">
        <span class="dex-n">×${rec.n}</span>
        <div class="dex-img"><i class="pxi">${esc(it.emoji || '🍽️')}</i></div>
        <h4>${esc(it.name)}</h4>
        <p><span class="rbadge">${r.label}</span></p>
      </article>`;
    }));
    grid.innerHTML = cards.join('');
    $('#dexNum').textContent = `${found}/${total}`;
    $('#dexFill').style.width = (total ? found / total * 100 : 0) + '%';
    $('#dexNote').textContent = best
      ? `Món ruột: ${best.it.name} — ${best.rec.n} lần. Mở két thêm để filled hết sổ!`
      : 'Chưa ghi nhận món nào. Mở két một cái là sổ tự ghi.';
    PX.scan(grid);
  }

  /* ============ F3: Thực đơn 7 ngày ============ */
  const DAYNAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const findItem = (tab, id) => DATA[tab].find(x => x.id === id) || null;

  function pickForWeek(tab, usedIds) {
    const list = poolFor(tab, antiR);
    if (!list.length) return null;
    const fresh = list.filter(i => !usedIds.has(i.id));
    return pick(fresh.length ? fresh : list);
  }

  function genPlan() {
    const days = [];
    const uf = new Set(), ud = new Set();
    for (let i = 0; i < 7; i++) {
      const f = pickForWeek('food', uf); if (f) uf.add(f.id);
      const d = pickForWeek('drink', ud); if (d) ud.add(d.id);
      days.push({ f: f ? f.id : null, d: d ? d.id : null });
    }
    plan = { week: weekMondayKey(), days };
    store.set('plan', plan);
  }

  function rerollDay(i) {
    if (!plan || !plan.days[i]) return;
    const uf = new Set(), ud = new Set();
    plan.days.forEach((d, j) => { if (j !== i) { uf.add(d.f); ud.add(d.d); } });
    const f = pickForWeek('food', uf), d = pickForWeek('drink', ud);
    plan.days[i] = { f: f ? f.id : null, d: d ? d.id : null };
    store.set('plan', plan);
  }

  function planRow(tab, id) {
    const it = findItem(tab, id);
    if (!it) return '';
    const r = RARITY[rarityOfTab(tab, it)];
    return `<div class="pd-row" style="--rc:${r.color}"><i class="pxi">${esc(it.emoji || '🍽️')}</i><span>${esc(it.name)}</span><em>${fmtPrice(it.price)}</em></div>`;
  }

  function renderPlan() {
    const grid = $('#planGrid'), note = $('#planNote');
    if (!plan || !Array.isArray(plan.days)) {
      grid.innerHTML = '';
      note.textContent = 'Bấm "Lập thực đơn tuần" để 7 ngày tới khỏi phải nghĩ ngợi.';
      return;
    }
    const stale = plan.week !== weekMondayKey();
    note.textContent = stale
      ? 'Tuần trước rồi — bấm "Lập thực đơn tuần" để làm mới.'
      : 'Tuần này của bạn. Bấm ↻ để đổi riêng 1 ngày.';
    let total = 0;
    grid.innerHTML = plan.days.map((d, i) => {
      const f = findItem('food', d.f), dr = findItem('drink', d.d);
      total += (f ? f.price : 0) + (dr ? dr.price : 0);
      return `<article class="plan-day">
        <div class="pd-head"><b>${DAYNAMES[i]}</b><button class="pd-reroll" data-i="${i}" title="Đổi món ngày ${DAYNAMES[i]}" aria-label="Đổi món ngày ${DAYNAMES[i]}">↻</button></div>
        ${planRow('food', d.f)}
        ${planRow('drink', d.d)}
      </article>`;
    }).join('') + `<article class="plan-day plan-total"><b>TUẦN NÀY ≈</b><strong>${fmtPrice(total)}</strong></article>`;
    PX.scan(grid);
  }

  /* ============ Thêm / sửa / xoá / lưu ============ */
  function markDirty() {
    dirty = true;
    store.set('draft', DATA);
    updateSaveUI();
  }

  const dlg = $('#editDialog'), form = $('#editForm');
  const rDlg = $('#rerollConfirmDialog');
  const rDlgYes = $('#rerollYes');
  const rDlgNo = $('#rerollNo');

  function confirmReroll() {
    return new Promise(resolve => {
      const onYes = () => { cleanup(); resolve(true); };
      const onNo = () => { cleanup(); resolve(false); };
      const cleanup = () => {
        rDlgYes.removeEventListener('click', onYes);
        rDlgNo.removeEventListener('click', onNo);
        rDlg.close();
      };
      rDlgYes.addEventListener('click', onYes);
      rDlgNo.addEventListener('click', onNo);
      rDlg.showModal();
    });
  }

  async function attemptRunMode() {
    if (state.busy) return;
    if (state.lastPick) {
      const ok = await confirmReroll();
      if (ok) {
        markAte(state.lastPickTab || state.tab, state.lastPick.id);
        renderAte();
        renderPoolInfo();
        resetResult();
      }
    }
    runMode();
  }
  const field = n => form.elements.namedItem(n);

  function openEditor(item) {
    form.reset();
    $('#editTitle').textContent = item ? 'Sửa món' : 'Thêm món';
    field('id').value = item ? item.id : '';
    if (item) {
      field('name').value = item.name;
      field('emoji').value = item.emoji;
      field('price').value = item.price || '';
      field('desc').value = item.desc;
      field('tags').value = item.tags.join(', ');
      field('link').value = item.link;
      field('image').value = item.image;
      field('rarity').value = item.rarity;
      field('show').checked = !item.off;
    }
    dlg.showModal();
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form);
    const name = String(f.get('name') || '').trim();
    if (!name) return;
    const base = {
      name,
      emoji: String(f.get('emoji') || '').trim() || (state.tab === 'food' ? '🍽️' : '🥤'),
      desc: String(f.get('desc') || '').trim(),
      tags: String(f.get('tags') || '').split(',').map(s => s.trim()).filter(Boolean),
      price: parsePrice(f.get('price')),
      link: String(f.get('link') || '').trim(),
      image: String(f.get('image') || '').trim(),
      rarity: String(f.get('rarity') || ''),
      off: !f.get('show')
    };
    const id = String(f.get('id') || '');
    if (id) {
      const list = DATA[state.tab];
      const idx = list.findIndex(i => i.id === id);
      if (idx > -1) list[idx] = { ...list[idx], ...base };
    } else {
      const used = new Set([...DATA.food, ...DATA.drink].map(i => i.id));
      const root = slug(name);
      let nid = root, n = 2;
      while (used.has(nid)) nid = `${root}-${n++}`;
      DATA[state.tab].push({ id: nid, ...base });
    }
    dlg.close();
    markDirty();
    refreshPool();
    toast(id ? 'Đã sửa món. Nhớ bấm Lưu vào data.js.' : 'Đã thêm món. Nhớ bấm Lưu vào data.js.');
  });
  $('#editCancel').addEventListener('click', () => dlg.close());
  $('#addBtn').addEventListener('click', () => { if (!state.busy) openEditor(null); });

  $('#vaultGrid').addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn || state.busy) return;
    const id = btn.closest('.vcard').dataset.id;
    const item = getAll().find(i => i.id === id);
    if (!item) return;
    if (btn.dataset.act === 'edit') return openEditor(item);
    if (btn.dataset.act === 'toggle') {
      item.off = !item.off;
    } else if (btn.dataset.act === 'del') {
      if (!confirm(`Xoá "${item.name}" khỏi kho?`)) return;
      DATA[state.tab] = getAll().filter(i => i.id !== id);
    }
    markDirty();
    refreshPool();
  });

  async function saveToFile() {
    const text = serialize();
    if (typeof window.showSaveFilePicker === 'function') {
      try {
        if (!fileHandle) {
          fileHandle = await window.showSaveFilePicker({
            suggestedName: 'data.js',
            types: [{ description: 'JavaScript', accept: { 'text/javascript': ['.js'] } }]
          });
        }
        const w = await fileHandle.createWritable();
        await w.write(text);
        await w.close();
        afterSaved(`Đã ghi vào ${fileHandle.name}`);
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;   // người dùng huỷ hộp thoại
        fileHandle = null;                              // lỗi quyền, chuyển sang tải file
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
    a.download = 'data.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    afterSaved('Đã tải data.js về, chép đè vào thư mục dự án nhé.');
  }

  function afterSaved(msg) {
    window.MENU = clone(DATA);
    dirty = false;
    store.del('draft');
    updateSaveUI();
    toast(msg);
  }

  $('#saveBtn').addEventListener('click', saveToFile);
  $('#discardBtn').addEventListener('click', () => {
    if (state.busy || !confirm('Bỏ mọi thay đổi chưa lưu và quay về data.js hiện tại?')) return;
    DATA = normalize(window.MENU);
    dirty = false;
    store.del('draft');
    updateSaveUI();
    resetResult();
    refreshPool();
  });

  /* ============ Sự kiện chung ============ */
  $('#cta').addEventListener('click', attemptRunMode);
  $('#rAgain').addEventListener('click', attemptRunMode);
  $('#rOrder').addEventListener('click', () => { state.rerolls = 0; state.lastPick = null; });

  document.querySelector('.tabs').addEventListener('click', e => {
    const b = e.target.closest('.tab');
    if (b && !state.busy && b.dataset.tab !== state.tab) applyTab(b.dataset.tab);
  });
  $('#modes').addEventListener('click', e => {
    const b = e.target.closest('.mode');
    if (b && !state.busy) applyMode(b.dataset.mode);
  });
  $('#tagSel').addEventListener('change', e => {
    state.tag = e.target.value;
    renderPoolInfo();
    mountMode();
  });
  $('#budgetSel').addEventListener('change', e => {
    state.budget = Number(e.target.value) || 0;
    renderPoolInfo();
    mountMode();
  });
  $('#muteBtn').addEventListener('click', () => {
    state.muted = !state.muted;
    store.set('muted', state.muted);
    if (state.muted) Sound.stopMusic();
    PX.set($('#muteBtn'), state.muted ? '🔇' : '🔊');
  });
  $('#resetCountBtn').addEventListener('click', () => {
    if (state.busy || !confirm('Reset lượt mở về 0?')) return;
    openCount = 0;
    store.set('count', openCount);
    $('#openCount').textContent = openCount.toLocaleString('vi-VN');
    toast('Đã reset lượt mở.');
  });
  $('#clearHistory').addEventListener('click', () => {
    history = [];
    store.set('history', history);
    renderHistory();
    streak = 0; lastStreakDate = null;
    store.set('streak', 0); store.set('lastStreakDate', null);
    renderStreak(); renderGarden();
  });
  $('#antiChk').addEventListener('change', e => {
    antiR = e.target.checked;
    store.set('antiR', antiR);
    renderAte();
    renderPoolInfo();
    mountMode();
  });
  $('#rAte').addEventListener('click', () => {
    const it = state.lastPick;
    if (!it) return;
    markAte(state.lastPickTab || state.tab, it.id);
    updateAteBtn();
    renderAte();
    renderDex();
    renderPoolInfo();
    mountMode();
    Sound.tick();
    toast('Đã ghi sổ! Món này "nghỉ" 7 ngày khỏi két nhé.');
  });
  $('#ateLine').addEventListener('click', e => {
    const b = e.target.closest('.ate-chip');
    if (!b) return;
    const [tab, id] = b.dataset.k.split(':');
    unmarkAte(tab, id);
    renderAte();
    updateAteBtn();
    renderPoolInfo();
    mountMode();
  });
  $('#planGen').addEventListener('click', () => {
    if (state.busy) return;
    genPlan();
    renderPlan();
    toast('Đã xay thực đơn cho 7 ngày tới! 📅');
  });
  $('#planAteAll').addEventListener('click', () => {
    if (state.busy || !plan) return;
    if (!confirm('Ghi toàn bộ món trong tuần vào sổ "đã ăn" của hôm nay?')) return;
    plan.days.forEach(d => { if (d.f) markAte('food', d.f); if (d.d) markAte('drink', d.d); });
    renderAte();
    renderDex();
    renderPoolInfo();
    mountMode();
    toast('Đã ghi cả tuần vào chống lặp. Két sẽ toàn món mới!');
  });
  $('#planGrid').addEventListener('click', e => {
    const b = e.target.closest('.pd-reroll');
    if (!b || state.busy) return;
    rerollDay(Number(b.dataset.i));
    renderPlan();
  });
  $('#btnPlant').addEventListener('click', doPlant);
  $('#btnWater').addEventListener('click', doWater);
  $('#btnFert').addEventListener('click', doFert);
  $('#btnUpgrade').addEventListener('click', doUpgrade);
  window.addEventListener('resize', () => {
    if (state.mode === 'case' && !state.busy) layoutCrate();
  });

  const LOADER_TIPS = ['Đang load danh sách món...', 'Thợ lùn đang hâm nóng lò...', 'Xếp lại độ hiếm cho món...', 'Gọi món qua vệ tinh...', 'Xào thêm vài lá bài...'];

  function startReveal() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(e => io.observe(e));
    setTimeout(() => {
      els.forEach(e => {
        if (e.classList.contains('in')) return;
        const r = e.getBoundingClientRect();
        if (r.top < innerHeight) e.classList.add('in');
      });
    }, 700);
  }

  function bootLoader() {
    const fill = $('#loaderFill'), tip = $('#loaderTip'), box = $('#loader');
    let p = 0, ti = 0;
    tip.textContent = LOADER_TIPS[0];
    const tipTimer = setInterval(() => {
      ti = (ti + 1) % LOADER_TIPS.length;
      tip.textContent = LOADER_TIPS[ti];
    }, 750);
    const timer = setInterval(() => {
      p = Math.min(100, p + 8 + secureRandom() * 16);
      fill.style.width = p + '%';
      if (p >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          clearInterval(tipTimer);
          box.classList.add('done');
          startReveal();
        }, 320);
      }
    }, 110);
  }

  /* ============ Khởi động ============ */
  const savedStreak = store.get('streak', 0);
  const savedLast = store.get('lastStreakDate', null);
  const savedInv = store.get('inventory', {});
  if (savedInv && typeof savedInv === 'object') Object.assign(inventory, savedInv);
  streak = savedStreak; lastStreakDate = savedLast;
  potLevel = store.get('potLevel', 0);
  plantedItemId = store.get('plantedItemId', null);
  plantedDate = store.get('plantedDate', null);
  plantGrowth = store.get('plantGrowth', 0);
  renderModes();
  renderHistory();
  updateSaveUI();
  renderHud();
  renderStreak();
  renderGarden();
  renderPot();
  PX.scan();
  bootLoader();
  PX.set($('#muteBtn'), state.muted ? '🔇' : '🔊');
  $('#openCount').textContent = openCount.toLocaleString('vi-VN');
  $('#antiChk').checked = antiR;
  if (!plan || !Array.isArray(plan.days) || plan.days.length !== 7 || plan.week !== weekMondayKey()) genPlan();
  renderPlan();
  applyTab('food');
})();
