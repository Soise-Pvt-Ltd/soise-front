import axios from 'axios';
import ProductsPage from './page';

export default async function UsersDashboardPage() {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BASE_URL}/products`,
      {
        headers: {
          'Cache-Control': 'no-store',
          Authorization: `Bearer ${process.env.API_KEY}`,
        },
      },
    );

    return <ProductsPage products={res.data.data} />;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw new Error('Failed to fetch products');
  }
}
