export function calculateMarketSale(price: number, quantity: number, commissionPercent: number) {
  const grossCents = Math.round(price * quantity * 100);
  const commissionCents = Math.round(grossCents * commissionPercent / 100);
  return {
    grossTotal: grossCents / 100,
    commissionAmount: commissionCents / 100,
    netTotal: (grossCents - commissionCents) / 100,
  };
}

export function isValidPeerPrice(price: unknown): price is number {
  return typeof price === "number" && Number.isFinite(price) && price >= 0.01 && price <= 99999999.99 &&
    Math.abs(price * 100 - Math.round(price * 100)) < 0.000001;
}
