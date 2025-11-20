"use client";

import Link from "next/link";

export interface Product {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
}

export default function ProductListingClient({ products }: { products: Product[] }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-center my-8">Product Listing Page</h1>
      <div className="flex flex-wrap gap-5 justify-center p-5">
        {products.map((product) => (
          <Link href={`/${product.id}`} key={product.id} className="no-underline text-inherit">
            <div className="border border-gray-300 p-4 rounded-lg w-56 text-center shadow-md hover:shadow-lg transition-shadow duration-200">
              <img src={product.thumbnail} alt={product.title} className="w-full h-36 object-cover rounded mb-3" />
              <h2 className="text-lg font-semibold my-2">{product.title}</h2>
              <p className="font-bold text-gray-800">${product.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}