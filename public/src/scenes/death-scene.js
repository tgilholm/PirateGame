class DeathScene extends Phaser.Scene{
    constructor(){
        super('DeathScene')
    }

    create(){
        this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            "YOU DIED!", {fontSize: "48px", cp}
        )
        
    }
}




/*TO DO:
    - Check player health when damage updated, if health =< 0, trigger game over screen
    - Game over screen will show the players gold and potentially survival time?
    - Game over screen will prompt the player to try again which will take them back to the main screen */