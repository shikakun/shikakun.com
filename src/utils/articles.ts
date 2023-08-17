export type Article = {
  id: number;
  slug: string;
  title: string;
  date: string;
  category?: string;
  tags?: string[];
  description?: string;
  body: string[];
};

export const mapContentToArticle = (content): Article => ({
  id: content.id,
  slug: content.attributes.slug,
  title: content.attributes.title,
  date: content.attributes.date,
  category: content.attributes.category.data.attributes,
  tags: content.attributes.tags.data,
  cover: content.attributes.cover.data,
  description: content.attributes.description,
  body: content.attributes.body,
});
