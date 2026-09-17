import { ChevronRightIcon, InstagramIcon, TiktokIcon, XIcon } from './icons';
import FooterClient from './footer-client';

/**
 * `newsletter={false}` drops the mailing-list form. Pages that already ask
 * the shopper for an email (checkout) pass it, so one page never carries two
 * email fields — the footer's was the third ask on the order summary.
 */
export default function Footer({
  newsletter = true,
}: { newsletter?: boolean } = {}) {
  return <FooterClient newsletter={newsletter} />;
}
