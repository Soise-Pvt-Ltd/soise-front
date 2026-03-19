export type Product = {
  id: number;
  title: string;
  price: number;
  category: string;
  thumbnail: string;
  // Add any other properties from the API you might need
  [key: string]: any;
};
