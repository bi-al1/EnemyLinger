# EnemyLinger

[日本語](README.md) | **English**

A lightweight Deadlock mod that **shows a `?` for 5 seconds on the minimap where an enemy just went out of sight**.

- The `?` disappears when the enemy is seen again, dies, or after 5 seconds
- While the `?` is shown, the enemy's icon stays there semi-transparent
- No timers, glows or settings menu — just this one feature

## Installation

**GameBanana:** [gamebanana.com/mods/733553](https://gamebanana.com/mods/733553) (also available in Deadlock Mod Manager — search for "EnemyLinger")

Manual install:

1. Put `pak73_dir.vpk` into `Deadlock\game\citadel\addons\`
2. Make sure `Deadlock\game\citadel\gameinfo.gi` contains `Game citadel/addons` (already set if you use Deadlock Mod Manager)

### Incompatible mods

Not compatible with mods that replace the minimap layout `panorama/layout/hud_minimap`.
Example: "Mid and Bridge Buff Timer" (the mod this one is based on; it already includes this feature).

Works together with [QOL Lock](https://gamebanana.com/mods/650634) (the author plays with both installed).

## Files

```
panorama/layout/hud_minimap.xml         … stock minimap layout + one line that loads enemy_linger.js
panorama/layout/enemy_linger_layer.xml  … the layer that holds the `?` labels (loads the CSS)
panorama/scripts/enemy_linger.js        … shows and removes the `?`
panorama/styles/enemy_linger.css        … look of the `?`
build.ps1                               … compiles everything into pak73_dir.vpk
```

## Building

You need Dota 2 and the "Dota 2 Workshop Tools DLC" (free DLC for Dota 2 on Steam).
Deadlock uses the same Source 2 formats, so the Dota 2 compiler (`resourcecompiler.exe`) is used.
Packing into a VPK is done inside `build.ps1`, so no other tools are needed.

```powershell
.\build.ps1            # builds build\pak73_dir.vpk
.\build.ps1 -Deploy    # also copies it into Deadlock's addons folder
```

Use `-Dota2Dir` / `-DeadlockDir` if Dota 2 or Deadlock is installed somewhere else.

## How it works

1. Every 0.5 seconds, check the player icons on the minimap
2. Tell allies from enemies with the local-perspective `friend` / `enemy` classes
3. The moment an enemy icon goes from visible (`active`) to not visible, put a `?` at that spot
4. Remove the `?` and restore the icon when the enemy is seen again, dies (`PlayerDead`), or after 5 seconds

## AI disclosure

The code was written with the assistance of Anthropic's Claude (Claude Code). The author decided the features and design and tested the mod in Deadlock.

## Credits and license

- Based on the `?` feature of [Mid and Bridge Buff Timer](https://gamebanana.com/mods/606414) by Hanturaya ([source](https://github.com/Hantu-Raya/Deadlock-mods-collection))
- Licensed under the Apache License 2.0 ([LICENSE](LICENSE) / [NOTICE](NOTICE))
- Unofficial fan mod, not affiliated with Valve
