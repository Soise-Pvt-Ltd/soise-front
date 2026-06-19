'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
import { showToast } from '@/lib/toast-utils';

export interface Collection {
  id: string;
  name: string;
  slug?: string;
}

// Shared nav icon-button styling: ≥44×44 tap target + focus-visible ring.
const NAV_BTN =
  'grid h-11 w-11 place-items-center rounded-full hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2 focus-visible:outline-none';

// Shared focus-visible ring for menu links inside panels.
const LINK_FOCUS =
  'rounded-[4px] focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2 focus-visible:outline-none';

interface NavClientProps {
  cart: EnrichedCartItem[];
  isLoggedIn: boolean;
  collections?: Collection[];
  admin?: boolean;
  storeCredit?: number | null;
}

export default function NavClient({
  cart: initialCart,
  isLoggedIn,
  collections = [],
  admin = false,
  storeCredit = null,
}: NavClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currency, setCurrency, formatPrice, isRateLoading } = useCurrency();
  const [cart, setCart] = useState<EnrichedCartItem[]>(initialCart);
  const pendingMutations = useRef(0);
  const [openMenu, setOpenMenu] = useState<
    null | 'menu' | 'search' | 'bag' | 'wishlist' | 'user'
  >(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // Tracks whether a search has been submitted at least once, so we only show
  // the "no results" message after an actual query — not before the user searches.
  const [hasSearched, setHasSearched] = useState(false);

  // Remember the trigger that opened the active panel so we can return focus to
  // it on close (a11y: focus should not be lost to <body>).
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Active-link detection. hrefs may carry query strings (e.g. collection
  // filters), so compare on the pathname portion only.
  const isActive = (href: string) => {
    if (!href) return false;
    const target = href.split('?')[0];
    if (target === '/') return pathname === '/';
    return pathname === target || pathname.startsWith(`${target}/`);
  };

  const closePanel = () => {
    setOpenMenu(null);
    if (openMenu === 'search') {
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
    }
    // Return focus to whatever opened the panel.
    triggerRef.current?.focus();
  };

  // Body scroll lock while any fullscreen panel is open. Restores the prior
  // value on close/unmount so we never clobber styles set elsewhere.
  useEffect(() => {
    if (!openMenu) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [openMenu]);

  // Escape closes the active panel.
  useEffect(() => {
    if (!openMenu) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closePanel();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // closePanel reads openMenu/search state via closure; re-bind when panel changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openMenu]);

  // Replace the handleSearch function:
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
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
      showToast.error('Search failed. Please try again.');
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

  // Total number of units in the bag (sum of quantities), not distinct lines —
  // a single item with quantity 5 should show "5" on the badge, not "1".
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const menu_1 = collections.map((collection) => ({
    name: collection.name,
    // Route to the product listing pre-filtered by collection name (the
    // listing groups by collection.name). There is no /collections/[slug] route.
    href: `/shop/product-listing?collection=${encodeURIComponent(collection.name)}`,
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
      name: 'Wishlist',
      href: '/shop/wishlist',
      disabled: !isLoggedIn,
    },
    {
      name: 'Creator Experience',
      href: '/creators',
      icon: <ArrowUpRightIcon />,
      disabled: !isLoggedIn,
    },
    {
      name: 'Invite & Earn',
      href: '/swaz-loop',
      // Show the live store-credit balance as a badge when the user has any —
      // a constant reminder that they accumulate spendable credit.
      badge:
        isLoggedIn && typeof storeCredit === 'number' && storeCredit > 0
          ? `₦${Math.round(storeCredit).toLocaleString('en-NG')}`
          : undefined,
      disabled: false,
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
        <div className="flex items-center gap-x-[6px]">
          <motion.button
            type="button"
            onClick={(e) => {
              triggerRef.current = e.currentTarget;
              setOpenMenu('menu');
            }}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={openMenu === 'menu'}
            aria-controls="nav-panel"
            className={NAV_BTN}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <MenuIcon />
          </motion.button>
          <motion.button
            type="button"
            onClick={(e) => {
              triggerRef.current = e.currentTarget;
              setOpenMenu('search');
            }}
            aria-label="Search"
            aria-haspopup="dialog"
            aria-expanded={openMenu === 'search'}
            aria-controls="nav-panel"
            className={NAV_BTN}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <SearchIcon />
          </motion.button>
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Link
            href="/"
            aria-label="Soise home"
            className="inline-block rounded-[6px] focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Image src="/logo.png" alt="Soise Logo" width={100} height={58} />
          </Link>
        </motion.div>

        <div className="flex items-center gap-x-[6px]">
          <motion.button
            type="button"
            onClick={(e) => {
              triggerRef.current = e.currentTarget;
              setOpenMenu('bag');
            }}
            aria-label={`Bag, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
            aria-haspopup="dialog"
            aria-expanded={openMenu === 'bag'}
            aria-controls="nav-panel"
            className={`relative ${NAV_BTN}`}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <BagIcon />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  aria-live="polite"
                  className="pointer-events-none absolute -top-2 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black px-[5px] text-[10px] leading-none font-medium text-white tabular-nums"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 15,
                  }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <motion.button
            type="button"
            onClick={(e) => {
              triggerRef.current = e.currentTarget;
              setOpenMenu('user');
            }}
            aria-label="Account menu"
            aria-haspopup="dialog"
            aria-expanded={openMenu === 'user'}
            aria-controls="nav-panel"
            className={NAV_BTN}
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
            onClose={closePanel}
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
                        aria-current={isActive(item.href) ? 'page' : undefined}
                        onClick={closePanel}
                        className={`inline-block transition-transform duration-200 hover:translate-x-1 hover:cursor-pointer aria-[current=page]:underline aria-[current=page]:underline-offset-4 ${LINK_FOCUS}`}
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
                <form
                  onSubmit={handleSearch}
                  role="search"
                  aria-busy={isSearching}
                  className="relative w-full"
                >
                  <input
                    type="search"
                    enterKeyHint="search"
                    placeholder="Search by keyword"
                    aria-label="Search products"
                    aria-controls="nav-search-results"
                    className="form-input w-full rounded-[10px] pr-24 !text-[13px] focus:border-gray-300 focus:ring-2 focus:ring-transparent focus:outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="submit"
                    aria-label="Search"
                    className={`absolute top-1/2 right-[12px] flex -translate-y-1/2 items-center gap-1.5 rounded-[6px] px-2 py-1 !text-[13px] font-medium text-black disabled:opacity-50 ${LINK_FOCUS}`}
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching && (
                      <motion.span
                        aria-hidden="true"
                        className="block h-3 w-3 rounded-full border-[1.5px] border-[#AEAEB2] border-t-black"
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.7,
                          ease: 'linear',
                        }}
                      />
                    )}
                    {isSearching ? 'Searching…' : 'Search'}
                  </button>
                </form>
                <div
                  id="nav-search-results"
                  role="region"
                  aria-live="polite"
                  className="mt-[36px] space-y-[24px] text-[13px]"
                >
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
                              href={`/shop/product-listing/${product.slug}`}
                              className={`block transition-colors duration-200 hover:text-black ${LINK_FOCUS}`}
                              onClick={() => {
                                setOpenMenu(null);
                                setSearchQuery('');
                                setSearchResults([]);
                                setHasSearched(false);
                              }}
                            >
                              {product.name}
                            </Link>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : isSearching ? (
                      <motion.div
                        key="searching"
                        className="text-[#8E8E93]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        Searching…
                      </motion.div>
                    ) : hasSearched && searchQuery ? (
                      <motion.div
                        key="no-results"
                        className="text-[#8E8E93]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        No results found for “{searchQuery.trim()}”. Try a
                        different keyword.
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
                          type="button"
                          onClick={item.action}
                          className={`flex items-center gap-2 transition-transform duration-200 hover:translate-x-1 hover:cursor-pointer ${LINK_FOCUS}`}
                        >
                          {item.name} {item.icon}
                        </button>
                      ) : item.disabled ? (
                        <div
                          aria-disabled="true"
                          className="flex cursor-not-allowed items-center gap-2 text-[#8E8E93]"
                        >
                          {item.name} {item.icon}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          aria-current={
                            isActive(item.href) ? 'page' : undefined
                          }
                          onClick={closePanel}
                          className={`flex items-center gap-2 transition-transform duration-200 hover:translate-x-1 hover:cursor-pointer aria-[current=page]:underline aria-[current=page]:underline-offset-4 ${LINK_FOCUS}`}
                        >
                          {item.name} {item.icon}
                          {'badge' in item && item.badge ? (
                            <span
                              aria-live="polite"
                              className="rounded-full bg-[#CCEAD6] px-[8px] py-[2px] text-[10px] font-medium text-[#32AC5B]"
                            >
                              {item.badge}
                            </span>
                          ) : null}
                        </Link>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Currency toggle */}
                <div className="mt-auto flex items-center gap-x-[18px] pt-[40px]">
                  {/* Currency toggle */}
                  <motion.button
                    type="button"
                    onClick={() =>
                      setCurrency(currency === 'NGN' ? 'USD' : 'NGN')
                    }
                    className="relative flex h-[26px] items-center rounded-full border border-[#AEAEB2] bg-white px-[3px] text-[10px] font-medium tracking-wide hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2 focus-visible:outline-none"
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

type PanelKey = 'menu' | 'search' | 'bag' | 'wishlist' | 'user';

const PANEL_TITLES: Record<PanelKey, string> = {
  menu: 'Collections',
  search: 'Search',
  bag: 'Shopping Bag',
  wishlist: 'Wishlist',
  user: 'Account',
};

function FullscreenPanel({
  children,
  onClose,
  openMenu,
}: {
  children: React.ReactNode;
  onClose: () => void;
  openMenu: PanelKey;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const title = PANEL_TITLES[openMenu] ?? 'Menu';

  // Move focus to the close button when the panel mounts (a11y: focus should
  // enter the dialog). NavClient returns focus to the trigger on close.
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Simple focus trap: keep Tab / Shift+Tab cycling within the panel.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const root = panelRef.current;
    if (!root) return;

    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    if (focusable.length === 0) {
      e.preventDefault();
      closeButtonRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey) {
      if (active === first || !root.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last) {
      e.preventDefault();
      first.focus();
    }
  };

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
        ref={panelRef}
        id="nav-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={handleKeyDown}
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
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-11 w-11 place-items-center rounded-full focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2 focus-visible:outline-none"
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
        <div className="relative h-[120px] w-[120px] overflow-hidden rounded-[6px] bg-[#f5f5f5]">
          {image && (
            // Remote product image URLs are not whitelisted in next.config
            // (no remotePatterns), so next/image would reject them. Keep the
            // native <img> but lazy-load + async-decode it to ease the panel.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={name}
              loading="lazy"
              decoding="async"
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
              type="button"
              onClick={() =>
                onUpdateQuantity(item.id, item.variant, item.quantity - 1)
              }
              disabled={item.quantity <= 1}
              aria-label={`Decrease quantity of ${name}`}
              className="grid h-6 w-6 cursor-pointer place-items-center rounded-[3px] focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MinusIcon />
            </button>
            <div className="font-medium text-[#121212] tabular-nums" aria-live="polite">
              {item.quantity}
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateQuantity(item.id, item.variant, item.quantity + 1)
              }
              aria-label={`Increase quantity of ${name}`}
              className="grid h-6 w-6 cursor-pointer place-items-center rounded-[3px] focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:outline-none"
            >
              <PlusIcon />
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-between py-[3px] text-right text-[14px]">
        <div>{formatPrice(price)}</div>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${name} from bag`}
          className="cursor-pointer rounded-[3px] text-right uppercase underline hover:no-underline focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:outline-none"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
