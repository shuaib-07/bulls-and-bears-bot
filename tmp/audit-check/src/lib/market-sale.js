"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMarketSale = calculateMarketSale;
function calculateMarketSale(price, quantity, commissionPercent) {
    const grossCents = Math.round(price * quantity * 100);
    const commissionCents = Math.round(grossCents * commissionPercent / 100);
    return {
        grossTotal: grossCents / 100,
        commissionAmount: commissionCents / 100,
        netTotal: (grossCents - commissionCents) / 100,
    };
}
