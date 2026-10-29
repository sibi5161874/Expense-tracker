/** Donation and feedback destinations — kept in one small file so they're a one-line edit
 * later rather than scattered across components/routes. */
export const UPI_ID = "sibi24sibi-1@okicici";
export const UPI_PAYEE_NAME = "sibi V";
export const FEEDBACK_RECIPIENT_EMAIL = "sibi24sibi@gmail.com";
/** Used both as BuyMeACoffeeButton's data-slug and to build the public buymeacoffee.com page
 * URL (DonateContent's QR code). */
export const BMC_SLUG = "sibi24sibi5";
export const BMC_PAGE_URL = `https://www.buymeacoffee.com/${BMC_SLUG}`;

/** Landing page promo video — paste any YouTube link here (a normal youtube.com/watch?v=...
 * link, a youtu.be/... short link, or an already-embed youtube.com/embed/... link all work,
 * see toYoutubeEmbedUrl in lib/youtube.ts), or a direct video file path (e.g. /_ _project__ _ _title_.mp4).
 * Leave empty to hide the promo video section entirely. */
export const PROMO_VIDEO_YOUTUBE_URL = "https://youtu.be/dGbQzsU61wU";


