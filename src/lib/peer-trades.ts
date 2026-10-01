interface PeerTradeProgress {
  peerTradesByRound?: Record<number, number>;
}

export const REQUIRED_PEER_TRADES = 2;

export function getPeerTradeCount(team: PeerTradeProgress, round: number): number {
  return team.peerTradesByRound?.[round] || 0;
}

export function recordPeerTrade(team: PeerTradeProgress, round: number) {
  team.peerTradesByRound ??= {};
  team.peerTradesByRound[round] = getPeerTradeCount(team, round) + 1;
}
