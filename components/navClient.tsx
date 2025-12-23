'use client';

import { useState, useEffect } from 'react';
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
} from './icons';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';

interface ProductVariant {
  id: string;
  price: number;
  color: string;
  size: string;
  media: { url: string; alt_text: string }[];
  product: string; // Product ID
  [key: string]: any;
}

interface CartItem {
  id: string;
  quantity: number;
  variant: string; // This is the variant ID
}

interface EnrichedCartItem {
  id: string;
  quantity: number;
  variant: string;
  variantDetails?: ProductVariant;
}
interface NavClientProps {
  variantsMap: Map<string, ProductVariant>;
  isLoggedIn: boolean;
}

export default function NavClient({
  variantsMap,
  isLoggedIn: initialIsLoggedIn,
}: NavClientProps) {
  const router = useRouter();
  const [cart, setCart] = useState<EnrichedCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [openMenu, setOpenMenu] = useState<
    null | 'menu' | 'search' | 'bag' | 'wishlist' | 'user'
  >(null);

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        // 1. Fetch Cart via our new Proxy (which handles the token server-side)
        const sessionId = sessionStorage.getItem('session_id');

        // We pass session_id as a fallback for guests.
        // The proxy will prioritize the accessToken cookie if it exists.
        const cartRes = await axios.get<{ data: CartItem[] }>('/api/cart', {
          params: {
            session_id: sessionId,
          },
        });

        if (cartRes) {
          const enrichedCart: EnrichedCartItem[] = cartRes.data.data.map(
            (item) => ({
              ...item,
              variantDetails: variantsMap.get(item.variant),
            }),
          );
          setCart(enrichedCart);
        } else {
          // If no token or session ID, the cart is empty.
          setCart([]);
        }
      } catch (error) {
        console.error('Failed to fetch cart:', error);
        setCart([]); // Set cart to empty on error
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const trending_searches = [
    'Soise',
    'Street Soise',
    'The Bally Bomber',
    'Cross Denim',
    'Stripe Hoodie',
    'Get the Bread Tea',
  ];

  const menu_1 = [
    {
      name: 'T-shirts',
      href: '',
    },
    {
      name: 'Outerwear',
      href: '',
    },
    {
      name: 'Bottoms',
      href: '',
    },
    {
      name: 'Accessories',
      href: '',
    },
  ];

  const handleLogout = async () => {
    await axios.delete('/api/checkstatus'); // Clears the httpOnly cookie
    setIsLoggedIn(false);
    setOpenMenu(null);
    router.push('/');
  };

  const menu_2 = [
    // {
    //   name: 'Wishlist',
    //   href: '/wishlist',
    // },
    {
      name: 'Order History',
      href: '/order-history',
    },
    {
      name: 'Creator Experience',
      href: '',
      icon: <ArrowUpRightIcon />,
    },
    {
      name: isLoggedIn ? 'Logout' : 'Sign In',
      href: isLoggedIn ? '' : '/signin',
      action: isLoggedIn ? handleLogout : undefined,
    },
  ];

  const subtotal = cart.reduce(
    (acc, item) => acc + (item.variantDetails?.price ?? 0) * item.quantity,
    0,
  );

  // const wishlist_items = [
  //   {
  //     name: 'Street hoodie',
  //     color: 'black',
  //     size: 'M',
  //     quantity: 1,
  //     price: 59,
  //     image: '/hoodie.png',
  //   },
  //   {
  //     name: 'Cross Denim',
  //     color: 'blue',
  //     size: 'L',
  //     quantity: 2,
  //     price: 99,
  //     image: '/crossdenim.png',
  //   },
  //   {
  //     name: 'Bally Bomber',
  //     color: 'Green',
  //     size: 'XL',
  //     quantity: 1,
  //     price: 120,
  //     image: '/ballybomber.png',
  //   },
  //   {
  //     name: 'Get the Bread Tee',
  //     color: 'White',
  //     size: 'M',
  //     quantity: 3,
  //     price: 45,
  //     image: '/getthebreadtee.png',
  //   },
  //   {
  //     name: 'Stripe Hoodie',
  //     color: 'Black/White',
  //     size: 'S',
  //     quantity: 1,
  //     price: 65,
  //     image: '/stripehoodie.png',
  //   },
  // ];

  return (
    <>
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-[20px] pt-[65px] pb-[40px] md:px-[40px]">
        <div className="flex items-center gap-x-[18px]">
          {/* Menu Open */}
          <button
            onClick={() => setOpenMenu('menu')}
            className="hover:cursor-pointer"
          >
            <MenuIcon />
          </button>

          {/* Search Open */}
          <button
            onClick={() => setOpenMenu('search')}
            className="hover:cursor-pointer"
          >
            <SearchIcon />
          </button>
        </div>

        <div className="cursor-pointer" onClick={() => router.push('/')}>
          <Image src="/logo.png" alt="Soise Logo" width={100} height={58} />
        </div>

        <div className="flex items-center gap-x-[18px]">
          {/* Bag Open */}
          <button
            onClick={() => setOpenMenu('bag')}
            className="hover:cursor-pointer"
          >
            <BagIcon />
          </button>

          <button
            onClick={() => setOpenMenu('user')}
            className="hover:cursor-pointer"
          >
            <UserIcon />
          </button>
        </div>
      </div>

      {/* ---------------- FULLSCREEN PANELS ---------------- */}

      {/* 1. Mobile Menu Panel */}
      {openMenu === 'menu' && (
        <FullscreenPanel openMenu={openMenu} onClose={() => setOpenMenu(null)}>
          <div className="flex min-h-full flex-col">
            <div className="space-y-[36px] px-[24px] !text-[13px] !font-medium text-[#121212] uppercase">
              {menu_1.map((item, index) =>
                item.name === 'Wishlist' ? (
                  <div key={index}>
                    <button
                      onClick={() => setOpenMenu('wishlist')}
                      className="hover:cursor-pointer"
                    >
                      {item.name}
                    </button>
                  </div>
                ) : (
                  <div key={index}>
                    <Link href={item.href} className="hover:cursor-pointer">
                      {item.name}
                    </Link>
                  </div>
                ),
              )}
            </div>
            <div className="mt-auto px-[24px] pt-[40px] text-[13px] text-[#121212]">
              Country / Region: NG / English
            </div>
          </div>
        </FullscreenPanel>
      )}

      {/* 2. Search Panel */}
      {openMenu === 'search' && (
        <FullscreenPanel openMenu={openMenu} onClose={() => setOpenMenu(null)}>
          <div className="px-[24px]">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search by keyword"
                className="form-input w-full rounded-[10px] pr-16 !text-[13px]"
              />
              <button className="absolute top-1/2 right-[16px] -translate-y-1/2 !text-[13px] font-medium text-black">
                Search
              </button>
            </div>

            <div className="mt-[36px] space-y-[24px] text-[13px]">
              <div className="font-medium text-[#121212]">
                Trending Searches
              </div>
              <div className="space-y-[16px] text-[#8E8E93]">
                {trending_searches.map((item, index) => (
                  <div key={index}>{item}</div>
                ))}
              </div>
            </div>
          </div>
        </FullscreenPanel>
      )}

      {/* 3. Bag Panel */}
      {openMenu === 'bag' && (
        <FullscreenPanel openMenu={openMenu} onClose={() => setOpenMenu(null)}>
          <div className="flex h-full flex-col px-[24px]">
            <div className="scrollbar-hide overflow-y-auto">
              {cart.length > 0 ? (
                cart.map((item) => <BagItem key={item.id} item={item} />)
              ) : (
                <div className="flex-col items-center justify-center text-center text-xl text-[#8E8E93]">
                  Your bag is empty
                </div>
              )}
            </div>

            <div className="mt-auto pt-[32px]">
              <div className="flex justify-between !text-[12px] font-medium text-[#8E8E93] uppercase">
                <div>Subtotal:</div>
                <div>${subtotal.toFixed(2)}</div>
              </div>
              <div className="mt-[7.5px] flex justify-between !text-[14px] font-medium text-[#121212] uppercase">
                <div>Total:</div>
                <div>${subtotal.toFixed(2)}</div>
              </div>
              <button className="btn_outline mt-4">Checkout</button>
            </div>
          </div>
        </FullscreenPanel>
      )}

      {/* 4. Wishlist */}
      {/* {openMenu === 'wishlist' && (
        <FullscreenPanel openMenu={openMenu} onClose={() => setOpenMenu(null)}>
          <div className="flex h-full flex-col px-[24px]">
            <div className="scrollbar-hide overflow-y-auto">
              {wishlist_items.length > 0 ? (
                wishlist_items.map((item, index) => (
                  <WishlistItem key={index} item={item} />
                ))
              ) : (
                <div className="flex-col items-center justify-center text-center text-xl text-[#8E8E93]">
                  Your wishlist is empty
                </div>
              )}
            </div>

            <div className="mt-auto pt-[32px]">
              <div className="text-center uppercase">
                <div>{wishlist_items.length} items in wishlist</div>
              </div>

              <button
                className="btn_outline mt-[24px]"
                onClick={() => router.push('/wishlist')}
              >
                view wishlist
              </button>
            </div>
          </div>
        </FullscreenPanel>
      )} */}

      {/* 5. User Panel */}
      {openMenu === 'user' && (
        <FullscreenPanel openMenu={openMenu} onClose={() => setOpenMenu(null)}>
          <div className="space-y-[43px] px-[24px] text-[#121212]">
            {menu_2.map((item, index) => (
              <div key={index}>
                {item.action ? (
                  <button
                    onClick={item.action}
                    className="flex items-center gap-2 hover:cursor-pointer"
                  >
                    {item.name} {item.icon}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 hover:cursor-pointer"
                  >
                    {item.name} {item.icon}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </FullscreenPanel>
      )}
    </>
  );
}

/* ---------------- COMPONENT: Fullscreen Wrapper ---------------- */
function FullscreenPanel({ children, onClose, openMenu }: any) {
  return (
    <div className="text-primary fixed inset-0 z-50 flex min-h-screen w-full flex-col bg-white">
      {/* Panel Header */}
      <div className="flex justify-between px-[24px] pt-[70px] pb-[64px]">
        <div className="font-display text-[22px]">
          {(openMenu === 'bag' && 'Shopping Bag') ||
            (openMenu === 'wishlist' && 'Wishlist')}
        </div>
        <button onClick={onClose} className="cursor-pointer">
          <CloseIcon />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-grow overflow-y-auto pb-[24px]">{children}</div>
    </div>
  );
}

function BagItem({ item }: { item: EnrichedCartItem }) {
  // Fallback values for when variant details are not available
  const name = item.variantDetails?.product_name ?? 'Product Name Missing';
  const color = item.variantDetails?.color ?? 'N/A';
  const size = item.variantDetails?.size ?? 'N/A';
  const price = item.variantDetails?.price ?? 0;
  const image = item.variantDetails?.media?.[0]?.url;
  const altText = item.variantDetails?.media?.[0]?.alt_text ?? name;

  return (
    <div className="mb-[24px] flex h-[120px] justify-between">
      <div className="flex gap-x-[16px]">
        <div className="relative h-[120px] w-[100px] rounded-[6px] bg-[#f5f5f5]">
          {image && (
            <Image
              src={image}
              alt={altText}
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-[6px]"
            />
          )}
        </div>
        <div className="flex w-[105px] flex-col justify-between py-[3px] text-[14px]">
          <div className="flex-wrap font-medium uppercase">{name}</div>
          <div className="text-[#8E8E93]">
            <div>
              Color: <span className="uppercase">{color}</span>
            </div>
            <div>
              Size: <span className="uppercase">{size}</span>
            </div>
          </div>
          <div className="flex h-[36px] w-[96px] items-center justify-between rounded-[4px] border border-[#AEAEB2] p-[6px]">
            <MinusIcon />
            <div className="font-medium text-[#121212]">{item.quantity}</div>
            <PlusIcon />
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-between py-[3px] text-right text-[14px]">
        <div>${price.toFixed(2)}</div>
        <div className="cursor-pointer uppercase underline hover:no-underline">
          Remove
        </div>
      </div>
    </div>
  );
}

// function WishlistItem({ item }: any) {
//   return (
//     <div className="mb-[24px] flex h-[120px] justify-between">
//       <div className="flex gap-x-[16px]">
//         <div className="relative h-[120px] w-[100px] rounded-[6px] bg-[#f5f5f5]">
//           <Image
//             src={item.image}
//             alt={item.name}
//             fill
//             style={{ objectFit: 'cover' }}
//             className="rounded-[6px]"
//           />
//         </div>
//         <div className="flex w-[105px] flex-col py-[3px] text-[14px]">
//           <div className="flex-wrap pb-[16px] font-medium uppercase">
//             {item.name}
//           </div>
//           <div className="text-[#8E8E93]">
//             <div>
//               Color: <span className="uppercase">{item.color}</span>
//             </div>
//             <div>
//               Size: <span className="uppercase">{item.size}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//       <div className="flex flex-col justify-between py-[3px] text-right text-[14px]">
//         <div>${item.price}</div>
//         <div className="cursor-pointer uppercase underline hover:no-underline">
//           Remove
//         </div>
//       </div>
//     </div>
//   );
// }
