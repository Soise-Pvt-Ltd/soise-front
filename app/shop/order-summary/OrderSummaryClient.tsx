'use client';

import { useState } from 'react';
import { Toaster } from 'sonner';
import { ArrowUpIcon } from '@/components/icons';
import Footer from '@/components/footer';
import { EnrichedCartItem } from '@/components/home/nav/types';
import { checkoutAction, applyDiscountCodeAction } from './actions';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast, validateField } from '@/lib/toast-utils';
import { useCurrency } from '@/lib/currency-context';

interface OrderSummaryClientProps {
  cart: EnrichedCartItem[];
  isLoggedIn: boolean;
}

const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

export default function OrderSummaryClient({
  cart,
  isLoggedIn,
}: OrderSummaryClientProps) {
  const { formatPrice, currency } = useCurrency();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(true);

  // Creator code states
  const [discountCode, setDiscountCode] = useState('');
  const [discountPending, setDiscountPending] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [finalTotal, setFinalTotal] = useState<number | null>(null);
  const [discountData, setDiscountData] = useState<any>(null);
  const [apiSubtotal, setApiSubtotal] = useState<number | null>(null);
  const [showSavingsPulse, setShowSavingsPulse] = useState(false);

  const calculatedSubtotal = cart.reduce(
    (acc, item) => acc + (item.variantDetails?.price ?? 0) * item.quantity,
    0,
  );

  // Use API subtotal if discount applied, otherwise use calculated subtotal
  const subtotal = apiSubtotal !== null ? apiSubtotal : calculatedSubtotal;

  // Use final_total from API if available, otherwise calculate manually
  const total = finalTotal !== null ? finalTotal : subtotal - appliedDiscount;

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    if (discountData?.code) {
      formData.set('creator_code', discountData.code);
    }

    const toastId = showToast.loading('Processing your order...');

    try {
      const result = await checkoutAction(formData);

      showToast.dismiss(toastId);

      if (result && !result.success) {
        showToast.error(result.error || 'Checkout failed. Please try again.');
        setError(result.error || 'Checkout failed');
        setPending(false);
      } else {
        showToast.success('Order placed successfully! Redirecting...');
      }
    } catch (err) {
      showToast.dismiss(toastId);
      showToast.error('An error occurred during checkout. Please try again.');
      setError('An unexpected error occurred');
      setPending(false);
      console.error('Checkout error:', err);
    }
  }

  async function handleApplyDiscount(e: React.FormEvent) {
    e.preventDefault();

    const codeError = validateField(discountCode, 'Creator code', {
      required: true,
      minLength: 3,
    });

    if (codeError) {
      showToast.error(codeError);
      return;
    }

    setDiscountPending(true);

    const toastId = showToast.loading('Applying creator code...');

    try {
      const result = await applyDiscountCodeAction(discountCode);

      showToast.dismiss(toastId);

      if (result.success) {
        showToast.success(
          result.message || 'Creator code applied successfully!',
        );

        const data = result.data ?? {};
        const base = data.subtotal ?? calculatedSubtotal;

        if (data.subtotal !== undefined) {
          setApiSubtotal(data.subtotal);
        }

        const discountAmt =
          data.discount_amount !== undefined
            ? data.discount_amount
            : data.discount_percentage !== undefined
              ? (base * data.discount_percentage) / 100
              : 0;

        const computedTotal =
          data.final_total !== undefined
            ? data.final_total
            : base - discountAmt;

        // Always store applied code — use entered code as fallback if API doesn't echo it back
        setDiscountData({ ...data, code: data.code || discountCode });
        setAppliedDiscount(discountAmt);
        setFinalTotal(computedTotal);
        setDiscountCode('');
        setShowSavingsPulse(true);
        setTimeout(() => setShowSavingsPulse(false), 1200);
      } else {
        showToast.error(
          result.error ||
            'Failed to apply creator code. Please check and try again.',
        );
      }
    } catch (err) {
      showToast.dismiss(toastId);
      showToast.error('An error occurred while applying the discount.');
      console.error('Discount error:', err);
    } finally {
      setDiscountPending(false);
    }
  }

  function handleRemoveCode() {
    setDiscountData(null);
    setAppliedDiscount(0);
    setFinalTotal(null);
    setApiSubtotal(null);
  }

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
    if (value.length <= 11) {
      e.target.value = value;
    } else {
      e.target.value = value.slice(0, 11);
    }
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="mx-auto md:max-w-7xl">
        <div className="pb-[50px]">
          <motion.div
            className="flex items-center justify-between border-y border-[#AEAEB2] px-[20px] py-[25px]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-x-2 text-[10px] uppercase">
              Order Summary{' '}
              <motion.div
                onClick={() => setShow(!show)}
                className="cursor-pointer"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                animate={{ rotate: show ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowUpIcon />
              </motion.div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={total}
                className="text-[16px] font-medium"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
              >
                {formatPrice(total)}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {show && (
              <motion.div
                className="mt-[24px] space-y-[24px]"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: 'hidden' }}
              >
                {cart.length > 0 ? (
                  cart.map((item, index) => (
                    <OrderSummaryItem
                      key={item.id || index}
                      item={item}
                      index={index}
                    />
                  ))
                ) : (
                  <motion.div
                    className="flex-col items-center justify-center text-center text-xl text-[#8E8E93]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    No orders
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-[20px]">
          {/* Code input — hidden when a code is already active */}
          <AnimatePresence mode="wait">
            {!discountData ? (
              <motion.form
                key="code-input"
                onSubmit={handleApplyDiscount}
                className="flex gap-x-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  type="text"
                  className="outlined w-full uppercase focus:border-gray-500 focus:ring-[#AEAEB2] md:w-fit"
                  placeholder="Creator code"
                  value={discountCode}
                  onChange={(e) =>
                    setDiscountCode(e.target.value.toUpperCase())
                  }
                  disabled={discountPending}
                />
                <button
                  type="submit"
                  className="btn_black !w-fit !px-10"
                  disabled={
                    discountPending || !discountCode.trim() || cart.length === 0
                  }
                >
                  {discountPending ? 'applying...' : 'apply'}
                </button>
              </motion.form>
            ) : (
              /* Applied code tag */
              <motion.div
                key="code-tag"
                className="flex items-center justify-between rounded-[10px] border border-[#CCEAD6] bg-[#F5FCF7] px-[14px] py-[10px]"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-x-2 text-[12px]">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="7" fill="#32AC5B" />
                    <path
                      d="M4 7l2 2 4-4"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="font-medium tracking-widest text-[#32AC5B] uppercase">
                    {discountData.code}
                  </span>
                  {discountData.discount_percentage > 0 && (
                    <span className="rounded-full bg-[#CCEAD6] px-[8px] py-[2px] text-[10px] font-medium text-[#32AC5B]">
                      -{discountData.discount_percentage}%
                    </span>
                  )}
                </div>
                <button
                  onClick={handleRemoveCode}
                  className="text-[11px] text-[#8E8E93] underline transition-colors hover:text-[#121212]"
                  type="button"
                >
                  Remove
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Savings callout — appears after code applied */}
          <AnimatePresence>
            {discountData && appliedDiscount > 0 && (
              <motion.div
                className="mt-[12px] flex items-center gap-x-2 rounded-[10px] bg-[#CCEAD6] px-[14px] py-[12px] text-[#32AC5B]"
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 1l1.8 3.6L14 5.4l-3 2.9.7 4.1L8 10.6l-3.7 1.8.7-4.1-3-2.9 4.2-.8L8 1z"
                    fill="#32AC5B"
                  />
                </svg>
                <div className="flex-1">
                  <span className="text-[13px] font-semibold">
                    You saved {formatPrice(appliedDiscount)}
                  </span>
                  {discountData.creator?.username && (
                    <span className="ml-1 text-[12px] opacity-75">
                      · code by @{discountData.creator.username}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-[24px] uppercase">
            <div className="flex items-center justify-between text-[12px] text-[#8E8E93]">
              <div>Subtotal</div>
              <div>{formatPrice(subtotal)}</div>
            </div>
            <AnimatePresence>
              {appliedDiscount > 0 && (
                <motion.div
                  className="flex items-center justify-between pt-[8px] text-[12px] text-green-600"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div>Discount</div>
                  <div>-{formatPrice(appliedDiscount)}</div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center justify-between pt-[12px] text-[14px] font-medium text-[#121212]">
              <div>Total</div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={total}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.25 }}
                  className={showSavingsPulse ? 'text-green-600' : ''}
                >
                  {formatPrice(total)}
                </motion.div>
              </AnimatePresence>
            </div>
            {currency === 'USD' && (
              <p className="mt-[8px] text-[10px] text-[#8E8E93] normal-case">
                * Displayed in USD for reference. Payment is processed in NGN.
              </p>
            )}
          </div>
        </div>

        <div className="my-[24px] border-t border-[#AEAEB2]"></div>
        {cart.length > 0 && (
          <div className="px-[20px]">
            <form action={handleSubmit} className="mb-[36px]">
              <div>
                <h1 className="text-[16px] font-bold uppercase">Delivery</h1>

                {error && (
                  <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
                    {error}
                  </div>
                )}

                <div className="mt-[24px] mb-[18px] space-y-[10px]">
                  {!isLoggedIn && (
                    <input
                      type="email"
                      name="email"
                      className="solid"
                      placeholder="Email address"
                      required
                    />
                  )}
                  <select name="country" className="solid" required>
                    <option value="">Select Country</option>
                    <option value="Nigeria">Nigeria</option>
                  </select>
                  <input
                    type="text"
                    name="firstName"
                    className="solid"
                    placeholder="First Name"
                    required
                  />
                  <input
                    type="text"
                    name="lastName"
                    className="solid"
                    placeholder="Last Name"
                    required
                  />
                  <input
                    type="text"
                    name="address"
                    className="solid"
                    placeholder="Address"
                    required
                  />
                  <input
                    type="text"
                    name="city"
                    className="solid"
                    placeholder="City"
                    required
                  />
                  <select name="state" className="solid" required>
                    <option value="">Select State</option>
                    {NIGERIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="zipCode"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="ZIP code"
                    className="solid"
                    required
                    onInput={(e: any) => {
                      e.target.value = e.target.value.replace(/\D/g, '');
                    }}
                  />

                  <input
                    type="tel"
                    name="phone"
                    className="solid"
                    placeholder="Phone (max 11 digits)"
                    required
                    maxLength={11}
                    pattern="[0-9]{1,11}"
                    onInput={handlePhoneInput}
                  />
                </div>

                <button
                  type="submit"
                  className="btn_black"
                  disabled={pending || cart.length === 0}
                >
                  {pending ? 'Processing...' : 'pay now'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

function OrderSummaryItem({
  item,
  index = 0,
}: {
  item: EnrichedCartItem;
  index?: number;
}) {
  const { formatPrice } = useCurrency();
  const name = item.variantDetails?.product_name ?? 'Product';
  const color = item.variantDetails?.color ?? 'N/A';
  const size = item.variantDetails?.size ?? 'N/A';
  const price = item.variantDetails?.price ?? 0;
  const image = item.variantDetails?.media?.[0]?.url;

  return (
    <motion.div
      className="h-[120px] px-[20px]"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className="flex w-full justify-between gap-x-[16px]">
        <div className="relative h-[120px] w-[100px] rounded-[6px] bg-[#f5f5f5]">
          <div className="flex justify-between">
            <div></div>
            <div className="z-10 m-[8px] flex h-[18px] w-[18px] items-center justify-center rounded-[4px] bg-[#121212] text-center text-[12px] text-white">
              {item.quantity}
            </div>
          </div>
          {image && (
            <img
              src={image}
              alt={name}
              className="absolute inset-0 h-full w-full rounded-[6px] object-cover"
            />
          )}
        </div>
        <div className="flex w-full justify-between">
          <div className="flex flex-col py-[3px] text-[14px]">
            <div className="flex-wrap pb-[16px] font-medium uppercase">
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
          </div>
          <div className="flex flex-col justify-between py-[3px] text-right text-[14px]">
            <div>{formatPrice(price)}</div>
            <motion.div
              className="cursor-pointer uppercase underline hover:no-underline"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Remove
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
