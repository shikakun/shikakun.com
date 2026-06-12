import type { ElementContent, Properties } from 'hast';

/**
 * 角括弧構文の式。
 * `[TEXT(METHOD.PRESET:SUBTYPE, ARG1, name=value, ...)..]`をパースした結果を表す。
 * 仕様の詳細はdocs/bracket-syntax.mdを参照。
 */
export interface BracketExpression {
  /** TEXT部。自己完結型（`[(divider)]`など）ではnull */
  text: string | null;
  /** メソッド名（例：'ruby'、'key'） */
  method: string;
  /** ドット記法のプリセット（例：'command'）。なければnull */
  preset: string | null;
  /** コロン区切りのサブタイプ（例：'dash'）。なければnull */
  subtype: string | null;
  /** 位置引数（トリム・引用符除去済み）。`reversed`のようなフラグも含む */
  args: string[];
  /** 名前付き引数（値の引用符は除去済み） */
  namedArgs: Record<string, string>;
  /** 末尾の範囲オペレーター「..」の有無 */
  isRangeStart: boolean;
}

/**
 * mdast上に置く、hast出力だけを指示するカスタムノード。
 * mdast-util-to-hast（remark-rehypeとMDXパイプラインの両方が使う）は
 * 未知のノードでもdata.hName / hProperties / hChildrenを尊重してHTML要素へ変換する。
 */
export interface BracketSyntaxNode {
  type: 'bracketSyntax';
  data: {
    hName: string;
    hProperties?: Properties;
    hChildren?: ElementContent[];
  };
}

declare module 'mdast' {
  interface PhrasingContentMap {
    bracketSyntax: BracketSyntaxNode;
  }
  interface BlockContentMap {
    bracketSyntax: BracketSyntaxNode;
  }
  interface RootContentMap {
    bracketSyntax: BracketSyntaxNode;
  }
}
