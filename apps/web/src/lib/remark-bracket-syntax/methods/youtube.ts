import type { MethodHandler } from '../types';
import { element, rejectText } from './helpers';

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export interface YoutubeVideo {
  videoId: string;
  /** 再生開始位置（秒）。指定がなければnull */
  start: number | null;
}

/**
 * YouTubeの動画URLからvideo idと再生開始位置を取り出す。
 * watch・youtu.be・shorts・live・embedの各形式に対応する。
 * 解釈できなければnullを返す。
 */
export function parseYoutubeUrl(url: string): YoutubeVideo | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^(www|m)\./, '');
  let videoId: string | null = null;
  if (host === 'youtu.be') {
    videoId = parsed.pathname.split('/')[1] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (parsed.pathname === '/watch') {
      videoId = parsed.searchParams.get('v');
    } else {
      const pathMatch = /^\/(?:shorts|live|embed)\/([^/]+)/.exec(parsed.pathname);
      videoId = pathMatch?.[1] ?? null;
    }
  }
  if (videoId === null || !VIDEO_ID_PATTERN.test(videoId)) {
    return null;
  }

  // t=・start=は秒数（数値のみ）に対応する。1m30sのような形式は無視する
  const startValue = parsed.searchParams.get('start') ?? parsed.searchParams.get('t');
  const start = startValue !== null && /^\d+$/.test(startValue) ? Number(startValue) : null;

  return { videoId, start };
}

/**
 * `[(youtube, https://www.youtube.com/watch?v=XXXX, title="動画のタイトル")]`
 * → プライバシー強化モード（youtube-nocookie.com）のiframe埋め込み。
 * 単独の段落としてのみ使える（ブロックメソッド）。
 */
export const youtube: MethodHandler = (expression, file) => {
  if (!rejectText(expression, file)) {
    return null;
  }
  const url = expression.args[0];
  if (url === undefined) {
    file.message('bracket-syntax: youtubeには動画URLの引数が必要なため無視しました');
    return null;
  }
  const video = parseYoutubeUrl(url);
  if (video === null) {
    file.message(`bracket-syntax: YouTubeの動画URLとして解釈できないため無視しました: ${url}`);
    return null;
  }

  const src = new URL(`https://www.youtube-nocookie.com/embed/${video.videoId}`);
  if (video.start !== null) {
    src.searchParams.set('start', String(video.start));
  }

  return element('div', { className: ['bracket-youtube'] }, [
    {
      type: 'element',
      tagName: 'iframe',
      properties: {
        src: src.toString(),
        title: expression.namedArgs.title ?? 'YouTube動画',
        loading: 'lazy',
        allow:
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
        referrerPolicy: 'strict-origin-when-cross-origin',
        allowFullScreen: true,
      },
      children: [],
    },
  ]);
};
