// Cross-component cart sync. The Nav is now a static/client shell that loads its
// cart via getNavSession() on mount, so cart mutations happening elsewhere (e.g.
// "Add to bag" on a product page) must tell the Nav to re-read. Any code that
// changes the cart calls notifyCartChanged(); the Nav subscribes via
// onCartChanged() and refreshes its badge/panel. Replaces the old
// revalidatePath('/', 'layout') propagation, which re-rendered the server Nav
// but also purged the whole ISR cache on every cart change.

export const CART_CHANGED_EVENT = 'soise:cart-changed';

export type CartChangeDetail = {
  /**
   * Open the bag panel as well as refreshing it.
   *
   * Opt-in, because most cart changes must NOT open the bag: removing an item
   * or nudging a quantity happens inside the panel already, and quantity
   * changes fire this on every tap.
   *
   * Set by "Add to bag". Adding used to leave the shopper on the product page
   * with only a toast, so reaching checkout meant noticing the badge, finding
   * the bag icon and opening it themselves. Opening it puts Tap To Checkout
   * one tap away.
   */
  openBag?: boolean;
};

export function notifyCartChanged(detail: CartChangeDetail = {}): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT, { detail }));
  }
}

export function onCartChanged(
  handler: (detail: CartChangeDetail) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (event: Event) =>
    handler((event as CustomEvent<CartChangeDetail>).detail ?? {});
  window.addEventListener(CART_CHANGED_EVENT, listener);
  return () => window.removeEventListener(CART_CHANGED_EVENT, listener);
}
