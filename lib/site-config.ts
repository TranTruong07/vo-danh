const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "";
const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || "";
export const contact = { email, phone, isExample: !email && !phone };
const configuredPurchaseUrl = process.env.NEXT_PUBLIC_PURCHASE_URL?.trim();
export const purchaseUrl = configuredPurchaseUrl && /^https:\/\//i.test(configuredPurchaseUrl) ? configuredPurchaseUrl : "";
