import type { HomepageTexts } from './hero';
import MensTopsClient from './mens-tops-client';

interface MensTopsProps {
  img?: string | null;
  texts?: HomepageTexts;
}

export default function MensTops({ img, texts }: MensTopsProps) {
  return <MensTopsClient img={img} texts={texts} />;
}
