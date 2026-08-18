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
  checkoutAction,
  applyDiscountCodeAction,
  resumePaymentAction,
  updateOrderShippingAction,
} from './actions';
import { removeFromCart } from '@/components/home/nav/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast, validateField } from '@/lib/toast-utils';
import { useCurrency } from '@/lib/currency-context';
import { PENDING_CREATOR_CODE_COOKIE } from '@/components/RefCapture';
import { openInlineCheckout } from '@/lib/bachs-overlay';
import {
  readPendingOrder,
  readPendingOrderSecret,
  writePendingOrder,
  clearPendingOrder,
} from './pending-order';
import { DEFAULT_COUNTRY, isDomestic } from '@/lib/countries';
import { OrderSummaryItem } from './OrderSummaryItem';
import { PendingOrderBanner } from './PendingOrderBanner';
import { OrderSummaryTotals } from './OrderSummaryTotals';
import CheckoutStepPayment from './CheckoutStepPayment';
import CheckoutStepAddress, { SavedAddress } from './CheckoutStepAddress';

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

interface AppliedDiscountData {
  code?: string;
  valid?: boolean;
  subtotal?: number;
  discount_percentage?: number;
  discount_amount?: number;
  final_total?: number;
  creator?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
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
  // so the total here matches what Bachs collects.
  shippingFee?: number | null;
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
  const { formatPrice, chargeCurrency } = useCurrency();
  const router = useRouter();
  const submittingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  // A pending order whose payment redirect never landed. When set, we surface
  // a "Complete your payment" banner so the shopper can resume without the cart
  // (which checkout already cleared) and without creating a duplicate order.
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  // Two-step checkout: Step 1 = email/name for payment, Step 2 = full address
  const [checkoutStep, setCheckoutStep] = useState<'payment' | 'address'>('payment');
  const [orderId, setOrderId] = useState<string | null>(null);
  // This order was created without a delivery address, so one is owed once
  // payment lands. Cleared for signed-in shoppers whose saved default address
  // was attached at checkout.
  const [awaitingAddress, setAwaitingAddress] = useState(false);
  // Set only after the money is actually in. Its presence is what tells the
  // address step "this order is paid — finish, don't reopen payment", and it
  // carries the confirmation URL (with the payment reference) to land on.
  const [paidThankYouUrl, setPaidThankYouUrl] = useState<string | null>(null);

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
  //
  // The input starts collapsed behind a quiet link. An open code field at the
  // pay step is a classic leak: shoppers leave to hunt for a code (and rarely
  // come back), and everyone without one is reminded they might be overpaying.
  // Shoppers who arrived via a creator's share link never need the field at
  // all — their code auto-applies from the cookie below.
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountPending, setDiscountPending] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [finalTotal, setFinalTotal] = useState<number | null>(null);
  const [discountData, setDiscountData] = useState<AppliedDiscountData | null>(null);
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
  // amount that the charge then exceeds.
  const shipping = typeof shippingFee === 'number' && shippingFee > 0 ? shippingFee : 0;
  const totalWithShipping = total + shipping;
  const creditApplied =
    useStoreCredit && hasStoreCredit ? Math.min(storeCredit, totalWithShipping) : 0;
  const totalAfterCredit = Math.max(totalWithShipping - creditApplied, 0);

  // No fee line: the Bachs processing fee is absorbed by the merchant
  // (fee_handling: org_pays_fee), so the order total IS the amount charged.
  // Under Paystack this briefly wasn't true — the account passed the fee on,
  // and checkout quoted 150,000 while the charge collected 152,000. If that
  // setting is ever flipped to customer_pays, the fee must be surfaced again
  // rather than left as a surprise at the payment step.

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
   * Inline overlay first: every order this store created under the old
   * full-page redirect went unpaid, and a bounce to another domain is the
   * step that loses people. The hosted Bachs page stays as the fallback for
   * anything that stops the overlay running — a blocked script, an ad
   * blocker, an older build with no checkout URL — because the order already
   * exists server-side either way.
   *
   * Payment is NEVER trusted from the browser. checkout.completed only routes
   * to /thank-you, which verifies against Bachs server-side before showing
   * anything (see app/thank-you/page.tsx) — same as the redirect path always
   * did.
   */
  async function goToPayment(
    result: {
      redirectUrl?: string;
      checkoutUrl?: string;
      orderId?: string;
    },
    isRetryAfterExpiry = false,
  ) {
    // Store credit covered the whole order: no payment step at all.
    if (result.redirectUrl === '/thank-you') {
      showToast.success('Order placed!');
      window.location.href = result.redirectUrl;
      return;
    }

    if (result.checkoutUrl) {
      const outcome = await openInlineCheckout(result.checkoutUrl);

      if (outcome.kind === 'success') {
        const ref = outcome.reference || result.orderId || '';
        const thankYou = ref
          ? `/thank-you?reference=${encodeURIComponent(ref)}`
          : '/thank-you';

        // Paid, and we still don't know where to send it. Ask now, in-page,
        // while the shopper is right here and at their most committed — this
        // is the moment the two-step flow exists for. Navigating to
        // /thank-you first would mean chasing the address by email instead.
        if (awaitingAddress && result.orderId) {
          setPaidThankYouUrl(thankYou);
          setOrderId(result.orderId);
          setCheckoutStep('address');
          setPending(false);
          submittingRef.current = false;
          showToast.success('Payment received — last step: where should we send it?');
          return;
        }

        showToast.success('Payment received — confirming…');
        window.location.href = thankYou;
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

      // A session that expired while the overlay sat open is the one
      // "unavailable" whose URL is guaranteed dead — Bachs sessions live 60
      // minutes, and redirecting to the corpse strands the shopper on the
      // provider's expired-session page. Mint a fresh session via resume and
      // reopen. Once only: a brand-new session cannot be expired, so a second
      // failure means something else is wrong and the generic fallback below
      // (or the resume banner) is the right place to land.
      if (
        outcome.kind === 'unavailable' &&
        outcome.reason === 'session-expired' &&
        result.orderId &&
        !isRetryAfterExpiry
      ) {
        const expiredToastId = showToast.loading(
          'That checkout timed out — opening a fresh one…',
        );
        const resumed = await resumePaymentAction(result.orderId);
        showToast.dismiss(expiredToastId);
        if (resumed?.success && resumed.redirectUrl) {
          await goToPayment(resumed, true);
          return;
        }
        // Resume said no (paid elsewhere / cancelled meanwhile): surface the
        // banner path rather than redirecting to a dead session.
        setPendingOrderId(result.orderId);
        setPending(false);
        submittingRef.current = false;
        showToast.error(
          resumed?.error || 'That checkout expired. Tap “Complete payment” to reopen it.',
        );
        return;
      }

      // Overlay unavailable for any other reason (blocked script, ad blocker,
      // SDK error): the session itself is still payable, so fall through to
      // the hosted page.
      console.error('Bachs overlay unavailable:', outcome.reason);
    }

    if (result.redirectUrl) {
      showToast.success('Taking you to secure checkout…');
      window.location.href = result.redirectUrl;
    }
  }

  // Step 1 form action. Two-step checkout: only email/name is submitted here —
  // the shipping address is collected in Step 2 (handleAddressSubmit) after
  // payment is underway, so any address fields are stripped from the payload.
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

    // The charge currency the shopper is browsing in: naira for Nigeria,
    // USD for the international card rail. The backend stamps it on the
    // order so every retry re-charges what they originally saw.
    formData.set('currency', chargeCurrency);

    if (useStoreCredit && hasStoreCredit) {
      formData.set('use_store_credit', 'true');
    }

    // Remove any shipping address fields for Step 1
    formData.delete('address');
    formData.delete('city');
    formData.delete('state');
    formData.delete('country');
    formData.delete('zipCode');
    formData.delete('phone');
    formData.delete('line2');
    formData.delete('selected_address_id');

    const toastId = showToast.loading('Processing your order...');

    try {
      const result = await checkoutAction(formData);

      showToast.dismiss(toastId);

      // The order now exists server-side. Remember it before we navigate so a
      // dropped redirect is recoverable on reload (see the resume banner).
      // Guest orders also stash their per-order secret here so Step 2 can
      // prove ownership when it sets the shipping address.
      if (result?.orderId) {
        try {
          writePendingOrder(result.orderId, result.orderSecret);
          setOrderId(result.orderId);
        } catch {
          /* private mode / storage disabled — banner just won't show */
        }
      }

      // Step 1 ends at the PAYMENT button, not at another form. The whole
      // point of splitting checkout is that a shopper reaches "pay" after three
      // fields instead of nine; collecting the address here first just
      // paginated the same form and added a screen. The address is asked for
      // once the money is in — see goToPayment's success branch.
      if (result?.addressPending) setAwaitingAddress(true);

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

  // Step 2 form action: attach the shipping address to the order created in
  // Step 1, then reopen payment for it. Guest orders present their per-order
  // secret (X-Order-Token) to prove ownership of the account-less order.
  async function handleAddressSubmit(formData: FormData) {
    if (!orderId) return;

    setPending(true);
    setError(null);

    const toastId = showToast.loading('Saving your delivery details...');

    try {
      // Guest orders need their per-order secret (X-Order-Token) to prove
      // ownership of the account-less order. It was stashed with the pending
      // order at checkout; signed-in orders authenticate via the session
      // cookie the action forwards, so no token is sent for them.
      const orderToken = readPendingOrderSecret() ?? undefined;

      // A saved address renders no manual fields, so when one is selected the
      // payload must come from the stored address — reading the (absent)
      // inputs used to POST null line1/city/state/country, which the backend
      // rejected with 400 "Missing required field".
      const saved = usingSavedAddress
        ? savedAddresses.find((a) => a.id === selectedAddressId)
        : undefined;
      const shippingAddress = saved
        ? {
            label: saved.label || 'Home',
            line1: saved.line1,
            line2: saved.line2 || '',
            city: saved.city,
            state: saved.state,
            country: saved.country,
            postal_code: saved.postal_code,
            phone: saved.phone || '',
          }
        : {
            label: formData.get('label') as string || 'Home',
            line1: formData.get('address') as string,
            line2: formData.get('line2') as string || '',
            city: formData.get('city') as string,
            state: formData.get('state') as string,
            country: formData.get('country') as string,
            postal_code: formData.get('zipCode') as string || '',
            phone: formData.get('phone') as string || '',
          };
      const result = await updateOrderShippingAction(
        orderId,
        shippingAddress,
        orderToken,
        // The recipient's name lives on this form now (Step 1 is email-only),
        // so it rides to the backend with the address it belongs to.
        {
          firstName: ((formData.get('firstName') as string) || '').trim(),
          lastName: ((formData.get('lastName') as string) || '').trim(),
        },
      );

      showToast.dismiss(toastId);

      if (result.success) {
        showToast.success('Delivery details saved');
        // The order is already PAID by the time this form is shown, so there is
        // no payment left to resume — go straight to the confirmation. (This
        // used to call resumePaymentAction, which was correct only while the
        // address was collected before payment.)
        if (paidThankYouUrl) {
          window.location.href = paidThankYouUrl;
          return;
        }
        // No payment recorded yet: the shopper reached this form some other way
        // (an unpaid order resumed from the banner). Open payment as before, so
        // that path still completes rather than silently doing nothing.
        const resumed = await resumePaymentAction(orderId);
        if (resumed?.success && resumed.redirectUrl) {
          await goToPayment(resumed);
          return;
        }
        const msg =
          resumed?.error ||
          'Details saved, but we couldn’t reopen payment. Tap “Complete payment” to try again.';
        showToast.error(msg);
        setError(msg);
      } else {
        showToast.error(result.error || 'Failed to save delivery details');
        setError(result.error || 'Failed to save delivery details');
      }
    } catch (err) {
      showToast.dismiss(toastId);
      showToast.error('An error occurred while saving your details. Please try again.');
      setError('An unexpected error occurred');
      console.error('Address submission error:', err);
    } finally {
      setPending(false);
    }
  }

  // On load, if a prior checkout left a pending order behind (redirect dropped,
  // tab closed, shopper bailed on the payment page), offer to resume it. Verifying it's
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
        // to the hosted payment page, so the one flow aimed at a shopper who
        // ALREADY failed to pay once was the only flow still bouncing them off
        // the site — the exact step that lost them the first time. resume
        // returns a checkoutUrl too, so the overlay works here identically.
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
        return;
      }

      // The server couldn't cancel it. If that's because the order is gone or
      // is no longer awaiting payment, the marker in this browser is stale and
      // keeping it only pins an undismissable banner to the checkout page —
      // which is the one-way door this button exists to remove. Clear it.
      //
      // handleResume already does exactly this on the same failure; cancel not
      // doing it meant an order deleted server-side left the shopper with a
      // banner that no button could clear.
      const stale =
        /not found|cannot be cancelled|no longer/i.test(result.error || '');
      if (stale) {
        clearPendingOrder();
        setPendingOrderId(null);
        showToast.success('That order is no longer active — cleared.');
        router.refresh();
        return;
      }

      // A genuine failure (network, server error): keep the marker, because
      // the order really may still be awaiting payment.
      showToast.error(result.error || 'Could not cancel this order.');
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

  return (
    <>
      <Toaster position="top-center" richColors />
      {pendingOrderId && (
        <PendingOrderBanner
          resuming={resuming}
          cancelling={cancelling}
          onResume={handleResume}
          onCancel={handleCancelPending}
        />
      )}
      <div className="page-shell">
        <div className="pb-[50px]">
          <motion.div
            className="flex items-baseline justify-between border-y-2 border-[#121212] px-[20px] py-[22px]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-x-3">
              <span
                className="text-[22px] leading-none tracking-tight uppercase"
                style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}
              >
                Order
              </span>
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
                className="text-[18px] leading-none"
                style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}
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

          {/* Code entry — collapsed behind a link until asked for, hidden
              entirely when a code is already active */}
          <AnimatePresence mode="wait">
            {!discountData ? (
              showCodeInput ? (
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
                    autoFocus
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
                <motion.button
                  key="code-link"
                  type="button"
                  onClick={() => setShowCodeInput(true)}
                  className="text-[12px] text-[#8E8E93] underline underline-offset-2 transition-colors hover:text-[#121212]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  Have a creator code?
                </motion.button>
              )
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
                  {(discountData.discount_percentage ?? 0) > 0 && (
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

          <OrderSummaryTotals
            subtotal={subtotal}
            appliedDiscount={appliedDiscount}
            creditApplied={creditApplied}
            shipping={shipping}
            domestic={domestic}
            totalAfterCredit={totalAfterCredit}
            showSavingsPulse={showSavingsPulse}
          />
        </div>

        <div className="my-[28px] border-t-2 border-[#121212]"></div>
        {cart.length > 0 && (
          <div className="px-[20px]">
            {checkoutStep === 'payment' ? (
              <CheckoutStepPayment
                isLoggedIn={isLoggedIn}
                pending={pending}
                error={error}
                cartEmpty={cart.length === 0}
                payLabel={`Pay ${formatPrice(totalAfterCredit)}`}
                onSubmit={handleSubmit}
              />
            ) : (
              <CheckoutStepAddress
                savedAddresses={savedAddresses}
                selectedAddressId={selectedAddressId}
                onSelectAddress={setSelectedAddressId}
                usingSavedAddress={usingSavedAddress}
                country={country}
                onCountryChange={setCountry}
                domestic={domestic}
                prefillFirstName={prefillFirstName}
                prefillLastName={prefillLastName}
                prefillPhone={prefillPhone}
                pending={pending}
                error={error}
                cartEmpty={cart.length === 0}
                totalAfterCredit={totalAfterCredit}
                isPaid={paidThankYouUrl !== null}
                onSubmit={handleAddressSubmit}
              />
            )}

            {/* Trust, below the fold of the decision. Everything here is
                VERIFIABLE — a policy page, a CAC certificate, a phone that
                answers. No review counts, no "N happy customers": the store's
                own rule is no reviews, and at this stage any social proof
                would be fabricated — which reads worse than silence the
                moment a skeptical shopper checks. Sits AFTER the pay button
                so a committed buyer never scrolls past it; a hesitating one
                finds it exactly where doubt takes them. */}
            <div className="mb-[44px] border-t-2 border-[#121212] pt-[18px] normal-case">
              <div className="space-y-[14px]">
                <div>
                  <p className="brut-label">7-day exchange</p>
                  <p className="mt-[3px] text-[12px] leading-relaxed text-[#5C544A]">
                    Wrong size or change of heart? Exchanges ship free within
                    Nigeria — everywhere else, take a full refund to your
                    card.{' '}
                    <Link
                      href="/returns"
                      className="font-semibold text-[#B3101C] underline-offset-2 hover:underline"
                    >
                      The promise →
                    </Link>
                  </p>
                </div>
                <div>
                  <p className="brut-label">A registered business</p>
                  <p className="mt-[3px] text-[12px] leading-relaxed text-[#5C544A]">
                    Soise is incorporated with Nigeria&apos;s Corporate Affairs
                    Commission — RC 8413888.{' '}
                    <a
                      href="/cac-registration.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#B3101C] underline-offset-2 hover:underline"
                    >
                      Certificate →
                    </a>
                  </p>
                </div>
                <div>
                  <p className="brut-label">A human answers</p>
                  <p className="mt-[3px] text-[12px] leading-relaxed text-[#5C544A]">
                    Questions before you pay?{' '}
                    <a
                      href="https://wa.me/2348135757947"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#B3101C] underline-offset-2 hover:underline"
                    >
                      WhatsApp us
                    </a>{' '}
                    — Mon–Sat, 9:00–18:00 WAT.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
