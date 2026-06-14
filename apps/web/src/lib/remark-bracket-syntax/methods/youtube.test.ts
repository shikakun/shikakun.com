import { describe, expect, it } from 'vitest';
import { parseYoutubeUrl } from './youtube';

describe('parseYoutubeUrl', () => {
  it.each([
    ['watch形式', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    ['wwwなしのwatch形式', 'https://youtube.com/watch?v=dQw4w9WgXcQ'],
    ['モバイルのwatch形式', 'https://m.youtube.com/watch?v=dQw4w9WgXcQ'],
    ['短縮URL', 'https://youtu.be/dQw4w9WgXcQ'],
    ['shorts形式', 'https://www.youtube.com/shorts/dQw4w9WgXcQ'],
    ['live形式', 'https://www.youtube.com/live/dQw4w9WgXcQ'],
    ['embed形式', 'https://www.youtube.com/embed/dQw4w9WgXcQ'],
  ])('%s からvideo idを取り出す', (_name, url) => {
    expect(parseYoutubeUrl(url)).toEqual({ videoId: 'dQw4w9WgXcQ', start: null });
  });

  it('t=パラメーターを再生開始位置として取り出す', () => {
    expect(parseYoutubeUrl('https://youtu.be/dQw4w9WgXcQ?t=90')).toEqual({
      videoId: 'dQw4w9WgXcQ',
      start: 90,
    });
  });

  it('start=パラメーターを再生開始位置として取り出す', () => {
    expect(parseYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&start=30')).toEqual({
      videoId: 'dQw4w9WgXcQ',
      start: 30,
    });
  });

  it('1m30sのような秒数でないt=は無視する', () => {
    expect(parseYoutubeUrl('https://youtu.be/dQw4w9WgXcQ?t=1m30s')).toEqual({
      videoId: 'dQw4w9WgXcQ',
      start: null,
    });
  });

  it.each([
    ['YouTube以外のドメイン', 'https://example.com/watch?v=dQw4w9WgXcQ'],
    ['video idが11文字でない', 'https://www.youtube.com/watch?v=short'],
    ['video idに不正な文字', 'https://www.youtube.com/watch?v=dQw4w9WgXc%'],
    ['URLでない文字列', 'dQw4w9WgXcQ'],
    ['チャンネルページ', 'https://www.youtube.com/@shikakun'],
    ['httpsでもhttpでもないスキーム', 'ftp://www.youtube.com/watch?v=dQw4w9WgXcQ'],
  ])('%s はnullを返す', (_name, url) => {
    expect(parseYoutubeUrl(url)).toBeNull();
  });
});
