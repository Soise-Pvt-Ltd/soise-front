import ExploreCollectionClient from './explore-collection-client';

interface ExploreCollectionProps {
  image?: string | null;
}

export default function ExploreCollection({ image }: ExploreCollectionProps) {
  return <ExploreCollectionClient image={image} />;
}
