import { create } from 'zustand';

interface Item {
  _id: string;
  quantity: number;
  // Add any other fields your item has:
  [key: string]: any;
}

interface StoreState {
  items: Item[];

  addItem: (item: Omit<Item, 'quantity'>, qty: number) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  deleteItem: (id: string) => void;

  searchValue: string;
  setSearchValue: (text: string) => void;
}

const useStore = create<StoreState>((set) => ({
  items: [],

  addItem: (newItem, qty) =>
    set((state) => {
      const exists = state.items.some((item) => item._id === newItem._id);

      if (exists) {
        return {
          items: state.items.map((item) =>
            item._id === newItem._id
              ? { ...item, quantity: item.quantity + qty }
              : item,
          ),
        };
      }

      return {
        items: [...state.items, { ...newItem, quantity: qty || 1 }],
      };
    }),

  incrementQuantity: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item._id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    })),

  decrementQuantity: (id) =>
    set((state) => ({
      items: state.items
        .map((item) =>
          item._id === id && item.quantity > 1
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    })),

  deleteItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item._id !== id),
    })),

  searchValue: '',
  setSearchValue: (value) => set({ searchValue: value }),
}));

export default useStore;
