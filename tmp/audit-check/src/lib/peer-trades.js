"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REQUIRED_PEER_TRADES = void 0;
exports.getPeerTradeCount = getPeerTradeCount;
exports.recordPeerTrade = recordPeerTrade;
exports.REQUIRED_PEER_TRADES = 2;
function getPeerTradeCount(team, round) {
    return team.peerTradesByRound?.[round] || 0;
}
function recordPeerTrade(team, round) {
    team.peerTradesByRound ??= {};
    team.peerTradesByRound[round] = getPeerTradeCount(team, round) + 1;
}
