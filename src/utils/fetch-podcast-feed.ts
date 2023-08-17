import axios from 'axios';
import xml2js from 'xml2js';

interface PodcastItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  audio: string;
  image: string;
  duration: string;
}

export async function fetchPodcastFeed(
  url,
  limit: number = 10
): Promise<PodcastItem[]> {
  try {
    const response = await axios.get(url);
    const parser = new xml2js.Parser({ explicitArray: false });

    const result = await parser.parseStringPromise(response.data);
    const items: PodcastItem[] = result.rss.channel.item
      .slice(0, limit)
      .map((item: any) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        description: item.description,
        audio: item.enclosure.$.url,
        image: item['itunes:image'].$.href,
        duration: item['itunes:duration'],
      }));

    return items;
  } catch (error) {
    console.error(error);
    return [];
  }
}
