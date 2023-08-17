import axios from 'axios';
import xml2js from 'xml2js';

interface BookmarkItem {
  title: string;
  link: string;
  date: string;
}

export async function fetchBookmarkFeed(
  url,
  limit: number = 10
): Promise<BookmarkItem[]> {
  try {
    const response = await axios.get(url);
    const parser = new xml2js.Parser({ explicitArray: false });

    const result = await parser.parseStringPromise(response.data);
    const items: BookmarkItem[] = result['rdf:RDF'].item
      .slice(0, limit)
      .map((item: any) => ({
        title: item.title,
        link: item.link,
        date: item['dc:date'],
      }));

    return items;
  } catch (error) {
    console.error(error);
    return [];
  }
}
