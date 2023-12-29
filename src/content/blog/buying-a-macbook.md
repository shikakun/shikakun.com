---
title: MacBookを買ってウキウキ開発環境構築
date: 2023-12-29
---

突然ですが、M2 MacBook Air（CPU 8コア, GPU 8コア, メモリ 16GB, SSD 512GB）を買いました！ふつうに買うと220,800円という感じなのだけど、Apple Storeでおなじスペックの[整備済製品](https://www.apple.com/jp/shop/refurbished/mac/macbook-air)があったので2万円ほど安く買えたのと、楽天リーベイツを経由して1,800ポイントもらえた。やったね。

使ってみてよかったことを簡潔に3つ紹介します。重量が1.24kgでメチャ軽いので、出張やちょっとした外でのミーティングなど、気軽にmacOSを外へ連れていけること。はじめてAppleのMなんとかチップのパソコンを触ったけど、メモリ16GBなのにじゅうぶんサクサクだったこと。あとは、体感できるくらい電池が長持ちなこと。30Wで出力するモバイルバッテリーでも充電できるのはうれしいね。

さて、そんな新しいパソコンを買ってウキウキな気分でやるのが開発環境の構築ということで、今回やったことをまとめておこうと思います。

[:contents]

# シェルの設定

シェルはZshを使っています。理由はmacOSのデフォルトだから…。Zshの設定のフレームワークにはずっとPreztoを使っていたのだけど、ちょっとばかし起動が遅いのが気になっていて、この機会に[Zim](https://zimfw.sh/)を試してみることに。起動がちょ〜はやい。テーマの設定は `.zimrc` ファイルに `zmodule eriner` と書くだけでいい感じの見た目に。フォントはRicty for PowerlineをインストールしてiTerm 2のプロファイルで設定（でも、[Rictyは「サポート終了」した](https://qiita.com/sounisi5011/items/62e4da71458ca7ce73c7)そうなので、代替のフォントを選んだほうがいいのかもしれません）。

[https://blog.nishimu.land/entry/2022/03/21/003009:embed]

Sixeightさんの記事を参考に、設定ファイルもホームディレクトリ直下ではなく `~/.config` ディレクトリにまとめてみました。[XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html)なんてディレクトリ構造の仕様があるって知らなかったなあ。

```
.config
├── git
│   ├── config
│   └── ignore
└── zsh
    ├── .zim
    ├── .zimrc
    ├── .zprofile
    ├── .zsh_history
    ├── .zshenv
    └── .zshrc
```

`/etc/zshenv` に `ZDOTDIR=$HOME/.config/zsh` と書いたうえで `~/.config/zsh/.zshenv` で環境変数を設定しておく。

```
export XDG_CONFIG_HOME="$HOME"/.config
export XDG_CACHE_HOME="$HOME"/.cache
export XDG_DATA_HOME="$HOME"/.local/share
export XDG_STATE_HOME="$HOME"/.local/state
```

`~/.config/zsh/.zshrc` には、おなじみのaliasの設定など。

```
alias g='git'
alias ga='git add'
alias gc='git commit -m'
alias gca='git commit --amend'
alias gcaa='git commit --amend --no-edit'
alias gce='git commit --allow-empty -m'
alias gd='git diff'
alias gdd='git diff --cached'
alias gs='git status -sb'
alias mm='git-checkout-default-branch'
alias o='open'
alias pwdd='open -a iTerm .'
alias z='exec $SHELL -l'

git-checkout-default-branch() {
  local BRANCH=`git remote show origin | grep 'HEAD branch' | awk '{print $NF}'`
  git checkout $BRANCH && git pull && git pull origin $BRANCH
}
```

こだわりポイントとしては、 `mm` って打つと、Gitのどのブランチにいてもmasterやmainブランチへ移動して最新版をpullしてくれるコマンドをよく使ってます。あと `pwd` ならぬ `pwdd` って打つと、いま自分がいるディレクトリを新しいiTermのタブで開いてくれるコマンドも便利。もっといい書き方やツールがあるのかもしれませんが…。

# プログラミング言語のインストール

複数の言語やプロジェクトごとに異なるバージョンを管理しやすくするために、[anyenv](https://github.com/anyenv/anyenv)を利用してます。ということで、まずanyenvとanyenv-updateをインストール。

```bash
$ brew install anyenv
$ echo 'eval "$(anyenv init -)"' >> ~/.zshrc
$ anyenv init
$ exec $SHELL -l
$ anyenv install --init
$ mkdir -p $(anyenv root)/plugins
$ git clone <https://github.com/znz/anyenv-update.git> $(anyenv root)/plugins/anyenv-update
```

そのうえでNode.jsをインストール。

```bash
$ anyenv install nodenv
$ exec $SHELL -l
$ anyenv update
$ nodenv install -l
$ nodenv install 18.16.0 #記事公開時のLTSの最新バージョンです
$ nodenv global 18.16.0
```

あとRubyもインストール。

```bash
$ anyenv install rbenv
$ exec $SHELL -l
$ anyenv update
$ rbenv install -l
$ rbenv install 3.2.2 #記事公開時の安定版の最新バージョンです
$ rbenv global 3.2.2
```

# グラフィックツールの設定

Adobe Creative Cloudにも毎月お金を払ってるので料金の高額さに怒りながらインストールします（[1ライセンスで2台までOK](https://helpx.adobe.com/jp/creative-cloud/kb/install-cc-2nd-pc-jp.html)とのこと）。よく忘れるので設定をメモしておきます。なお、僕は印刷物をまったく作りません。

- Photoshop
    - 環境設定 > ツール
        - `ツールヒントを表示` をOFF
    - 環境設定 > 単位・定規 > 単位
        - `定規` と `文字` を `pixel`
    - 環境設定 > ガイド・グリッド・スライス > グリッド
        - `グリッド線` を `10` `pixel`
        - `分割数` を `10`
- Illustrator
    - 環境設定 > 一般
        - `キー入力` を `1px`
        - `ツールヒントを表示` をOFF
    - 環境設定 > 単位
        - すべて `ピクセル`

あとは思い出したら追記しま〜す！
