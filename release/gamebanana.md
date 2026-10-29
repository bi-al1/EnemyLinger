# GameBanana 投稿用テキスト（下書き）

投稿フォームの各欄にそのまま貼れるようにまとめたもの。
リンク（GitHub・X・Discord）はすべて記入済み。

---

## タイトル（Name、50 文字まで）

```
EnemyLinger - "?" where enemies vanished
```

## 短い説明（Description、一覧に出る 1 行）

```
Shows a "?" on the minimap where an enemy just went out of sight. Lightweight, single-feature.
```

## カテゴリ

- Quality of Life/Fixes（または HUD）

---

## 本文（Body）

```
🇯🇵 日本の個人開発者が作った MOD です / Made by a solo developer from Japan

━━━━━━━━━━━━━━━━━━━━
【日本語】
━━━━━━━━━━━━━━━━━━━━

■ どんな MOD？
ミニマップで敵が見えなくなった瞬間、その位置に「?」を 5 秒間表示します。
敵のアイコンは半透明でその場に残るので、「誰が」「どこで」消えたかがひと目でわかります。

■ 特長
・「?」表示だけに絞った軽い MOD（タイマーや設定メニューなどは入っていません）
・次のどれかで「?」は消えます：敵がまた見えた／敵が死んだ／5 秒たった
・味方には表示されません
・ミニマップの向き（チームによる上下反転）や画面の解像度に合わせて位置を自動で計算します

■ インストール
・Deadlock Mod Manager：「EnemyLinger」で検索してインストール
・手動：pak73_dir.vpk を
  ...\steamapps\common\Deadlock\game\citadel\addons\ に置く
  （同じ番号の MOD がある場合は pak74_dir.vpk などに名前を変えてください）

■ 同時に使えない MOD
ミニマップの定義ファイル（hud_minimap）を書き換える MOD とは同時に使えません。
例：Mid and Bridge Buff Timer（この MOD の元になった MOD。同じ機能が入っています）
QOL Lock とは同時に使えます。私自身、QOL Lock と併用して遊んでいます（スクリーンショットも QOL Lock 併用時のものです）。

■ クレジット
「?」表示の仕組みは、Hanturaya さんの「Mid and Bridge Buff Timer」の機能を参考に、
単体の MOD として作り直したものです（Apache License 2.0）。
https://gamebanana.com/mods/606414

■ AI の利用について
この MOD のコード（Panorama の JavaScript / CSS / XML、ビルド用スクリプト）は、
Anthropic の Claude（Claude Code）の支援を受けて作成しました。
機能や見た目は私が決め、Deadlock で実際に動作を確認しています。
MOD 本体に AI で生成した画像・音声・モデルなどは含まれていません。
サムネイル画像は、実際のゲーム画面のスクリーンショットをもとに ChatGPT で装飾しました。

■ ソースコード
GitHub：https://github.com/bi-al1/EnemyLinger

■ フィードバック
バグ報告や「こうしてほしい」はコメント欄へ気軽にどうぞ！
日本語・英語どちらでも大丈夫です。
X：https://x.com/whoru_fuyu（@whoru_fuyu）
Discord：https://discord.com/users/1221510399825023177（DM でも OK）

━━━━━━━━━━━━━━━━━━━━
【English】
━━━━━━━━━━━━━━━━━━━━

■ What is this?
The moment an enemy goes out of sight on the minimap, a "?" appears at that spot for 5 seconds.
The enemy's icon stays there semi-transparent, so you can tell at a glance who vanished and where.

■ Features
- Lightweight, single-feature mod (no timers, no settings menu)
- The "?" disappears when the enemy is seen again, dies, or after 5 seconds
- Never shown for allies
- Position is calculated automatically for the minimap orientation (team-based flip) and any resolution

■ Installation
- Deadlock Mod Manager: search for "EnemyLinger" and install
- Manual: put pak73_dir.vpk into
  ...\steamapps\common\Deadlock\game\citadel\addons\
  (if another mod already uses that number, rename it, e.g. pak74_dir.vpk)

■ Incompatible mods
Not compatible with mods that replace the minimap layout (hud_minimap).
Example: Mid and Bridge Buff Timer (the mod this is based on; it already includes this feature).
Works together with QOL Lock. I play with both installed myself (the screenshots were taken with QOL Lock enabled).

■ Credits
The "?" feature is based on Hanturaya's "Mid and Bridge Buff Timer",
rebuilt as a standalone mod (Apache License 2.0).
https://gamebanana.com/mods/606414

■ AI disclosure
The code of this mod (Panorama JavaScript / CSS / XML and the build script) was written
with the assistance of Anthropic's Claude (Claude Code).
I decided the features and design, and personally tested the mod in Deadlock.
No AI-generated images, audio, models or other assets are included in the mod itself.
The thumbnail was decorated with ChatGPT, based on a real in-game screenshot.

■ Source code
GitHub: https://github.com/bi-al1/EnemyLinger

■ Feedback
Bug reports and suggestions are welcome in the comments!
Japanese or English, either is fine.
X: https://x.com/whoru_fuyu (@whoru_fuyu)
Discord: https://discord.com/users/1221510399825023177 (feel free to DM)
```

---

## メモ（投稿時のチェック）

- GameBanana の「AI Generated Content Policy」（https://gamebanana.com/wikis/2175）により、
  AI が手伝ったコードは「使った AI の名前つきで」開示が必須。上の「AI の利用について」で対応
- 元のコードを AI に読ませて参考にした場合は、元の作者の明記が必要。上の「クレジット」と NOTICE で対応
- サムネイルは AI 開示の対象外だが、実際と違う見た目（誤解を招く画像）は禁止。実際のスクショを土台にする
- ライセンス欄：Apache License 2.0
- 画像：1 枚目 `release/thumbnail.png`（サムネイル）、2 枚目 `release/screenshot_minimap.png`（実際のゲーム画面）
- 投稿するファイル：`build/pak73_dir.vpk`
