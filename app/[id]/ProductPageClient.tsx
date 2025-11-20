"use client";

import { useState } from "react";

export interface ProductDetail {
  id: number;
  title: string;
  description: string;
  price: number;
}

export default function ProductPageClient({ product }: { product: ProductDetail | null }) {
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return <div>Product not found.</div>;
  }

  return (
    <>
      <h1>{product.title}</h1>
      <p>{product.description}</p>
      <p>Price: ${product.price}</p>
      <div className="flex items-center space-x-2">
        Quantity: {quantity}
        <button onClick={() => setQuantity(q => q + 1)} className="ml-2 px-3 py-1 border rounded-md bg-gray-100 hover:bg-gray-200">+</button>
        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-1 border rounded-md bg-gray-100 hover:bg-gray-200">-</button>
      </div>
    </>
  );
}