/**
 * Affiliate type label mappings
 * Backend sends uppercase enum values: INFLUENCER, RESELLER, REFERRAL, PARTNER
 */
export const AFFILIATE_TYPE_LABELS: Record<string, string> = {
  INFLUENCER: "Influencer",
  RESELLER: "Reseller",
  REFERRAL: "Referral",
  PARTNER: "Partner",
};

/**
 * Affiliate type color mappings for badge styling
 * Uses Tailwind CSS color classes
 */
export const AFFILIATE_TYPE_COLORS: Record<
  string,
  "blue" | "green" | "purple" | "orange"
> = {
  INFLUENCER: "purple",
  RESELLER: "blue",
  REFERRAL: "green",
  PARTNER: "orange",
};
