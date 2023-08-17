import * as marked from 'marked';
import sanitizeHtml from 'sanitize-html';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.locale('ja');
dayjs.extend(relativeTime);

marked.use({
  mangle: false,
  headerIds: false,
  gfm: true,
  tables: true,
  breaks: true,
  renderer: createRenderer(),
});

function createRenderer() {
  const renderer = new marked.Renderer();
  const originalLinkRenderer = renderer.link;
  renderer.link = (href, title, text) => {
    const html = originalLinkRenderer.call(renderer, href, title, text);

    return href.startsWith('http')
      ? html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ')
      : html;
  };

  return renderer;
}

export function getRenderedMarkdownContent(content: string): string {
  return sanitizeHtml(marked.parse(content));
}

export function getFormattedDate(date: string, format: string): string | null {
  const formatMap = {
    yyyy: 'YYYY',
    'yyyy-mm': 'YYYY-MM',
    'yyyy-mm-dd': 'YYYY-MM-DD',
  };
  const dayjsFormat = formatMap[format];
  return dayjsFormat ? dayjs(date).format(dayjsFormat) : null;
}

export function getRelativeDate(date: string): string {
  return dayjs(date).fromNow();
}

export function getAssetsUrl(path: string = ''): string {
  return path.replace(
    'https://s3.ap-northeast-1.amazonaws.com/assets.shikakun.com',
    'https://assets.shikakun.com'
  );
}
