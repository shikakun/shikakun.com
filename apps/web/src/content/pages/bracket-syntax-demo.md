---
title: 角括弧構文のデモ
description: このウェブサイト独自のMarkdown記法「角括弧構文」の動作確認用ページ
unlisted: true
---

このページは、角括弧構文（docs/bracket-syntax.md）のフェーズ1で使えるメソッドの動作確認用です。

## 改行

Markdownのソースで単純に改行すると、
このように改行として表示されます。

1行空けると、別の段落になります。

## テキストスタイル

これは[重要なテキスト(strong)]です。

これは[打ち消したテキスト(stroke)]と[太い打ち消し線(stroke,4)]と[二重の打ち消し線(doublestroke,2)]です。

これは[細いウェイト(weight,200)]と[斜めのテキスト(oblique)]と[30度の斜体(oblique,30)]です。

これは[1.5倍のテキスト(scale, 1.5)]と[等幅フォント(mono)]と[太い等幅フォント(mono,800)]です。

## ルビと圏点

[超電磁砲(ruby,レールガン)]はグループルビ、[標準機能(ruby,ひょう じゅん き のう)]はモノルビです。

[ここに圏点が付きます(emphasize,1)]。番号で[種類を選べます(emphasize,7)]。

## キーシンボル

[Command(key)]キーを押しながら[(key.command)][(key.shift)][(key.arrow-up)]のように記号でも書けます。

[(key.delete,title="Backspace")]はtitle引数で読み上げ用のラベルを変えた例です。

## スペーサー

ここから[(spacer)]1em空き、ここから[(spacer,3em)]3em空きます。

## 区切り線

ここは実線の区切りです。

[(divider)]

ここは二重線の区切りです。

[(divider:doublesolid,gap=3px)]

ここは点線の区切りです。

[(divider:dash,length=5px,gap=3px)]

ここは斜線の区切りです。

[(divider:slash,height=1em,gap=10px)]

ここは反転した斜線の区切りです。

[(divider:slash,height=1em,gap=10px,reversed)]

## YouTubeの埋め込み

[(youtube, https://www.youtube.com/watch?v=jNQXAC9IVRw, title="Me at the zoo")]

## エスケープ

記法をそのまま表示したいときは\\[(divider)\\]のようにエスケープするか、インラインコードで`[(divider)]`のように書きます。

[ただの角括弧]やMarkdownの[リンク記法](https://example.com)は、角括弧構文として解釈されません。
