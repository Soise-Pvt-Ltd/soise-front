'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MenuIcon,
  BagIcon,
  UserIcon,
  SearchIcon,
  CloseIcon,
  ArrowUpRightIcon,
  MinusIcon,
  PlusIcon,
} from '../../icons';
import Link from 'next/link';
import Image from 'next/image';
import { EnrichedCartItem, Product } from './types';
import { logout, removeFromCart, updateCartItemQuantity } from './actions';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/lib/currency-context';

export interface Collection {
  id: string;
  name: string;
  slug?: string;
}

interface NavClientProps {
  cart: EnrichedCartItem[];
  isLoggedIn: boolean;
  collections?: Collection[];
  admin?: boolean;
}

export default function NavClient({
  cart: initialCart,
  isLoggedIn,
  collections = [],
  admin = false,
}: NavClientProps) {
  const router = useRouter();
  const { currency, setCurrency, formatPrice, isRateLoading } = useCurrency();
  const [cart, setCart] = useState<EnrichedCartItem[]>(initialCart);
  const pendingMutations = useRef(0);
  const [openMenu, setOpenMenu] = useState<
    null | 'menu' | 'search' | 'bag' | 'wishlist' | 'user'
  >(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Replace the handleSearch function:
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]); // Clear previous results

    try {
      // Use relative URL instead of environment variable
      const res = await fetch(
        `/api/products?q=${encodeURIComponent(searchQuery)}`,
      );

      if (!res.ok) {
        throw new Error('Search request failed');
      }

      const data = await res.json();
      setSearchResults(data.data || []);
    } catch (error) {
      console.error('Search failed:', error);
      // TODO: Show error toast/message to user
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (pendingMutations.current === 0) {
      setCart(initialCart);
    }
  }, [initialCart]);

  const handleRemoveItem = async (cartItemId: string) => {
    const previousCart = cart;
    pendingMutations.current++;
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
    const result = await removeFromCart(cartItemId);
    pendingMutations.current--;
    if (!result.success && pendingMutations.current === 0) {
      setCart(previousCart);
    }
    if (pendingMutations.current === 0) {
      router.refresh();
    }
  };

  const handleUpdateQuantity = async (
    cartItemId: string,
    variantId: string,
    newQuantity: number,
  ) => {
    if (newQuantity < 1) return;
    const previousCart = cart;
    pendingMutations.current++;
    setCart((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item,
      ),
    );
    const result = await updateCartItemQuantity(
      cartItemId,
      variantId,
      newQuantity,
    );
    pendingMutations.current--;
    if (!result.success && pendingMutations.current === 0) {
      setCart(previousCart);
    }
    if (pendingMutations.current === 0) {
      router.refresh();
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const subtotal = cart.reduce(
    (acc, item) => acc + (item.variantDetails?.price ?? 0) * item.quantity,
    0,
  );

  const menu_1 = collections.map((collection) => ({
    name: collection.name,
    href: `/collections/${collection.slug || collection.name.toLowerCase().replace(/\s+/g, '-')}`,
  }));

  const menu_2 = [
    ...(admin
      ? [
          {
            name: 'Dashboard',
            href: '/dashboard',
            disabled: false,
          },
        ]
      : []),
    {
      name: 'Order History',
      href: '/shop/order-history',
      disabled: !isLoggedIn,
    },
    {
      name: 'Creator Experience',
      href: '/creators',
      icon: <ArrowUpRightIcon />,
      disabled: !isLoggedIn,
    },
    {
      name: isLoggedIn ? 'Logout' : 'Sign In',
      href: isLoggedIn ? '' : '/auth/login',
      action: isLoggedIn ? handleLogout : undefined,
      disabled: false,
    },
  ];

  return (
    <>
      {/* Top Navbar */}
      <motion.nav
        className="flex items-center justify-between px-[20px] pt-[65px] pb-[40px] md:px-[40px]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-x-[18px]">
          <motion.button
            onClick={() => setOpenMenu('menu')}
            className="hover:cursor-pointer"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <MenuIcon />
          </motion.button>
          <motion.button
            onClick={() => setOpenMenu('search')}
            className="hover:cursor-pointer"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <SearchIcon />
          </motion.button>
        </div>

        <motion.div
          className="cursor-pointer"
          onClick={() => router.push('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Image src="/logo.png" alt="Soise Logo" width={100} height={58} />
        </motion.div>

        <div className="flex items-center gap-x-[18px]">
          <motion.button
            onClick={() => setOpenMenu('bag')}
            className="relative hover:cursor-pointer"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <BagIcon />
            <AnimatePresence>
              {cart.length > 0 && (
                <motion.span
                  className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 15,
                  }}
                >
                  {cart.length}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <motion.button
            onClick={() => setOpenMenu('user')}
            className="hover:cursor-pointer"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <UserIcon />
          </motion.button>
        </div>
      </motion.nav>

      {/* Panels */}
      <AnimatePresence mode="wait">
        {openMenu ? (
          <FullscreenPanel
            key={openMenu}
            openMenu={openMenu}
            onClose={() => {
              setOpenMenu(null);
              if (openMenu === 'search') {
                setSearchQuery('');
                setSearchResults([]);
              }
            }}
          >
            {openMenu === 'menu' && (
              <div className="flex min-h-full flex-col">
                <div className="space-y-[36px] px-[24px] !text-[13px] !font-medium text-[#121212]">
                  {menu_1.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.2 + index * 0.06,
                        duration: 0.4,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <Link
                        href={item.href}
                        className="inline-block transition-transform duration-200 hover:translate-x-1 hover:cursor-pointer"
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  className="mt-auto px-[24px] pt-[40px] text-[13px] text-[#121212]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  Country / Region: NG / English
                </motion.div>
              </div>
            )}

            {openMenu === 'search' && (
              <motion.div
                className="px-[24px]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <form onSubmit={handleSearch} className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search by keyword"
                    className="form-input w-full rounded-[10px] pr-16 !text-[13px] focus:border-gray-300 focus:ring-2 focus:ring-transparent focus:outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute top-1/2 right-[16px] -translate-y-1/2 !text-[13px] font-medium text-black"
                    disabled={isSearching}
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </form>
                <div className="mt-[36px] space-y-[24px] text-[13px]">
                  <AnimatePresence mode="wait">
                    {searchResults.length > 0 ? (
                      <motion.div
                        key="results"
                        className="space-y-[16px] text-[#8E8E93]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {searchResults.map((product: any, i: number) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.3 }}
                          >
                            <Link
                              href={`/shop/${product.slug}`}
                              className="block transition-colors duration-200 hover:text-black"
                              onClick={() => {
                                setOpenMenu(null);
                                setSearchQuery('');
                                setSearchResults([]);
                              }}
                            >
                              {product.name}
                            </Link>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : searchQuery && !isSearching ? (
                      <motion.div
                        key="no-results"
                        className="text-[#8E8E93]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        No results found
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {openMenu === 'bag' && (
              <div className="flex h-full flex-col px-[24px]">
                <div className="scrollbar-hide flex-1 overflow-y-auto">
                  <AnimatePresence>
                    {cart.length > 0 ? (
                      cart.map((item, i) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -30, height: 0 }}
                          transition={{
                            delay: i * 0.08,
                            duration: 0.4,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <BagItem
                            item={item}
                            onRemove={handleRemoveItem}
                            onUpdateQuantity={handleUpdateQuantity}
                          />
                        </motion.div>
                      ))
                    ) : (
                      <motion.div
                        className="text-center text-xl text-[#8E8E93]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        Your bag is empty
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <motion.div
                  className="mt-auto pt-[32px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <div className="flex justify-between !text-[12px] font-medium text-[#8E8E93] uppercase">
                    <div>Subtotal:</div>
                    <div>{formatPrice(subtotal)}</div>
                  </div>
                  <motion.button
                    className="btn_outline mt-4 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => router.push('/shop/order-summary')}
                    disabled={cart.length === 0}
                    whileHover={cart.length > 0 ? { scale: 1.02 } : {}}
                    whileTap={cart.length > 0 ? { scale: 0.98 } : {}}
                  >
                    Checkout
                  </motion.button>
                </motion.div>
              </div>
            )}

            {openMenu === 'user' && (
              <div className="flex min-h-full flex-col px-[24px] text-[#121212]">
                <div className="space-y-[43px]">
                  {menu_2.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.2 + index * 0.07,
                        duration: 0.4,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {item.action ? (
                        <button
                          onClick={item.action}
                          className="flex items-center gap-2 transition-transform duration-200 hover:translate-x-1 hover:cursor-pointer"
                        >
                          {item.name} {item.icon}
                        </button>
                      ) : item.disabled ? (
                        <div className="flex cursor-not-allowed items-center gap-2 text-[#8E8E93]">
                          {item.name} {item.icon}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className="flex items-center gap-2 transition-transform duration-200 hover:translate-x-1 hover:cursor-pointer"
                        >
                          {item.name} {item.icon}
                        </Link>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Currency toggle */}
                <div className="mt-auto flex items-center gap-x-[18px] pt-[40px]">
                  {/* Currency toggle */}
                  <motion.button
                    onClick={() =>
                      setCurrency(currency === 'NGN' ? 'USD' : 'NGN')
                    }
                    className="relative flex h-[26px] items-center rounded-full border border-[#AEAEB2] bg-white px-[3px] text-[10px] font-medium tracking-wide hover:cursor-pointer"
                    title={`Switch to ${currency === 'NGN' ? 'USD' : 'NGN'}`}
                    whileTap={{ scale: 0.93 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    aria-label={`Switch currency to ${currency === 'NGN' ? 'USD' : 'NGN'}`}
                  >
                    <motion.span
                      className="absolute top-[2px] h-[20px] w-[28px] rounded-full bg-black"
                      animate={{ left: currency === 'NGN' ? 3 : 31 }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                    <span
                      className={`relative z-10 w-[28px] text-center transition-colors duration-200 ${currency === 'NGN' ? 'text-white' : 'text-[#8E8E93]'}`}
                    >
                      ₦
                    </span>
                    <span
                      className={`relative z-10 w-[28px] text-center transition-colors duration-200 ${currency === 'USD' ? 'text-white' : 'text-[#8E8E93]'}`}
                    >
                      $
                    </span>
                  </motion.button>
                </div>
              </div>
            )}
          </FullscreenPanel>
        ) : null}
      </AnimatePresence>
    </>
  );
}

/* ---------------- HELPER COMPONENTS ---------------- */

function FullscreenPanel({ children, onClose, openMenu }: any) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div
        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        className="text-primary fixed inset-0 z-50 flex min-h-screen w-full flex-col bg-white"
        initial={{ x: openMenu === 'menu' ? '-100%' : '100%' }}
        animate={{ x: 0 }}
        exit={{ x: openMenu === 'menu' ? '-100%' : '100%' }}
        transition={{
          type: 'spring',
          damping: 28,
          stiffness: 280,
          mass: 0.8,
        }}
      >
        <div className="flex justify-between px-[24px] pt-[70px] pb-[64px]">
          <motion.div
            className="font-display text-[22px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            {openMenu === 'bag'
              ? 'Shopping Bag'
              : openMenu === 'wishlist'
                ? 'Wishlist'
                : openMenu === 'menu'
                  ? 'Collections'
                  : ''}
          </motion.div>
          <motion.button
            onClick={onClose}
            className="cursor-pointer"
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <CloseIcon />
          </motion.button>
        </div>
        <div className="flex-grow overflow-y-auto pb-[24px]">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function BagItem({
  item,
  onRemove,
  onUpdateQuantity,
}: {
  item: EnrichedCartItem;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, variantId: string, quantity: number) => void;
}) {
  const { formatPrice } = useCurrency();
  const name = item.variantDetails?.product_name ?? 'Product';
  const color = item.variantDetails?.color ?? 'N/A';
  const size = item.variantDetails?.size ?? 'N/A';
  const price = item.variantDetails?.price ?? 0;
  const image = item.variantDetails?.media?.[0]?.url;

  return (
    <div className="mb-[24px] flex h-[120px] justify-between">
      <div className="flex gap-x-[16px]">
        <div className="relative h-[120px] w-[120px] rounded-[6px] bg-[#f5f5f5]">
          {image && (
            <img
              src={image}
              alt={name}
              className="h-full w-full rounded-[6px] object-cover"
            />
          )}
        </div>
        <div className="flex w-[105px] flex-col justify-between py-[3px] text-[14px]">
          <div className="truncate font-medium text-nowrap uppercase">
            {name}
          </div>
          <div className="text-[#8E8E93]">
            <div>
              Color: <span className="uppercase">{color}</span>
            </div>
            <div>
              Size: <span className="uppercase">{size}</span>
            </div>
          </div>
          <div className="flex h-[36px] w-[96px] items-center justify-between rounded-[4px] border border-[#AEAEB2] p-[6px]">
            <button
              onClick={() =>
                onUpdateQuantity(item.id, item.variant, item.quantity - 1)
              }
              disabled={item.quantity <= 1}
              className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MinusIcon />
            </button>
            <div className="font-medium text-[#121212]">{item.quantity}</div>
            <button
              onClick={() =>
                onUpdateQuantity(item.id, item.variant, item.quantity + 1)
              }
              className="cursor-pointer"
            >
              <PlusIcon />
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-between py-[3px] text-right text-[14px]">
        <div>{formatPrice(price)}</div>
        <div
          onClick={() => onRemove(item.id)}
          className="cursor-pointer uppercase underline hover:no-underline"
        >
          Remove
        </div>
      </div>
    </div>
  );
}
