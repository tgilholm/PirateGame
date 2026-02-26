
export default class Shop {
    constructor(scene, x, y, radius = 40) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.interactRange = radius * 1.5;

        //draw shop
        this.graphic = scene.add.graphics();
        this.graphic.fillStyle(0xff0000, 0.8);
        this.graphic.fillCircle(x, y, radius);
    }

    //call once per frame when the player is in global space
    update(player, keys, ui) {
        const dist = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, this.x, this.y);

        if (dist < this.interactRange) {
            ui.showPrompt("(E) Enter Shop");
            if (Phaser.Input.Keyboard.JustDown(keys.E)) {
                ui.openShop();
            }
        }
    }
}
