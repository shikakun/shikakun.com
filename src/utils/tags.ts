export type Tag = {
  id: number;
  slug: string;
  name: string;
};

export const mapContentToTag = (content): Tag => ({
  id: content.id,
  slug: content.attributes.slug,
  name: content.attributes.name,
});
