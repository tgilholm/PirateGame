export default class DeathScene extends Phaser.Scene{
    constructor(){
        super('DeathScene');
    }

create(){
    const centerX = this.scale.width/2;
    const centerY = this.scale.height/2;

    const deathScreenText = this.add.text(centerX, centerY, "YOU DIED!" );
}
}