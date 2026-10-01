"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.snapshotFinalScores = snapshotFinalScores;
const market_data_1 = require("./market-data");
function snapshotFinalScores(state) {
    const cents = (amount) => Math.round(amount * 100) / 100;
    const teams = Object.values(state.teams).map((team) => {
        const holdings = Object.entries(team.portfolio).filter(([, quantity]) => quantity > 0).map(([ticker, quantity]) => ({
            ticker,
            name: market_data_1.STOCKS_DATA.find((stock) => stock.ticker === ticker)?.name || ticker,
            quantity,
            price: state.stockPrices[ticker] || 0,
            value: cents(quantity * (state.stockPrices[ticker] || 0)),
        }));
        const cashBalance = cents(team.cashBalance);
        const holdingsValue = cents(holdings.reduce((total, holding) => total + holding.value, 0));
        const totalValue = cents(cashBalance + holdingsValue);
        return { id: team.id, teamName: team.teamName, rank: 0, cashBalance, holdingsValue, totalValue, profit: cents(totalValue - 100000), holdings };
    }).sort((a, b) => b.totalValue - a.totalValue || a.teamName.localeCompare(b.teamName) || a.id.localeCompare(b.id));
    teams.forEach((team, index) => {
        team.rank = index > 0 && team.totalValue === teams[index - 1].totalValue ? teams[index - 1].rank : index + 1;
    });
    return { startedAt: Date.now(), revealedCount: 0, teams };
}
