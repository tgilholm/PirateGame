export default class DeathScene extends Phaser.Scene{
    constructor(){
        super('DeathScene');
    }

create(){
    const inputForm = document.getElementById('input-form');
    const centerX = this.scale.width/2;
    const centerY = this.scale.height/2;

    this.cameras.main.fadeIn(500, 0, 0, 0);

    const deathScreenText = this.add.text(centerX, centerY - 40, "YOU DIED!", { 
        fontSize: '64px',
        fontFamily: 'Arial Black',
        color: '#ff3b3b',
        stroke: '#000000',
        strokeThickness: 8}).setOrigin(0.5);

     const respawnPrompt = this.add.text(centerX, centerY + 30, "Click To Respawn",{
        fontSize: '20px', 
        fontFamily: 'Arial',
        color: '#ffffff'
     }).setOrigin(0.5);

     this.input.once('pointerdown', ()=> {
        this.scene.start('Start');
        inputForm.style.display = 'flex';
     });
    }
}