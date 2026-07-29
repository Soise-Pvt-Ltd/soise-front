'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { ArrowUpIcon } from '@/components/icons';
import Footer from '@/components/footer';
import { EnrichedCartItem } from '@/components/home/nav/types';
import {
  cancelPendingOrderAction,
  captureCartEmailAction,
  checkoutAction,
  applyDiscountCodeAction,
  resumePaymentAction,
} from './actions';
import { removeFromCart } from '@/components/home/nav/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast, validateField } from '@/lib/toast-utils';
import { useCurrency } from '@/lib/currency-context';
import { PENDING_CREATOR_CODE_COOKIE } from '@/components/RefCapture';
import { openInlineCheckout } from '@/lib/paystack-inline';
import {
  readPendingOrder,
  writePendingOrder,
  clearPendingOrder,
} from './pending-order';
import {
  SHIPPING_COUNTRIES,
  NIGERIAN_STATES,
  DEFAULT_COUNTRY,
  isDomestic,
} from '@/lib/countries';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function clearCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

interface SavedAddress {
  id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone?: string;
  is_default?: boolean;
}

interface OrderSummaryClientProps {
  cart: EnrichedCartItem[];
  isLoggedIn: boolean;
  storeCredit?: number;
  // A referred buyer who hasn't completed a first paid order yet still has a
  // one-time welcome credit pending. Surfaced as a gentle nudge at checkout.
  welcomeCreditPending?: boolean;
  welcomeCreditAmount?: number;
  savedAddresses?: SavedAddress[];
  defaultAddressId?: string | null;
  prefillFirstName?: string;
  prefillLastName?: string;
  prefillPhone?: string;
  // The cart fetch failed (vs. genuinely empty) — render a retry, not an
  // empty-bag message that reads as "we lost your cart".
  cartLoadFailed?: boolean;
  // Only set when the backend actually charges shipping. Shown as its own line
  // so the total here matches what Paystack collects.
  shippingFee?: number | null;
}

/**
 * A labelled form field.
 *
 * Every checkout input used to be placeholder-only. Placeholders disappear the
 * moment someone types, so a half-filled form gives no clue what each box was
 * for — and screen readers get no accessible name at all. The label is real and
 * stays put.
 */
function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <label
        htmlFor={htmlFor}
        className="mb-[6px] block text-[12px] font-medium text-[#35373C] normal-case"
      >
        {label}
        {hint && (
          <span className="ml-[6px] font-normal text-[#8E8E93]">{hint}</span>
        )}
      </label>
      {children}
    </div>
  );
}

export default function OrderSummaryClient({
  cart,
  isLoggedIn,
  storeCredit = 0,
  welcomeCreditPending = false,
  welcomeCreditAmount = 1000,
  savedAddresses = [],
  defaultAddressId = null,
  prefillFirstName = '',
  prefillLastName = '',
  prefillPhone = '',
  cartLoadFailed = false,
  shippingFee = null,
}: OrderSummaryClientProps) {
  const { formatPrice, currency } = useCurrency();
  const router = useRouter();
  const submittingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  // A pending order whose Paystack redirect never landed. When set, we surface
  // a "Complete your payment" banner so the shopper can resume without the cart
  // (which checkout already cleared) and without creating a duplicate order.
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Address selection: default to a saved address when one exists so
  // returning customers don't have to retype anything. 'new' reveals the
  // manual entry fields.
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddressId || (savedAddresses.length > 0 ? savedAddresses[0].id : 'new'),
  );
  const usingSavedAddress =
    selectedAddressId !== 'new' &&
    savedAddresses.some((a) => a.id === selectedAddressId);

  // Country drives the state/postal/phone rules below. Defaults to Nigeria
  // (the bulk of orders) but must remain changeable — Soise ships to diaspora
  // customers, and hardcoding this locked them out of checkout entirely.
  const [country, setCountry] = useState<string>(DEFAULT_COUNTRY);
  const domestic = isDomestic(country);

  // Store-credit redemption toggle. The exact reduction is computed on the
  // backend; here we preview "up to" the lesser of the balance and the total.
  const [useStoreCredit, setUseStoreCredit] = useState(false);

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

  // Store credit can cover at most the current total. Only preview a reduction
  // when the toggle is on and the user actually has a balance.
  const hasStoreCredit = isLoggedIn && storeCredit > 0;
  // Shipping is charged on top of the goods, so it has to land in the total
  // before credit is applied — otherwise credit could appear to cover an
  // amount that Paystack then exceeds.
  const shipping = typeof shippingFee === 'number' && shippingFee > 0 ? shippingFee : 0;
  const totalWithShipping = total + shipping;
  const creditApplied =
    useStoreCredit && hasStoreCredit ? Math.min(storeCredit, totalWithShipping) : 0;
  const totalAfterCredit = Math.max(totalWithShipping - creditApplied, 0);

  // No fee line: the Paystack transaction fee is absorbed by the merchant, so
  // the order total IS the amount charged. It briefly wasn't — the account
  // passed the fee on, and checkout quoted 150,000 while Paystack collected
  // 152,000. If that setting is ever flipped back, the fee must be surfaced
  // again rather than left as a surprise at the payment step.

  async function handleRemoveItem(itemId: string) {
    if (!itemId || removingId) return;
    setRemovingId(itemId);
    try {
      const result = await removeFromCart(itemId);
      if (result.success) {
        // Any applied discount was computed against the old cart contents;
        // clear it so totals can't desync from what will actually be charged.
        setAppliedDiscount(0);
        setFinalTotal(null);
        setApiSubtotal(null);
        setDiscountData(null);
        router.refresh();
      } else {
        showToast.error('Could not remove item. Please try again.');
      }
    } catch {
      showToast.error('Could not remove item. Please try again.');
    } finally {
      setRemovingId(null);
    }
  }

  /**
   * Take the shopper to payment.
   *
   * Inline overlay first: every order this store has created reached the
   * Paystack redirect and none were paid, and a full-page bounce to another
   * domain is the step that loses people. The hosted page stays as the
   * fallback for anything that stops the overlay running — a blocked script,
   * an ad blocker, an older build with no access code — because the order
   * already exists server-side either way.
   *
   * Payment is NEVER trusted from the browser. onSuccess only routes to
   * /thank-you, which verifies against Paystack server-side before showing
   * anything (see app/thank-you/page.tsx) — same as the redirect path always
   * did.
   */
  async function goToPayment(result: {
    redirectUrl?: string;
    accessCode?: string;
    orderId?: string;
  }) {
    // Store credit covered the whole order: no Paystack step at all.
    if (result.redirectUrl === '/thank-you') {
      showToast.success('Order placed!');
      window.location.href = result.redirectUrl;
      return;
    }

    if (result.accessCode) {
      const outcome = await openInlineCheckout(result.accessCode);

      if (outcome.kind === 'success') {
        showToast.success('Payment received — confirming…');
        const ref = outcome.reference || result.orderId || '';
        window.location.href = ref
          ? `/thank-you?reference=${encodeURIComponent(ref)}`
          : '/thank-you';
        return;
      }

      if (outcome.kind === 'cancelled') {
        // They closed the overlay. The order is real and still payable, so
        // surface the resume banner rather than dead-ending them.
        if (result.orderId) setPendingOrderId(result.orderId);
        setPending(false);
        submittingRef.current = false;
        showToast.error('Payment cancelled. Your order is saved — tap “Complete payment” when you’re ready.');
        return;
      }

      // Overlay unavailable: fall through to the hosted page.
      console.error('Paystack inline unavailable:', outcome.reason);
    }

    if (result.redirectUrl) {
      showToast.success('Taking you to secure checkout…');
      window.location.href = result.redirectUrl;
    }
  }

  async function handleSubmit(formData: FormData) {
    // Re-entrancy guard: block a second submit firing before `pending` renders,
    // preventing duplicate orders / duplicate /cart/checkout POSTs.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPending(true);
    setError(null);

    if (discountData?.code) {
      formData.set('creator_code', discountData.code);
    }

    if (useStoreCredit && hasStoreCredit) {
      formData.set('use_store_credit', 'true');
    }

    if (usingSavedAddress) {
      formData.set('selected_address_id', selectedAddressId);
    }

    const toastId = showToast.loading('Processing your order...');

    try {
      const result = await checkoutAction(formData);

      showToast.dismiss(toastId);

      // The order now exists server-side. Remember it before we navigate so a
      // dropped redirect is recoverable on reload (see the resume banner).
      if (result?.orderId) {
        try {
          writePendingOrder(result.orderId);
        } catch {
          /* private mode / storage disabled — banner just won't show */
        }
      }

      if (result?.success && result.redirectUrl) {
        await goToPayment(result);
        return;
      }

      // Order created but no payment link came back (dropped/empty response):
      // don't dead-end — resume straight from the order we just recorded.
      if (result?.error === 'no_payment_link' && result?.orderId) {
        const resumed = await resumePaymentAction(result.orderId);
        if (resumed?.success && resumed.redirectUrl) {
          await goToPayment(resumed);
          return;
        }
        setPendingOrderId(result.orderId);
        const msg =
          resumed?.error && resumed.error !== 'no_payment_link'
            ? resumed.error
            : 'We saved your order but couldn’t open payment. Tap “Complete payment” to try again.';
        showToast.error(msg);
        setError(msg);
        setPending(false);
        submittingRef.current = false;
        return;
      }

      const errorMessage = result?.error || 'Checkout failed';
      showToast.error(errorMessage);
      setError(errorMessage);
      // The backend rejects a shipping_addr id that's been deleted (or never
      // belonged to this user) since the page loaded, rather than silently
      // completing an address-less order. Recover by falling back to manual
      // entry so retrying isn't just resubmitting the same dead selection.
      if (usingSavedAddress && result?.errorCode === 'stale_address') {
        setSelectedAddressId('new');
      }
      setPending(false);
      submittingRef.current = false;
    } catch (err) {
      showToast.dismiss(toastId);
      showToast.error('An error occurred during checkout. Please try again.');
      setError('An unexpected error occurred');
      setPending(false);
      submittingRef.current = false;
      // A thrown checkoutAction means we never learned the order id — but the
      // order may well have committed before the response dropped. Surface any
      // pending order recorded on a previous attempt so payment stays reachable.
      const stored = readPendingOrder();
      if (stored) setPendingOrderId(stored);
      console.error('Checkout error:', err);
    }
  }

  // On load, if a prior checkout left a pending order behind (redirect dropped,
  // tab closed, shopper bailed on Paystack), offer to resume it. Verifying it's
  // still payable happens server-side when they tap the banner.
  useEffect(() => {
    const stored = readPendingOrder();
    if (stored) setPendingOrderId(stored);
  }, []);

  async function handleResume() {
    if (!pendingOrderId || resuming) return;
    setResuming(true);
    const toastId = showToast.loading('Reopening secure checkout…');
    try {
      const resumed = await resumePaymentAction(pendingOrderId);
      showToast.dismiss(toastId);
      if (resumed?.success && resumed.redirectUrl) {
        // If it already settled, resume returns /thank-you — clear the marker.
        if (resumed.redirectUrl === '/thank-you') {
          clearPendingOrder();
        }
        // Through goToPayment, not a raw navigation. This used to jump straight
        // to the hosted Paystack page, so the one flow aimed at a shopper who
        // ALREADY failed to pay once was the only flow still bouncing them off
        // the site — the exact step that lost them the first time. resume
        // returns an accessCode too, so the overlay works here identically.
        await goToPayment(resumed);
        return;
      }
      // Order no longer awaiting payment (paid elsewhere / cancelled): drop it.
      clearPendingOrder();
      setPendingOrderId(null);
      showToast.error(
        resumed?.error || 'This order can no longer be paid for.',
      );
    } catch {
      showToast.dismiss(toastId);
      showToast.error('Could not reopen checkout. Please try again.');
    } finally {
      setResuming(false);
    }
  }

  async function handleCancelPending() {
    if (!pendingOrderId || resuming || cancelling) return;
    setCancelling(true);
    try {
      const result = await cancelPendingOrderAction(pendingOrderId);
      if (result.success) {
        clearPendingOrder();
        setPendingOrderId(null);
        showToast.success('Order cancelled. Nothing was charged.');
        router.refresh();
      } else {
        showToast.error(result.error || 'Could not cancel this order.');
      }
    } finally {
      setCancelling(false);
    }
  }

  async function applyCode(code: string, { silent = false } = {}) {
    setDiscountPending(true);

    const toastId = silent
      ? null
      : showToast.loading('Applying creator code...');

    try {
      const result = await applyDiscountCodeAction(code);

      if (toastId) showToast.dismiss(toastId);

      if (result.success) {
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
        setDiscountData({ ...data, code: data.code || code });
        setAppliedDiscount(discountAmt);
        setFinalTotal(computedTotal);
        setDiscountCode('');
        setShowSavingsPulse(true);
        setTimeout(() => setShowSavingsPulse(false), 1200);

        showToast.success(
          silent
            ? `Creator code ${data.code || code} applied — you saved!`
            : result.message || 'Creator code applied successfully!',
        );
        return true;
      } else {
        // A bad/expired link code shouldn't nag the customer — stay quiet when silent.
        if (!silent) {
          showToast.error(
            result.error ||
              'Failed to apply creator code. Please check and try again.',
          );
        }
        return false;
      }
    } catch (err) {
      if (toastId) showToast.dismiss(toastId);
      if (!silent)
        showToast.error('An error occurred while applying the discount.');
      console.error('Discount error:', err);
      return false;
    } finally {
      setDiscountPending(false);
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

    await applyCode(discountCode);
  }

  // Auto-apply a creator code that arrived via a share link (`?code=`),
  // stored in the PENDING_CREATOR_CODE_COOKIE cookie by RefCapture. Runs once
  // the cart has items and nothing is applied yet; clears the cookie once it
  // lands so it can't re-fire on later visits.
  const autoApplyAttempted = useRef(false);
  useEffect(() => {
    if (autoApplyAttempted.current) return;
    if (discountData || cart.length === 0) return;

    const pending = readCookie(PENDING_CREATOR_CODE_COOKIE);
    if (!pending) return;

    autoApplyAttempted.current = true;
    applyCode(pending, { silent: true }).finally(() => {
      // Whether it succeeded or the code was invalid, don't keep retrying.
      clearCookie(PENDING_CREATOR_CODE_COOKIE);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length, discountData]);

  function handleRemoveCode() {
    setDiscountData(null);
    setAppliedDiscount(0);
    setFinalTotal(null);
    setApiSubtotal(null);
    // The customer opted out — don't let the link cookie silently re-apply it.
    clearCookie(PENDING_CREATOR_CODE_COOKIE);
  }

  const handlePhoneInput = (e: React.InputEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.value.replace(/\D/g, ''); // Remove non-numeric characters
    if (value.length <= 11) {
      target.value = value;
    } else {
      target.value = value.slice(0, 11);
    }
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      {pendingOrderId && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="page-shell flex flex-col gap-y-4 border-b border-[#F0C36B] bg-[#FFF8EC] px-[20px] py-[16px] normal-case md:flex-row md:items-center md:gap-x-6"
        >
          {/* min-w-0 so the copy can actually use the space. Previously the
              action was .btn_black, which carries w-full from an UNLAYERED
              rule in globals.css — that beats the md:w-auto utility, so the
              button never shrank and squeezed this column to about 90px, one
              word per line. These buttons are styled inline for that reason. */}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#121212]">
              You have an order awaiting payment
            </p>
            <p className="mt-[2px] text-[12px] leading-relaxed text-[#7A6320]">
              Your order is saved and nothing has been charged yet. Reopening
              checkout continues that same order — it will not create a
              second one.
            </p>
          </div>
          {/* One control, split 1:3. Cancel is the smaller, quieter half —
              present so the banner isn't a one-way door, but never competing
              with the action we actually want. */}
          <div className="flex w-full shrink-0 overflow-hidden rounded-[10px] md:w-[360px]">
            <button
              type="button"
              onClick={handleCancelPending}
              disabled={resuming || cancelling}
              className="w-1/4 cursor-pointer border border-r-0 border-[#121212] bg-transparent px-[8px] py-[13px] text-[11px] font-bold tracking-wide text-[#121212] uppercase transition-colors duration-200 hover:bg-[#121212]/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelling ? '…' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleResume}
              disabled={resuming || cancelling}
              className="w-3/4 cursor-pointer bg-[#121212] px-[16px] py-[13px] text-[12px] font-bold tracking-wide text-white uppercase transition-colors duration-200 hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resuming ? 'Opening…' : 'Complete payment'}
            </button>
          </div>
        </motion.div>
      )}
      <div className="page-shell">
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
                      onRemove={handleRemoveItem}
                      removing={removingId === item.id}
                    />
                  ))
                ) : cartLoadFailed ? (
                  // Never tell a shopper their bag is empty when we simply
                  // failed to read it — that reads as "my cart is gone" and
                  // they leave instead of retrying.
                  <motion.div
                    className="flex flex-col items-center justify-center gap-y-[12px] text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <p className="text-[14px] text-[#121212]">
                      We couldn&apos;t load your bag just now.
                    </p>
                    <p className="text-[12px] text-[#8E8E93] normal-case">
                      Nothing has been lost — your items are still saved.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.refresh()}
                      className="mt-[4px] rounded-[10px] bg-[#121212] px-[20px] py-[10px] text-[12px] font-bold text-white uppercase transition-all duration-300 ease-out hover:bg-[#2a2a2a]"
                    >
                      Try again
                    </button>
                  </motion.div>
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
          {/* Referred-buyer welcome — a referred first-timer has ₦1,000 store
              credit unlocking on this very order. Frame it as a gift, never a
              pop-up shout. Hidden once they've completed a first paid order. */}
          {welcomeCreditPending && (
            <div className="mb-[18px] overflow-hidden rounded-[12px] border border-[#CFE9D8] bg-gradient-to-br from-[#F2FBF5] to-[#FBF7EE] px-[16px] py-[14px]">
              <div className="flex items-start gap-x-3">
                <span className="mt-[1px] flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#32AC5B]/10">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2C8F4D"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="8" width="18" height="4" rx="1" />
                    <path d="M12 8v13" />
                    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
                    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
                  </svg>
                </span>
                <div className="flex-1 normal-case">
                  <p className="text-[13px] font-semibold text-[#121212]">
                    A welcome gift is waiting
                  </p>
                  <p className="mt-[2px] text-[12px] leading-relaxed text-[#5A6B5F]">
                    Complete your first order and{' '}
                    {formatPrice(welcomeCreditAmount)} in store credit is yours
                    — a thank-you from the friend who invited you to Soise.
                  </p>
                  <Link
                    href="/swaz-loop"
                    className="mt-[6px] inline-block text-[12px] font-semibold text-[#2C8F4D] underline-offset-2 hover:underline"
                  >
                    How the Swaz Loop works →
                  </Link>
                </div>
              </div>
            </div>
          )}

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

          {/* Swaz Loop awareness — surfaced the moment a creator code lands.
              The buyer just made a creator earn; show them the loop runs both
              ways. Quiet, editorial tone — never a Temu-style shout. */}
          <AnimatePresence>
            {discountData && (
              <motion.div
                className="mt-[10px] overflow-hidden rounded-[10px] border border-[#ECE7F4] bg-[#FAF8FE] px-[14px] py-[12px]"
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B5B95]">
                  The Swaz Loop
                </p>
                <p className="mt-[4px] text-[12px] leading-relaxed text-[#4A4458]">
                  {discountData.creator?.username
                    ? `@${discountData.creator.username} earns when you shop their code`
                    : 'Your creator earns when you shop their code'}{' '}
                  — and the loop runs both ways. Earn store credit when friends
                  shop your link, or create with us.
                </p>
                <div className="mt-[10px] flex flex-wrap items-center gap-x-5 gap-y-1.5">
                  <Link
                    href="/swaz-loop"
                    className="text-[12px] font-semibold text-[#6B5B95] underline-offset-2 hover:underline"
                  >
                    Invite &amp; earn →
                  </Link>
                  <Link
                    href="/creators"
                    className="text-[12px] font-semibold text-[#6B5B95] underline-offset-2 hover:underline"
                  >
                    Become a creator →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Store credit toggle — only when logged in with a balance */}
          {hasStoreCredit && (
            <div className="mt-[16px] flex items-center justify-between rounded-[10px] border border-[#CCEAD6] bg-[#F5FCF7] px-[14px] py-[12px]">
              <div className="text-[13px] normal-case">
                <p className="font-medium text-[#121212]">
                  Apply my {formatPrice(storeCredit)} store credit
                </p>
                <p className="text-[11px] text-[#8E8E93]">
                  You earned this by inviting friends.{' '}
                  <Link
                    href="/swaz-loop"
                    className="font-medium text-[#32AC5B] underline-offset-2 hover:underline"
                  >
                    Keep earning →
                  </Link>
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={useStoreCredit}
                aria-label="Apply store credit"
                onClick={() => setUseStoreCredit((v) => !v)}
                className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors ${
                  useStoreCredit ? 'bg-[#32AC5B]' : 'bg-[#D1D1D6]'
                }`}
              >
                <span
                  className={`absolute top-[3px] h-[20px] w-[20px] rounded-full bg-white transition-all ${
                    useStoreCredit ? 'left-[23px]' : 'left-[3px]'
                  }`}
                />
              </button>
            </div>
          )}

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
            <AnimatePresence>
              {creditApplied > 0 && (
                <motion.div
                  className="flex items-center justify-between pt-[8px] text-[12px] text-green-600"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div>Store credit</div>
                  <div>-{formatPrice(creditApplied)}</div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Always shown, including when it's free. A shopper who can't see
                a shipping line assumes one is coming at the payment step — say
                it plainly here instead. */}
            <div className="flex items-center justify-between pt-[8px] text-[12px] text-[#8E8E93]">
              <div>Shipping</div>
              {shipping > 0 ? (
                <div>{formatPrice(shipping)}</div>
              ) : domestic ? (
                <div className="font-medium text-green-600">Free</div>
              ) : (
                // Free delivery is a Nigeria-only promise. The backend charges
                // zero shipping for every order, so an international address
                // would otherwise be shown "Free" — a claim nobody made.
                <div className="text-[#8E8E93]">Confirmed after order</div>
              )}
            </div>
            <div className="flex items-center justify-between pt-[12px] text-[14px] font-medium text-[#121212]">
              <div>Total</div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={totalAfterCredit}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.25 }}
                  className={showSavingsPulse ? 'text-green-600' : ''}
                >
                  {formatPrice(totalAfterCredit)}
                </motion.div>
              </AnimatePresence>
            </div>
            {shipping === 0 && domestic && (
              <p className="mt-[8px] text-[10px] text-[#8E8E93] normal-case">
                Free delivery anywhere in Nigeria. Nothing is added at payment.
              </p>
            )}
            {shipping === 0 && !domestic && (
              <p className="mt-[8px] text-[10px] text-[#8E8E93] normal-case">
                International delivery — we&apos;ll confirm shipping with you
                after you order.
              </p>
            )}
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
                    <Field
                      label="Email address"
                      htmlFor="email"
                      hint="For your receipt and delivery updates"
                    >
                    <input
                      id="email"
                      type="email"
                      name="email"
                      className="solid"
                      autoComplete="email"
                      required
                      // Save it on blur, not just on submit. A shopper who
                      // types their email and then leaves is exactly who an
                      // abandoned-cart reminder is for — and until now they
                      // left no address behind at all.
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (value.includes('@')) {
                          void captureCartEmailAction(value);
                        }
                      }}
                    />
                    </Field>
                  )}

                  {savedAddresses.length > 0 && (
                    <div className="space-y-[8px] pb-[4px]">
                      {savedAddresses.map((addr) => (
                        <label
                          key={addr.id}
                          className={`flex cursor-pointer items-start gap-x-3 rounded-[10px] border p-3 text-[13px] transition-colors ${
                            selectedAddressId === addr.id
                              ? 'border-[#121212] bg-[#F7F7F7]'
                              : 'border-[#D1D1D6]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="address_choice"
                            className="mt-[3px]"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                          />
                          <span>
                            <span className="font-medium">
                              {addr.label || 'Address'}
                              {addr.is_default ? ' · Default' : ''}
                            </span>
                            <br />
                            <span className="text-[#8E8E93]">
                              {addr.line1}
                              {addr.line2 ? `, ${addr.line2}` : ''},{' '}
                              {addr.city}, {addr.state}
                            </span>
                          </span>
                        </label>
                      ))}
                      <label
                        className={`flex cursor-pointer items-center gap-x-3 rounded-[10px] border p-3 text-[13px] transition-colors ${
                          selectedAddressId === 'new'
                            ? 'border-[#121212] bg-[#F7F7F7]'
                            : 'border-[#D1D1D6]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address_choice"
                          checked={selectedAddressId === 'new'}
                          onChange={() => setSelectedAddressId('new')}
                        />
                        <span className="font-medium">
                          Use a new address
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Paired: two short related fields in one full-width
                      column each made the form read far longer than it is. */}
                  <div className="grid gap-[10px] sm:grid-cols-2">
                    <Field label="First name" htmlFor="firstName">
                      <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        className="solid"
                        autoComplete="given-name"
                        defaultValue={prefillFirstName}
                        required
                      />
                    </Field>
                    <Field label="Last name" htmlFor="lastName">
                      <input
                        id="lastName"
                        type="text"
                        name="lastName"
                        className="solid"
                        autoComplete="family-name"
                        defaultValue={prefillLastName}
                        required
                      />
                    </Field>
                  </div>

                  {!usingSavedAddress && (
                    <>
                      {/* Country drives everything below it. Soise ships to
                          diaspora customers, so this cannot be assumed. */}
                      <Field label="Country" htmlFor="country">
                        <select
                          id="country"
                          name="country"
                          className="solid"
                          autoComplete="country-name"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          required
                        >
                          {SHIPPING_COUNTRIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Street address" htmlFor="address">
                        <input
                          id="address"
                          type="text"
                          name="address"
                          className="solid"
                          placeholder="House number and street"
                          autoComplete="address-line1"
                          required
                        />
                      </Field>
                      <div className="grid gap-[10px] sm:grid-cols-2">
                      <Field label="City" htmlFor="city">
                        <input
                          id="city"
                          type="text"
                          name="city"
                          className="solid"
                          autoComplete="address-level2"
                          required
                        />
                      </Field>
                      {/* A fixed list only works for Nigeria. Everywhere else
                          gets free text — no single list covers county,
                          province, prefecture and emirate at once. */}
                      <Field
                        label={domestic ? 'State' : 'State / Province / Region'}
                        htmlFor="state"
                      >
                        {domestic ? (
                          <select
                            id="state"
                            name="state"
                            className="solid"
                            autoComplete="address-level1"
                            required
                          >
                            <option value="">Select state</option>
                            {NIGERIAN_STATES.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id="state"
                            type="text"
                            name="state"
                            className="solid"
                            autoComplete="address-level1"
                            required
                          />
                        )}
                      </Field>
                      </div>
                      <div className="grid gap-[10px] sm:grid-cols-2">
                      {/* Optional in Nigeria, where postal codes are barely
                          used and requiring one is a field with no answer.
                          Required everywhere else, where a parcel genuinely
                          cannot be delivered without it — and not digits-only,
                          because UK and Canadian codes contain letters. */}
                      <Field
                        label="Postal / ZIP code"
                        htmlFor="zipCode"
                        hint={domestic ? 'Optional' : undefined}
                      >
                        <input
                          id="zipCode"
                          type="text"
                          name="zipCode"
                          inputMode={domestic ? 'numeric' : 'text'}
                          className="solid"
                          autoComplete="postal-code"
                          required={!domestic}
                          onInput={
                            domestic
                              ? (e: any) => {
                                  e.target.value = e.target.value.replace(/\D/g, '');
                                }
                              : undefined
                          }
                        />
                      </Field>
                      <Field
                        label="Phone number"
                        htmlFor="phone"
                        hint={
                          domestic
                            ? '11 digits'
                            : 'Include your country code'
                        }
                      >
                        <input
                          id="phone"
                          type="tel"
                          name="phone"
                          className="solid"
                          autoComplete="tel"
                          defaultValue={prefillPhone}
                          required
                          // 11 digits is the Nigerian format. An international
                          // number is up to 15 digits (E.164) and may be typed
                          // with a leading +, so the domestic cap would
                          // silently truncate a diaspora shopper's number.
                          maxLength={domestic ? 11 : 16}
                          onInput={domestic ? handlePhoneInput : undefined}
                        />
                      </Field>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn_black"
                  disabled={pending || cart.length === 0}
                >
                  {pending
                    ? 'Processing...'
                    : `Pay ${formatPrice(totalAfterCredit)}`}
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
  onRemove,
  removing = false,
}: {
  item: EnrichedCartItem;
  index?: number;
  onRemove?: (id: string) => void;
  removing?: boolean;
}) {
  const { formatPrice } = useCurrency();
  const name = item.variantDetails?.product_name ?? 'Product';
  const color = item.variantDetails?.color ?? 'N/A';
  const size = item.variantDetails?.size ?? 'N/A';
  const price = item.variantDetails?.price ?? 0;
  const image =
    item.variantDetails?.display_media?.[0]?.url ??
    item.variantDetails?.media?.[0]?.url ??
    item.variantDetails?.product_primary_image ??
    undefined;

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
            <motion.button
              type="button"
              onClick={() => item.id && onRemove?.(item.id)}
              disabled={removing}
              className="cursor-pointer uppercase underline hover:no-underline disabled:cursor-not-allowed disabled:opacity-50"
              whileHover={removing ? {} : { scale: 1.05 }}
              whileTap={removing ? {} : { scale: 0.95 }}
            >
              {removing ? 'Removing...' : 'Remove'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
