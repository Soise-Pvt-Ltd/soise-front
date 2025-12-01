import Footer from '@/components/footer';
import ExploreCollection from '@/components/home/explore-collection';
import BeforeExploreCollection from '@/components/home/before-explore-collection';
import MensTops from '@/components/home/mens-tops';
import AfterHero from '@/components/home/after-hero';
import Hero from '@/components/home/hero';

interface Product {
  id: string | number;
  title: string;
  price: number;
  thumbnail: string;
  category: string;
}

export default async function Home() {
  let products: Product[] = [];

  try {
    const response = await fetch('https://dummyjson.com/products');

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const data = await response.json();
    products = data.products || [];
  } catch (error) {
    console.error('Error fetching products:', error);
  }

  const category1Products = products.filter(
    (product) => product.category === 'beauty',
  );
  const category2Products = products.filter(
    (product) => product.category === 'fragrances',
  );

  return (
    <>
      <Hero />
      <AfterHero products={category1Products} />
      <MensTops />
      <BeforeExploreCollection products={category2Products} />
      <ExploreCollection />
      <Footer />
    </>
  );
}
