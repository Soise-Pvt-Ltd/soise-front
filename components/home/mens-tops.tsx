import MensTopsClient from './mens-tops-client';

interface MensTopsProps {
  img?: string | null;
}

export default function MensTops({ img }: MensTopsProps) {
  return <MensTopsClient img={img} />;
}
