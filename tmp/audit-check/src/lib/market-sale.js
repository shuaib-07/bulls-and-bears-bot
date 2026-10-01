"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMarketSale = calculateMarketSale;
exports.isValidPeerPrice = isValidPeerPrice;
function calculateMarketSale(price, quantity, commissionPercent) {
    const grossCents = Math.round(price * quantity * 100);
    const commissionCents = Math.round(grossCents * commissionPercent / 100);
    return {
        grossTotal: grossCents / 100,
        commissionAmount: commissionCents / 100,
        netTotal: (grossCents - commissionCents) / 100,
    };
}
function isValidPeerPrice(price) {
    return typeof price === "number" && Number.isFinite(price) && price >= 0.01 && price <= 99999999.99 &&
        Math.abs(price * 100 - Math.round(price * 100)) < 0.000001;
}
