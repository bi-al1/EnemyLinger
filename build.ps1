# EnemyLinger のビルド：panorama/ を Source 2 形式に変換 → pak73_dir.vpk にまとめる →（-Deploy で）Deadlock の addons へコピー
#
# 使い方（PowerShell）:
#   .\build.ps1            … build\pak73_dir.vpk を作るだけ
#   .\build.ps1 -Deploy    … 作ったあと Deadlock の addons にもコピーする
#
# 必要なもの: Dota 2 と「Dota 2 Workshop Tools DLC」（resourcecompiler.exe を使う）
# VPK にまとめる処理はこのファイルの中に書いてあるので、ほかの道具は要らない
param(
    [switch]$Deploy,
    [string]$Dota2Dir = 'C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta',
    [string]$DeadlockDir = 'C:\Program Files (x86)\Steam\steamapps\common\Deadlock'
)
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$vpkName = 'pak73_dir.vpk'
$addonName = 'enemy_linger'
$sourceDir = Join-Path $root 'panorama'
$buildDir = Join-Path $root 'build'
$vpkOut = Join-Path $buildDir $vpkName

$compiler = Join-Path $Dota2Dir 'game\bin\win64\resourcecompiler.exe'
# Dota 2 の変換ツールは「content\dota_addons\<名前>」に置いた元ファイルを「game\dota_addons\<名前>」へ書き出す
$addonContent = Join-Path $Dota2Dir "content\dota_addons\$addonName"
$addonGame = Join-Path $Dota2Dir "game\dota_addons\$addonName"

# 変換後にできていなければならないファイル（VPK にはこれだけを入れる）
$expected = @(
    'panorama/layout/hud_minimap.vxml_c',
    'panorama/layout/enemy_linger_layer.vxml_c',
    'panorama/scripts/enemy_linger.vjs_c',
    'panorama/styles/enemy_linger.vcss_c'
)

# VPK（バージョン 2、1 ファイル完結型）を書き出す。
# 形式: ヘッダー → ファイル一覧（拡張子 → フォルダ → ファイル名の木構造）→ 中身 → MD5 チェックサム
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

public static class EnemyLingerVpk
{
    static readonly uint[] CrcTable = Enumerable.Range(0, 256).Select(n => {
        uint c = (uint)n;
        for (int k = 0; k < 8; k++) c = (c & 1) != 0 ? 0xEDB88320u ^ (c >> 1) : c >> 1;
        return c;
    }).ToArray();

    static uint Crc32(byte[] data)
    {
        uint c = 0xFFFFFFFFu;
        foreach (byte b in data) c = CrcTable[(c ^ b) & 0xFF] ^ (c >> 8);
        return c ^ 0xFFFFFFFFu;
    }

    static void CString(BinaryWriter w, string s)
    {
        w.Write(Encoding.UTF8.GetBytes(s));
        w.Write((byte)0);
    }

    // files: VPK 内のパス（例 "panorama/scripts/x.vjs_c"）→ 実ファイルのパス
    public static void Write(string outPath, IDictionary<string, string> files)
    {
        var entries = files.Select(kv => {
            string rel = kv.Key.Replace('\\', '/').ToLowerInvariant();
            int slash = rel.LastIndexOf('/');
            string dir = slash < 0 ? " " : rel.Substring(0, slash);
            string file = slash < 0 ? rel : rel.Substring(slash + 1);
            int dot = file.LastIndexOf('.');
            return new {
                Ext = dot < 0 ? " " : file.Substring(dot + 1),
                Dir = dir,
                Name = dot < 0 ? file : file.Substring(0, dot),
                Data = File.ReadAllBytes(kv.Value)
            };
        }).ToList();

        var tree = new MemoryStream();
        var data = new MemoryStream();
        var tw = new BinaryWriter(tree);
        foreach (var byExt in entries.GroupBy(e => e.Ext).OrderBy(g => g.Key, StringComparer.Ordinal))
        {
            CString(tw, byExt.Key);
            foreach (var byDir in byExt.GroupBy(e => e.Dir).OrderBy(g => g.Key, StringComparer.Ordinal))
            {
                CString(tw, byDir.Key);
                foreach (var e in byDir.OrderBy(e => e.Name, StringComparer.Ordinal))
                {
                    CString(tw, e.Name);
                    tw.Write(Crc32(e.Data));
                    tw.Write((ushort)0);        // 先読みデータなし
                    tw.Write((ushort)0x7FFF);   // 中身はこの VPK ファイル自身に入っている
                    tw.Write((uint)data.Length);
                    tw.Write((uint)e.Data.Length);
                    tw.Write((ushort)0xFFFF);
                    data.Write(e.Data, 0, e.Data.Length);
                }
                tw.Write((byte)0);
            }
            tw.Write((byte)0);
        }
        tw.Write((byte)0);
        tw.Flush();

        byte[] treeBytes = tree.ToArray();
        byte[] dataBytes = data.ToArray();
        var output = new MemoryStream();
        var w = new BinaryWriter(output);
        w.Write(0x55AA1234u);              // VPK の目印
        w.Write(2u);                       // バージョン 2
        w.Write((uint)treeBytes.Length);
        w.Write((uint)dataBytes.Length);
        w.Write(0u);                       // 分割アーカイブの MD5 一覧（なし）
        w.Write(48u);                      // 下の MD5 3 つ分
        w.Write(0u);                       // 署名なし
        w.Write(treeBytes);
        w.Write(dataBytes);
        using (var md5 = MD5.Create())
        {
            w.Write(md5.ComputeHash(treeBytes));
            w.Write(md5.ComputeHash(new byte[0]));
            w.Flush();
            w.Write(md5.ComputeHash(output.ToArray()));
        }
        w.Flush();
        File.WriteAllBytes(outPath, output.ToArray());
    }
}
'@

if (-not (Test-Path $compiler)) {
    throw "見つかりません: $compiler`nDota 2 と Dota 2 Workshop Tools DLC がインストールされているか確認してください。"
}

Write-Host '1/3 変換用の作業フォルダを用意しています...'
foreach ($dir in @($addonContent, $addonGame, $buildDir)) {
    if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
    New-Item -ItemType Directory -Path $dir | Out-Null
}
Copy-Item $sourceDir -Destination $addonContent -Recurse

Write-Host '2/3 Source 2 形式に変換しています...'
& $compiler -r -i (Join-Path $addonContent 'panorama\*')
if ($LASTEXITCODE -ne 0) { throw "resourcecompiler.exe が失敗しました（終了コード $LASTEXITCODE）" }

$files = New-Object 'System.Collections.Generic.Dictionary[string,string]'
foreach ($rel in $expected) {
    $src = Join-Path $addonGame $rel
    if (-not (Test-Path $src)) { throw "変換結果が見つかりません: $src" }
    $files[$rel] = $src
}

Write-Host "3/3 $vpkName にまとめています..."
[EnemyLingerVpk]::Write($vpkOut, $files)
Write-Host "できました: $vpkOut"

if ($Deploy) {
    $addons = Join-Path $DeadlockDir 'game\citadel\addons'
    if (-not (Test-Path $addons)) { throw "Deadlock の addons フォルダが見つかりません: $addons" }
    Copy-Item $vpkOut -Destination (Join-Path $addons $vpkName) -Force
    Write-Host "Deadlock にコピーしました: $(Join-Path $addons $vpkName)"
}
