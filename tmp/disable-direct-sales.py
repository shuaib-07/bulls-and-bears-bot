from pathlib import Path
import re

def read(file):
    return Path(file).read_text(encoding="utf-8")

def write(file, text):
    Path(file).write_text(text, encoding="utf-8")

# Remove executable direct-sale branches, retaining historical audit data/schema.
file = "src/app/api/trade/route.ts"
s = read(file).replace("getPeerTradeCount, recordPeerTrade, REQUIRED_PEER_TRADES", "getPeerTradeCount, REQUIRED_PEER_TRADES").replace("calculateMarketSale, isValidPeerPrice", "calculateMarketSale")
s = s.replace("targetTeamId, offerId, pricePerShare, simulationId", "targetTeamId, simulationId")
start = s.index("    // -------------------------------------------------------------------------\n    // ACTION: ACCEPT DIRECT")
end = s.index("    const qty = quantity;", start)
s = s[:start] + '''    if (["ACCEPT_DIRECT_SELL", "REJECT_DIRECT_SELL", "CANCEL_DIRECT_SELL"].includes(action) ||
      (action === "SELL" && targetTeamId && targetTeamId !== "MARKET_POOL")) {
      return NextResponse.json({ error: "Direct sales between teams are disabled. Sell to the market or propose a share swap.", code: "DIRECT_SALES_DISABLED" }, { status: 403 });
    }

''' + s[end:]
start = s.index("      // Case A: DIRECT")
end = s.index("      const peerTrades", start)
s = s[:start] + "      // Market sales require the configured swap progress.\n" + s[end:]
start = s.index("      // Check if seller's remaining shares invalidate")
end = s.index("      state.transactions.push", start)
s = s[:start] + s[end:]
s = s.replace("SELL (DIRECT TO TEAM OR TO MARKET POOL)", "SELL TO MARKET POOL").replace("P2P Swaps or Direct Offers", "share swaps").replace("direct trade(s) or accepted swap(s)", "accepted swap(s)")
write(file, s)

file = "src/app/api/admin/route.ts"
s = read(file)
start = s.index('    if (action === "SET_NEGOTIATED_PRICES")')
end = s.index('    if (action === "SET_MARKET_SELL_LOCK")', start)
s = s[:start] + '''    if (action === "SET_NEGOTIATED_PRICES") {
      return NextResponse.json({ error: "Direct sales and negotiated sale prices are disabled." }, { status: 403 });
    }

''' + s[end:]
s = s.replace("Direct trades and swaps are exempt.", "Share swaps are exempt.")
write(file, s)

file = "src/components/trading-terminal.tsx"
s = read(file).replace("calculateMarketSale, isValidPeerPrice", "calculateMarketSale")
s = re.sub(r'^.*const \[(directSellOffers|sellTargetMode|sellTargetTeamId|offerPriceDraft),.*\n', '', s, flags=re.M)
s = s.replace('  useEffect(() => {\n    if (orderModal.isOpen && orderModal.stock) setOfferPriceDraft(orderModal.stock.currentPrice.toFixed(2));\n  }, [orderModal.isOpen, orderModal.stock?.ticker]);\n', '')
s = re.sub(r'^.*set(DirectSellOffers|SellTargetMode|SellTargetTeamId)\(.*\n', '', s, flags=re.M)
start = s.index('    if (orderModal.action === "SELL" && sellTargetMode === "DIRECT_TEAM"')
end = s.index('    setIsSubmittingOrder(true);', start)
s = s[:start] + s[end:]
s = s.replace(' && sellTargetMode === "MARKET_POOL"', '')
start = s.index('          pricePerShare:')
end = s.index('\n        }),', start)
s = s[:start] + '          targetTeamId: "MARKET_POOL",' + s[end:]
start = s.index('      if (data.isDirectSell) {')
end = s.index('      fetchState();', start)
# Keep only the existing executed-order toast, without the obsolete offer branch.
block = s[start:end]
executed = block[block.index('        toast.success(`Executed'):]
executed = executed[:executed.index('\n      }')]
s = s[:start] + executed + '\n' + s[end:]
start = s.index('  // Direct Sell Offer Actions')
end = s.index('  const handleProposeSwap', start)
s = s[:start] + s[end:]
start = s.index('  // Incoming and Outgoing 120s')
end = s.index('  // Dynamic Sectors', start)
s = s[:start] + s[end:]
s = re.sub(r'^  const negotiatedOffer =.*\n', '', s, flags=re.M)
s = s.replace('const orderPrice = negotiatedOffer ? Number(offerPriceDraft) :', 'const orderPrice =')
start = s.index('        {/* Incoming 120s Direct Purchase')
end = s.index('        {/* Incoming Swap Toast', start)
s = s[:start] + s[end:]
marker = s.index('Direct to Team (120s)')
start = s.rfind('              {orderModal.action === "SELL" && (', 0, marker)
assert start != -1
end = s.index('              {orderModal.action === "SELL" && salePreview', marker)
s = s[:start] + '''              {orderModal.action === "SELL" && (
                <div className="p-3 rounded-lg border border-[#27272a] bg-[#030303] text-xs space-y-1">
                  <p className="font-bold text-white">Sell destination: Market pool</p>
                  <p className="text-[#a1a1aa]">Shares sell at the current market price. To exchange shares with another team, propose a swap.</p>
                </div>
              )}

''' + s[end:]
s = re.sub(r'^.*Boolean\(negotiatedOffer\).*\n', '', s, flags=re.M)
s = s.replace(' ||\n                  (orderModal.action === "SELL" && sellTargetMode === "DIRECT_TEAM" && !sellTargetTeamId)', '')
s = re.sub(r'                  : orderModal.action === "SELL" && sellTargetMode === "DIRECT_TEAM"\n.*\n', '', s)
s = s.replace(' {sellTargetMode === "DIRECT_TEAM" && "Direct sales are exempt."}', '')
s = s.replace('two direct trades or accepted swaps', 'two accepted swaps').replace('2 direct trades or accepted swaps', '2 accepted swaps').replace('2 Peer Trades', '2 Accepted Swaps').replace('peer trades', 'accepted swaps')
s = s.replace('Sell shares you own back to the market or choose a practice bot as the buyer. Bots accept direct sales immediately here; participants decide for themselves in the competition.', 'Sell shares you own back to the market at its current price. When the sale lock is enabled, complete two swaps first. Share swaps are the only way to exchange stocks with other teams.')
s = s.replace('incoming swap or direct sale', 'incoming swap')
write(file, s)

file = "src/app/admin/page.tsx"
s = read(file)
start = s.index('                <button type="button" role="switch" aria-checked={Boolean(gameState?.negotiatedPricesEnabled)}')
end = s.index('                <div className="p-4 bg-[#030303] border border-[#1e1e1e] rounded-xl space-y-3">', start)
s = s[:start] + s[end:]
s = s.replace('2 direct trades or accepted swaps', '2 accepted swaps').replace('Direct sales and swaps are exempt.', 'Share swaps are exempt.')
write(file, s)

file = "src/lib/demo-market.ts"
s = read(file).replace("calculateMarketSale, isValidPeerPrice", "calculateMarketSale").replace("negotiatedPricesEnabled: true", "negotiatedPricesEnabled: false")
start = s.index('    if (["ACCEPT_DIRECT_SELL"')
end = s.index('    const stock =', start)
s = s[:start] + '''    if (["ACCEPT_DIRECT_SELL", "REJECT_DIRECT_SELL", "CANCEL_DIRECT_SELL"].includes(body.action) ||
      (body.action === "SELL" && body.targetTeamId && body.targetTeamId !== "MARKET_POOL")) return fail("Direct sales between teams are disabled. Sell to the market or swap shares.");
''' + s[end:]
start = s.index('      const buyer = market.teams[body.targetTeamId];')
end = s.index('\n    }\n  }', start)
s = s[:start] + '''      if (market.gameState.marketSellLockEnabled && getPeerTradeCount(team, 1) < REQUIRED_PEER_TRADES) return fail("Complete two accepted practice swaps to unlock market sales, or turn off the practice sale lock.");
      const price = stock.currentPrice;
      const percent = market.gameState.marketSellCommissionEnabled ? market.gameState.marketSellCommissionPercent : 0;
      const sale = calculateMarketSale(price, qty, percent);
      team.portfolio[stock.ticker] -= qty;
      if (!team.portfolio[stock.ticker]) delete team.portfolio[stock.ticker];
      team.cashBalance = Number((team.cashBalance + sale.netTotal).toFixed(2));
      stock.availableSupply += qty;
      record("SELL", stock.ticker, qty, price);
      Object.assign(market.transactions[0], { grossTotal: sale.grossTotal, commissionAmount: sale.commissionAmount, commissionPercent: percent, total: sale.netTotal });
      return ok({ sale, message: `Practice market sale complete. Commission: $${sale.commissionAmount.toFixed(2)}; net received: $${sale.netTotal.toFixed(2)}.` });''' + s[end:]
s = re.sub(r'^  market.directSellOffers.push\(.*\n', '', s, flags=re.M)
write(file, s)

file = "src/lib/db/index.ts"
s = read(file).replace('  negotiatedPricesEnabled?: boolean;', '  negotiatedPricesEnabled?: boolean;\n  peerTradeRule?: "SWAPS_ONLY";')
s = s.replace('    negotiatedPricesEnabled: false,', '    negotiatedPricesEnabled: false,\n    peerTradeRule: "SWAPS_ONLY",')
s = s.replace('  // Preserve credit for completed peer trades in sessions created before this rule.', '''  // Migrate the previous direct-sale credits to completed share swaps only.
  if (state.peerTradeRule !== "SWAPS_ONLY") {
    Object.values(state.teams).forEach((team) => { delete team.peerTradesByRound; });
    state.peerTradeRule = "SWAPS_ONLY";
  }
  // Historical direct sales used SWAP as their type; actual swaps have both legs in the ticker.''')
s = s.replace('(tx.type === "SWAP" || tx.type === "DIRECT_SELL")', '(tx.type === "SWAP" && tx.ticker.includes("⇄"))')
write(file, s)

file = "DEPLOYMENT.md"
s = read(file).replace('two completed peer trades', 'two completed swaps').replace('Direct purchases/sales and accepted swaps count for both teams.', 'Accepted swaps count for both teams. Direct stock sales between teams are permanently disabled; pending direct offers are cancelled.').replace('Negotiated direct-sale prices start enabled.', 'Negotiated direct-sale prices are unavailable.').replace('negotiated sales', 'direct-sale rejection')
write(file, s)
print("Disabled direct sales in backend, terminal, demo, admin controls and saved-state migration.")
