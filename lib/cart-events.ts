// Cross-component cart sync. The Nav is now a static/client shell that loads its
// cart via getNavSession() on mount, so cart mutations happening elsewhere (e.g.
// "Add to bag" on a product page) must tell the Nav to re-read. Any code that
// changes the cart calls notifyCartChanged(); the Nav subscribes via
// onCartChanged() and refreshes its badge/panel. Replaces the old
// revalidatePath('/', 'layout') propagation, which re-rendered the server Nav
// but also purged the whole ISR cache on every cart change.

export const CART_CHANGED_EVENT = 'soise:cart-changed';

export function notifyCartChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CART_CHANGED_EVENT));
  }
}

export function onCartChanged(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CART_CHANGED_EVENT, handler);
  return () => window.removeEventListener(CART_CHANGED_EVENT, handler);
}
