export type Category = {
  id: number;
  slug: string;
  name: string;
};

export const mapContentToCategory = (content): Category => ({
  id: content.id,
  slug: content.attributes.slug,
  name: content.attributes.name,
});
