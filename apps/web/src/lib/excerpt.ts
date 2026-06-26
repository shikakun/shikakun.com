const MAX_LENGTH = 110;

/**
 * MDX/Markdown の生本文から og:description / meta description 用の冒頭テキストを抽出する。
 *
 * frontmatter に description が無いページのフォールバックとして使う。
 * コードブロック・MDX の import/export 行・JSX/HTML タグ・画像・Markdown 記法を除去し、
 * 最初の非空段落を句点境界で maxLength 文字以内に整形して返す。
 * 抽出できない（本文が無い等）場合は空文字を返す。
 */
export function extractExcerpt(body: string | undefined, maxLength = MAX_LENGTH): string {
  if (!body) return '';

  const text = body
    .replace(/```[\s\S]*?```/g, '') // フェンスドコードブロック
    .replace(/^[ \t]*(?:import|export)\s.*$/gm, '') // MDX の ESM 行
    .replace(/<[^>]+>/g, '') // JSX/HTML タグ（<Image ... /> など）
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // 画像
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // リンク → テキスト
    .replace(/^[ \t]*#{1,6}\s+.*$/gm, '') // 見出しは行ごと除去
    .replace(/^[ \t]*(?:>\s?|[-*+]\s+|\d+\.\s+)/gm, '') // 引用・リストの行頭マーカー
    .replace(/[*_`~]/g, ''); // 強調・インラインコードの記号

  const paragraph =
    text
      .split(/\n{2,}/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .find((p) => p.length > 0) ?? '';

  if (paragraph.length <= maxLength) return paragraph;

  // 句点（。！？）境界で切り、前半に句点が無ければ maxLength で切って … を付ける。
  const truncated = paragraph.slice(0, maxLength);
  const sentenceEnd = Math.max(
    truncated.lastIndexOf('。'),
    truncated.lastIndexOf('！'),
    truncated.lastIndexOf('？'),
  );
  return sentenceEnd >= maxLength * 0.5
    ? truncated.slice(0, sentenceEnd + 1)
    : `${truncated.trimEnd()}…`;
}
