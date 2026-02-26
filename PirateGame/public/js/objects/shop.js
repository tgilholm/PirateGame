
export default class Shop {
    constructor(scene, x, y, radius = 40) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.interactRange = radius * 1.5;

        //draws shop
        this.graphic = scene.add.graphics();
        this.graphic.fillStyle(0xff0000, 0.8);
        this.graphic.fillCircle(x, y, radius);
    }

    //checks if player is close enough to interact with shop, called every frame
    update(player, keys, ui) {
        const dist = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, this.x, this.y);

        if (dist < this.interactRange) {
            ui.promptEl.textContent = "(E) Enter Shop";
            ui.promptEl.style.display = "block";
            if (Phaser.Input.Keyboard.JustDown(keys.E)) {
                ui.shopUI.open();
            }
        }
    }
}
