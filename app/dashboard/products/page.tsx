import ProductsPage from './productsClient';
import { fetchProducts } from './actions';

export default async function ProductsDashboardPage() {
  const { products, collections, user, meta } = await fetchProducts();

  return (
    <ProductsPage
      products={products?.data}
      collections={collections?.data}
      user={user}
      initialMeta={meta}
      fetchServerData={fetchProducts}
    />
  );
}
