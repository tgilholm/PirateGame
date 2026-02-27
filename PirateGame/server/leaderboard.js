// server/engine/leaderboard.js
export default class Leaderboard {
    constructor({ topN = 10 } = {}) {
        this.topN = topN;
        /** @type {Map<string, { playerId: string, username: string, score: number }>} */
        this.byPlayer = new Map();
    }

    upsertPlayer(playerId, username) {
        const existing = this.byPlayer.get(playerId);
        if (existing) {
            existing.username = username ?? existing.username;
            return;
        }
        this.byPlayer.set(playerId, { playerId, username: username || "Anonymous", score: 0 });
    }

    removePlayer(playerId) {
        this.byPlayer.delete(playerId);
    }

    setScore(playerId, score) {
        const entry = this.byPlayer.get(playerId);
        if (!entry) return;
        entry.score = Number.isFinite(score) ? score : entry.score;
    }

    addScore(playerId, delta) {
        const entry = this.byPlayer.get(playerId);
        if (!entry) return;
        const d = Number(delta);
        if (!Number.isFinite(d)) return;
        entry.score += d;
    }

    top() {
        return [...this.byPlayer.values()]
            .sort((a, b) => b.score - a.score)
            .slice(0, this.topN);
    }
}