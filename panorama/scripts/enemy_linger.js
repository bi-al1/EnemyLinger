// EnemyLinger: ミニマップで敵が見えなくなった位置に「?」を 5 秒間表示する。
// 仕組みは Hantu-Raya 氏の「Mid and Bridge Buff Timer」（Apache-2.0）の linger 機能を参考に、単体用に書き直したもの。
(() => {
  "use strict";
  const LINGER_SEC = 5;
  const TICK_SEC = 0.5;
  const FONT_MIN = 10;
  const FONT_MAX = 32;
  const STATE_STALE_MS = 6000;
  const LAYER_ID = "EnemyLingerLayer";
  const LAYER_LAYOUT = "file://{resources}/layout/enemy_linger_layer.xml";
  const GEN_ATTR = "enemy_linger_gen";
  const PREV_ATTR = "enemy_linger_prev";
  // true にすると、位置計算の中身をミニマップ上に文字で表示する（ズレの調査用。公開版では false）
  const DEBUG = false;

  let _gen = 0;
  let _root = null;
  let _minimap = null;
  let _container = null;
  let _layer = null;
  let _retired = false;
  let _keySeq = 0;
  // プレイヤーごとの状態: { wasActive, lastSeenMs }
  const _players = Object.create(null);
  // 表示中の「?」: { btn, label, hideHandle, prev }
  const _lingers = Object.create(null);

  function valid(panel) {
    try { return !!(panel && panel.IsValid && panel.IsValid()); } catch {}
    return false;
  }
  function cancel(handle) {
    if (handle) try { $.CancelScheduled(handle); } catch {}
    return null;
  }
  function num(v) {
    const n = Number(v);
    return isFinite(n) && Math.abs(n) <= 1000000 ? n : null;
  }
  function extent(v, fallback) {
    const n = Number(v);
    return isFinite(n) && n > 0 && n <= 8192 ? n : fallback;
  }
  function findRoot(p) {
    while (p && p.GetParent && p.GetParent()) p = p.GetParent();
    return p;
  }

  // 新しい HUD が読み込まれたら古いスクリプトは身を引く（同じ画面に二重に「?」を出さないため）。
  function alive() {
    try {
      return !_retired && valid(_root) && _root.GetAttributeInt(GEN_ATTR, 0) === _gen;
    } catch {}
    return false;
  }
  function retire() {
    if (_retired) return;
    _retired = true;
    clearAll();
    if (valid(_layer)) try { _layer.DeleteAsync(0); } catch {}
    _layer = null;
  }

  // 敵味方は自分視点の friend / enemy で判定する。team1 / team2 は絶対チーム色なので後回し。
  function teamOf(btn) {
    try {
      if (btn.BHasClass("friend")) return 1;
      if (btn.BHasClass("enemy")) return 2;
      if (btn.BHasClass("team1") || btn.BHasClass("ally")) return 1;
      if (btn.BHasClass("team2")) return 2;
    } catch {}
    return 0;
  }
  function keyOf(btn) {
    try {
      const id = btn["id"];
      if (id) return String(id);
      if (!btn["__enemyLingerKey"]) btn["__enemyLingerKey"] = "player_" + (++_keySeq);
      return btn["__enemyLingerKey"];
    } catch {}
    return "player_" + (++_keySeq);
  }

  // マーカーの位置を、祖先パネルまでのオフセットを足し合わせて求める。
  function offsetWithin(panel, ancestor) {
    const out = { x: 0, y: 0, ok: false };
    let p = panel;
    for (let depth = 0; depth < 12 && p; depth++) {
      if (p === ancestor) { out.ok = true; return out; }
      const x = num(p.actualxoffset);
      const y = num(p.actualyoffset);
      if (x === null || y === null) return out;
      out.x += x;
      out.y += y;
      try { p = p.GetParent(); } catch { return out; }
    }
    out.ok = p === ancestor;
    return out;
  }
  // ミニマップが画面上で上下左右反転して描かれているかを調べる。
  // invert_map クラスがあっても他 MOD が反転を打ち消していることがあるので、実際の描画位置で判断する。
  // 反転していると、ミニマップの基準点（左上）が画面上では箱の右下に来る。
  function isMapFlipped(map, mw) {
    try {
      const m = _minimap.GetPositionWithinWindow();
      const c = _container.GetPositionWithinWindow();
      const mx = num(m && m.x);
      const cx = num(c && c.x);
      if (mx !== null && cx !== null && mw > 0) {
        // 反転なしなら差は map.x、反転ありなら map.x + mw になる。その中間で見分ける。
        // どれも実際の画面ピクセルなので、UI の拡大率で割らずにそのまま比べる。
        return mx - cx > map.x + mw / 2;
      }
    } catch {}
    try { return _minimap.BHasClass("invert_map") && !_minimap.BHasClass("qol_minimap_flip_active"); } catch {}
    return false;
  }
  function labelPosition(btn) {
    const cw = extent(_container.actuallayoutwidth || _container.contentwidth, 404);
    const ch = extent(_container.actuallayoutheight || _container.contentheight, 404);
    const mw = extent(_minimap.actuallayoutwidth || _minimap.contentwidth, cw);
    const mh = extent(_minimap.actuallayoutheight || _minimap.contentheight, ch);
    const bw = extent(btn.actuallayoutwidth || btn.contentwidth, 32);
    const bh = extent(btn.actuallayoutheight || btn.contentheight, 32);
    let marker = offsetWithin(btn, _minimap);
    if (!marker.ok) marker = { x: num(btn.actualxoffset) || 0, y: num(btn.actualyoffset) || 0 };
    let map = offsetWithin(_minimap, _container);
    if (!map.ok) map = { x: num(_minimap.actualxoffset) || 0, y: num(_minimap.actualyoffset) || 0 };
    const inverted = isMapFlipped(map, mw);
    // invert_map のときはミニマップの箱の中で上下左右が反転している。
    const left = inverted ? mw - marker.x - bw : marker.x;
    const top = inverted ? mh - marker.y - bh : marker.y;
    const wPct = bw / cw * 100;
    const hPct = bh / ch * 100;
    const xPct = (map.x + left) / cw * 100;
    const yPct = (map.y + top) / ch * 100;
    const scale = Number(_container.actualuiscale_y);
    const fontSize = Math.round(bh / (isFinite(scale) && scale > 0 ? scale : 1) * 0.9);
    const round = (v) => Math.round(v * 1000) / 1000;
    const result = {
      x: round(Math.max(0, Math.min(100 - wPct, xPct))),
      y: round(Math.max(0, Math.min(100 - hPct, yPct))),
      w: round(wPct),
      h: round(hPct),
      fontSize: Math.max(FONT_MIN, Math.min(FONT_MAX, fontSize)),
      debug: ""
    };
    if (DEBUG) {
      const r = (v) => Math.round(Number(v) * 10) / 10;
      const win = (p) => {
        try { const w = p.GetPositionWithinWindow(); return r(w.x) + "," + r(w.y); } catch { return "-"; }
      };
      const chain = [];
      let p = btn;
      for (let i = 0; i < 8 && p; i++) {
        let cls = "";
        try { cls = String(p.paneltype || "") + "." + String(p["id"] || ""); } catch {}
        chain.push(cls + "(" + r(p.actualxoffset) + "," + r(p.actualyoffset) + " " + r(p.actuallayoutwidth) + "x" + r(p.actuallayoutheight) + ")");
        if (p === _container) break;
        try { p = p.GetParent(); } catch { break; }
      }
      result.debug = [
        "c " + r(cw) + "x" + r(ch) + " m " + r(mw) + "x" + r(mh) + " b " + r(bw) + "x" + r(bh) + " s " + r(scale),
        "marker ok=" + marker.ok + " " + r(marker.x) + "," + r(marker.y) + "  map ok=" + map.ok + " " + r(map.x) + "," + r(map.y),
        "inv=" + inverted + " im=" + _minimap.BHasClass("invert_map") + " qol=" + _minimap.BHasClass("qol_minimap_flip_active"),
        "pct " + r(xPct) + "," + r(yPct) + " -> " + result.x + "," + result.y,
        "win b " + win(btn) + " m " + win(_minimap) + " c " + win(_container) + " L " + win(_layer),
        "layer " + r(_layer.actuallayoutwidth) + "x" + r(_layer.actuallayoutheight) + " " + r(_layer.actualxoffset) + "," + r(_layer.actualyoffset),
        chain.join(" < ")
      ].join("\n");
    }
    return result;
  }
  // 確認用：最後に出した「?」の計算の中身をミニマップの上に文字で出す。
  function showDebug(text) {
    if (!DEBUG || !valid(_layer)) return;
    let label = _layer.FindChildTraverse("EnemyLingerDebug");
    if (!valid(label)) {
      label = $.CreatePanel("Label", _layer, "EnemyLingerDebug");
      label.AddClass("enemy-linger-debug");
    }
    label.text = text;
  }

  function showLinger(key, btn) {
    if (_lingers[key] || !valid(_layer)) return;
    let label = null;
    try {
      const pos = labelPosition(btn);
      label = $.CreatePanel("Label", _layer, "EnemyLingerQ_" + key);
      label.AddClass("enemy-linger-q");
      label.text = "?";
      label.style.position = pos.x + "% " + pos.y + "% 0px";
      label.style.width = pos.w + "%";
      label.style.height = pos.h + "%";
      label.style.fontSize = pos.fontSize + "px";
      showDebug(pos.debug);
      // 元の状態はパネル側にも保存し、スクリプトが読み直されても元に戻せるようにする。
      let prev = null;
      try { prev = JSON.parse(btn.GetAttributeString(PREV_ATTR, "") || "null"); } catch {}
      if (!prev || typeof prev !== "object") {
        prev = { "opacity": btn.style.opacity, "hittest": btn["hittest"], "hittestchildren": btn["hittestchildren"] };
        try { btn.SetAttributeString(PREV_ATTR, JSON.stringify(prev)); } catch {}
      }
      _lingers[key] = { btn: btn, label: label, prev: prev, hideHandle: null };
      // 消えた敵のアイコンは半透明にし、クリックを「?」の下に通さない。
      btn["hittest"] = false;
      btn["hittestchildren"] = false;
      btn.style.opacity = "0.5";
      label.AddClass("active");
      _lingers[key].hideHandle = $.Schedule(LINGER_SEC, () => removeLinger(key, false));
    } catch {
      if (_lingers[key]) removeLinger(key, true);
      else if (valid(label)) try { label.DeleteAsync(0); } catch {}
    }
  }
  function removeLinger(key, cancelTimer) {
    const s = _lingers[key];
    if (!s) return;
    delete _lingers[key];
    if (cancelTimer) cancel(s.hideHandle);
    if (valid(s.btn)) {
      try { s.btn.style.opacity = s.prev["opacity"]; } catch {}
      try { s.btn["hittest"] = s.prev["hittest"]; } catch {}
      try { s.btn["hittestchildren"] = s.prev["hittestchildren"]; } catch {}
      try { s.btn.SetAttributeString(PREV_ATTR, ""); } catch {}
    }
    if (valid(s.label)) try { s.label.DeleteAsync(0); } catch {}
  }
  function clearAll() {
    for (const key in _lingers) removeLinger(key, true);
  }

  // 敵が「見えている（active）→ 見えていない」に変わった瞬間に「?」を出す。
  function scan() {
    const now = Date.now();
    let buttons = [];
    try { buttons = _minimap.FindChildrenWithClassTraverse("map_button") || []; } catch { return; }
    for (const btn of buttons) {
      try {
        if (!valid(btn) || !btn.BHasClass("player")) continue;
        if (teamOf(btn) !== 2) continue;
        const key = keyOf(btn);
        const isActive = btn.BHasClass("active");
        // 初めて見たマーカーは今の状態から始める（試合開始直後に全員分の「?」が出ないように）。
        let ps = _players[key];
        if (!ps) ps = _players[key] = { wasActive: isActive, lastSeenMs: 0 };
        const wasActive = ps.wasActive;
        ps.wasActive = isActive;
        ps.lastSeenMs = now;
        if (btn.BHasClass("PlayerDead")) removeLinger(key, true);
        else if (wasActive && !isActive) showLinger(key, btn);
        else if (!wasActive && isActive) removeLinger(key, true);
      } catch {}
    }
    // 試合が変わってマーカーが入れ替わったときの掃除。
    for (const key in _players) {
      if (now - _players[key].lastSeenMs > STATE_STALE_MS) {
        removeLinger(key, true);
        delete _players[key];
      }
    }
  }
  function loop() {
    if (!alive()) { retire(); return; }
    if (!valid(_minimap) || !valid(_container) || !valid(_layer)) {
      clearAll();
      boot();
      return;
    }
    scan();
    $.Schedule(TICK_SEC, loop);
  }

  // ミニマップの親（HudMinimapContainer）に、全面を覆う「?」用レイヤーを置く。
  // hud_minimap の直下は子を受け付けないことがあるため。
  function ensureLayer() {
    if (valid(_layer)) return true;
    for (const child of _container.Children()) {
      if (valid(child) && child["id"] === LAYER_ID) try { child.DeleteAsync(0); } catch {}
    }
    const layer = $.CreatePanel("Panel", _container, LAYER_ID);
    let loaded = false;
    try {
      layer["hittest"] = false;
      loaded = !!layer.BLoadLayout(LAYER_LAYOUT, false, false);
    } catch {}
    if (!loaded) {
      try { layer.DeleteAsync(0); } catch {}
      return false;
    }
    _layer = layer;
    return true;
  }
  function boot() {
    if (_retired) return;
    const context = $.GetContextPanel();
    if (!_gen) {
      _root = findRoot(context);
      if (!valid(_root)) { $.Schedule(0.5, boot); return; }
      try {
        _gen = (_root.GetAttributeInt(GEN_ATTR, 0) | 0) + 1;
        _root.SetAttributeInt(GEN_ATTR, _gen);
      } catch { return; }
    }
    if (!alive()) { retire(); return; }
    _minimap = valid(context) && context["id"] === "hud_minimap" ? context : _root.FindChildTraverse("hud_minimap");
    _container = valid(_minimap) ? _minimap.GetParent() : null;
    if (!valid(_container) || !ensureLayer()) { $.Schedule(1, boot); return; }
    loop();
  }

  boot();
})();
