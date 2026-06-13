# 角括弧構文（Bracket Syntax）

このウェブサイトのMarkdownコンテンツ（`apps/web/src/content/pages`）で使える独自のインライン記法です。テキストを角括弧で囲み、パーレンの中にメソッドと引数を書きます。

usagimaruさんの記事[Click and Magic「レイアウトシステムを作る・1」](https://clickandmagic.com/notes/making_layoutsystem_1#1_3)で提案されている記法を基本仕様として採用し、このサイト独自の拡張として`youtube`メソッドを加えています。

実装は`apps/web/src/lib/remark-bracket-syntax/`にあり、`.md`と`.mdx`の両方で使えます。全メソッドの実例は[デモページ](../apps/web/src/content/pages/bracket-syntax-demo.md)（`/bracket-syntax-demo`）で確認できます。

## 基本形

```
[テキスト(メソッド, 引数)]   テキストに効果を適用する
[(メソッド, 引数)]           テキストを持たない自己完結型
```

- メソッド名は小文字英字とハイフンで書く
- `メソッド.プリセット`でプリセットを呼び出す（例：`kbd.command`）
- 式は行をまたげない

## 引数

- カンマ区切りで並べる。前後の空白は無視される
- `名前=値`の形式で名前付き引数を書ける（例：`title="Me at the zoo"`）
- カンマなどを含む値は引用符で囲む。カーリークォート（`" "`）も使える

## メソッド一覧

| メソッド | 機能 | 種別 |
| --- | --- | --- |
| `strong` | 太字（強い重要性） | インライン |
| `stroke` | 打ち消し線 | インライン |
| `ruby` | ルビ | インライン |
| `emphasize` | 圏点（傍点） | インライン |
| `kbd` | キーシンボル | インライン |
| `spacer` | 水平方向の余白 | インライン |
| `divider` | 区切り線 | ブロック |
| `youtube` | YouTube動画の埋め込み（独自拡張） | ブロック |

ブロックメソッドは**単独の段落としてのみ**書けます。段落の途中に書いた場合は変換されません。

## テキストスタイル

| 記法 | 効果 |
| --- | --- |
| `[テキスト(strong)]` | 太字（`<strong>`） |
| `[テキスト(stroke)]` | 打ち消し線（`<s>`） |

## ルビ（ruby）

```
[超電磁砲(ruby,レールガン)]              グループルビ
[標準機能(ruby,ひょう じゅん き のう)]   モノルビ
```

- 読みをスペースで区切ると**モノルビ**になり、1文字ずつ読みが割り当てられる
- スペースがなければ**グループルビ**になる
- 読みの数と文字数が一致しない場合は、グループルビとして表示される（ビルドログに警告が出る）

## 圏点（emphasize）

```
[けんてん(emphasize)]
```

黒三角の圏点（`text-emphasis: filled triangle`）を付けます。`<strong>`要素として出力されます。

## キーシンボル（kbd）

```
[Command(kbd)]                     テキストをそのまま<kbd>で表示する
[(kbd.command)]                    プリセットの記号（⌘）で表示する
[(kbd.delete,title="Backspace")]   title引数でaria-labelを変える
```

プリセットの記号には読み上げ用の`aria-label`が自動で付きます。

| プリセット | 記号 | プリセット | 記号 |
| --- | --- | --- | --- |
| `control` | ⌃ | `space` | ␣ |
| `option` | ⌥ | `tab` | ⇥ |
| `shift` | ⇧ | `escape` | ⎋ |
| `command` | ⌘ | `arrow-up` | ↑ |
| `delete` | ⌫ | `arrow-down` | ↓ |
| `return` | ⏎ | `arrow-left` | ← |
| | | `arrow-right` | → |

## スペーサー（spacer）

```
[(spacer)]        1em（デフォルト）
[(spacer,3em)]    3em
[(spacer,8px)]    8px
```

単位は`em`・`rem`・`px`が使えます。

## 区切り線（divider）

単独の段落として書きます。

```
[(divider)]             実線
[(divider, double)]     二重線
[(divider, dash)]       点線
```

## YouTube動画の埋め込み（youtube）【このサイト独自の拡張】

単独の段落として書きます。

```
[(youtube, https://www.youtube.com/watch?v=jNQXAC9IVRw)]
[(youtube, https://youtu.be/jNQXAC9IVRw, title="Me at the zoo")]
```

- 対応するURL形式：`watch?v=`・`youtu.be`・`shorts`・`live`・`embed`
- プライバシー強化モード（`youtube-nocookie.com`）のiframeで埋め込まれ、再生するまでCookieが保存されない
- `title`引数はiframeの`title`属性（読み上げ用のラベル）になる。省略すると「YouTube動画」になるため、**動画のタイトルを書くことを推奨**
- URLに`t=90`または`start=90`（秒数のみ）があれば、再生開始位置として引き継がれる

## 外部リンク

Markdownのリンク記法で、`http://`または`https://`で始まるURLは、`target="_blank" rel="noopener noreferrer"`が自動で付きます。

```
[リンクテキスト](https://example.com)
```

## エスケープと変換されない場所

- 記法をそのまま表示したいときは、バックスラッシュ2つでエスケープする：`\\[(divider)\\]`
- インラインコード（`` `[(divider)]` ``）とコードブロックの中は変換されない
- Markdownのリンク記法`[テキスト](URL)`・脚注`[^1]`・メソッド括弧のないただの角括弧`[こんにちは]`は、角括弧構文として解釈されない

## 不正な記法の扱い

構文に合致しない式・未知のメソッド・不正な引数は、変換されずソースの文字列がそのまま表示されます。ビルドは失敗せず、ビルドログに`bracket-syntax:`で始まる警告が出ます。

## 未対応の記法（今後の拡張）

出典の仕様のうち、次の記法は未対応です。書いた場合は変換されず、そのまま表示されます。

- 範囲オペレーター：`[(alignment:center)..]`〜`[..]`で複数の段落へ効果を適用する記法（`alignment`・`columns`）
- ネスト：`[[テキスト(stroke)] (strong)]`のように複数の効果を重ねる記法
- `pointer`（ポインターシンボル）・`disable`（機能の無効化マーカー）
