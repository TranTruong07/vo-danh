// Sample catalog data, not an actual sales offer.
export const demoProduct = {
  price: 349_000,
  minQuantity: 1,
  maxQuantity: 10,
};

export function formatDemoTotal(quantity = 1): string {
  return new Intl.NumberFormat("vi-VN").format(quantity * demoProduct.price);
}
