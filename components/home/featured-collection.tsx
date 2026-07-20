import type { HomepageTexts } from './hero';
import FeaturedCollectionClient from './featured-collection-client';

export interface FeaturedCollection {
  id: string;
  name: string;
  bannerUrl?: string | null;
}

interface FeaturedCollectionProps {
  collection?: FeaturedCollection | null;
  img?: string | null;
  texts?: HomepageTexts;
}

export default function FeaturedCollection({
  collection,
  img,
  texts,
}: FeaturedCollectionProps) {
  return (
    <FeaturedCollectionClient collection={collection} img={img} texts={texts} />
  );
}
