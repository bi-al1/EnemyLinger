# EnemyLinger

**日本語** | [English](README.en.md)

Deadlock のミニマップで、**敵が見えなくなった位置に `?` を 5 秒間表示する**だけの軽い MOD です。

- `?` は「敵がまた見えたとき」「敵が死んだとき」「5 秒たったとき」に消えます
- `?` が出ている間、元の敵アイコンは半透明になります
- タイマー・グロー・設定メニューなどは入っていません

## インストール

GameBanana と Deadlock Mod Manager での配布は終了しました（GameBanana の運営により「対戦で有利になりすぎる」として削除されたため）。
使う場合は、下の「ビルド方法」で `pak73_dir.vpk` を作ってから入れてください。

1. `pak73_dir.vpk` を `Deadlock\game\citadel\addons\` に置く
2. `Deadlock\game\citadel\gameinfo.gi` に `Game citadel/addons` が入っていることを確認する（Deadlock Mod Manager を使っていれば設定済み）

### 注意：同時に使えない MOD

ミニマップの定義ファイル `panorama/layout/hud_minimap` を書き換える MOD とは同時に使えません。
例：「Mid and Bridge Buff Timer」（この MOD の元になった MOD。同じ機能が入っています）

[QOL Lock](https://gamebanana.com/mods/650634) とは同時に使えます（作者自身が併用しています）。

## ファイル構成

```
panorama/layout/hud_minimap.xml         … ゲーム本来のミニマップ定義に enemy_linger.js の読み込みを 1 行足したもの
panorama/layout/enemy_linger_layer.xml  … `?` を置くレイヤー（見た目の CSS をここで読み込む）
panorama/scripts/enemy_linger.js        … `?` を出し入れする処理
panorama/styles/enemy_linger.css        … `?` の見た目
build.ps1                               … 変換して pak73_dir.vpk を作る
```

## ビルド方法

Dota 2 と「Dota 2 Workshop Tools DLC」（Steam で Dota 2 の DLC として無料で入れられます）が必要です。
Deadlock と同じ Source 2 形式なので、Dota 2 付属の変換ツール（`resourcecompiler.exe`）を使います。
VPK にまとめる処理は `build.ps1` の中に書いてあるので、ほかの道具は要りません。

```powershell
.\build.ps1            # build\pak73_dir.vpk を作る
.\build.ps1 -Deploy    # 作ったあと Deadlock の addons にもコピーする
```

Dota 2 や Deadlock を標準以外の場所に入れている場合は `-Dota2Dir` / `-DeadlockDir` で場所を指定します。

## 仕組み

1. 0.5 秒ごとにミニマップ上のプレイヤーアイコンを調べる
2. 敵味方は自分から見た `friend` / `enemy` で判定する
3. 敵のアイコンが「見えている（`active`）→ 見えていない」に変わった瞬間に、その位置へ `?` を出す
4. 再び見えた・死んだ（`PlayerDead`）・5 秒たった、のどれかで `?` を消し、アイコンを元に戻す

## AI の利用について

コードは Anthropic の Claude（Claude Code）の支援を受けて作成しました。機能や見た目は作者が決め、Deadlock で動作を確認しています。

## クレジット・ライセンス

- 仕組みは Hantu-Raya 氏の [Mid and Bridge Buff Timer](https://gamebanana.com/mods/606414)（[ソース](https://github.com/Hantu-Raya/Deadlock-mods-collection)）の `?` 機能を参考にしています
- ライセンスは Apache License 2.0 です（[LICENSE](LICENSE) / [NOTICE](NOTICE)）
- Valve 公式とは関係のない非公式 MOD です
