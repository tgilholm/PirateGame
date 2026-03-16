import Player from '../entities/player';//lots of logic to be added soon

export default class GoldHandler {

    //checks if player has enough gold for a purchase
    canAfford(player: Player, cost: number): boolean {
        return player.gold >= cost;
    }

    //removes gold from player after a purchase
    spendGold(player: Player, amount: number): void {
        player.gold -= amount;
    }

    //gives gold to player
    giveGold(player: Player, amount: number): void {
        player.gold += amount;
    }

    //attempts to spend gold returns true and deducts if affordable
    trySpendGold(player: Player, amount: number): boolean {
        if (!this.canAfford(player, amount)) return false;
        this.spendGold(player, amount);
        return true;
    }
}