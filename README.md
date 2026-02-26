# Poop Deck Pirates
A top down 2d multiplayer game where you play as a pirate sailing around, finding treaure and fighting other players. Available at https://www.poopdeckpirates.com/.

## Making changes to the game locally
If making changes to the game on your local machine:
  1. Clone the repository and open in Visual Studio Code or another editor.
  2. Navigate to the PirateGame directory if not already inside it.
  3. Run the command ```npm install``` in the terminal to update and install node dependencies.
  4. Launch the server with ```npm start``` and access the game at ```localhost:3000```.
  5. Make any changes required, push to a separate branch and make a pull request.


## centralised config values and functions

## Server Configuration - serverConfig.json

### Spawn
`SPAWN.PLAYER.X` - Player spawn X position relative to the ship
`SPAWN.PLAYER.Y` - Player spawn Y position relative to the ship
`SPAWN.SHIP.X` - Ship world spawn X coordinate
`SPAWN.SHIP.Y` - Ship world spawn Y coordinate

### Ship
`SHIP.DIMENSIONS.HEIGHT` - Length of the ship hull
`SHIP.DIMENSIONS.MIDDLEWIDTH` - Width of the ship at its widest point
`SHIP.DIMENSIONS.BOWLENGTH` - Length of the ship bow
`SHIP.DIMENSIONS.STERNRADIUS` - Radius of the ship stern
`SHIP.MAX_HEALTH` - Base maximum hull health
`SHIP.CREW_CAPACITY` - Base maximum crew members
`SHIP.ACCELERATION` - Base acceleration (grids/s²)
`SHIP.MAX_SPEED` - Base maximum speed (grids/s)
`SHIP.CANNON_DAMAGE` - Base cannon damage per hit
`SHIP.CANNON_RANGE` - Base cannon range (grids)
`SHIP.CANNON_COUNT` - Base number of cannons per side
`SHIP.RAMMING_POWER` - Base damage dealt and received when ramming
`SHIP.MINIMAP_RANGE` - Base minimap vision range (grids)
`SHIP.VISION_RANGE` - Base camera zoom steps available
`SHIP.STOP_POWER` - Base stopping speed when anchor is deployed (seconds)
`SHIP.DEPLOY_TIME` - Base time to deploy anchor (seconds)
`SHIP.RETRIEVE_TIME` - Base time to retrieve anchor (seconds)
`SHIP.TURN_SPEED` - Base turn speed (degrees/s at full rudder)
`SHIP.RESPONSE_TIME` - Base rudder response time (seconds)
`SHIP.FIRE_RATE` - Base cannon reload time (seconds)
`SHIP.ACCURACY` - Base cannon spread cone (degrees)
`SHIP.WEIGHT` - Base ship weight
`SHIP.FRICTION_AIR` - Air friction applied to the ship physics body

### Player
`PLAYER.MAX_HEALTH` - Player maximum health
`PLAYER.SPEED` - Player movement speed on ship and land
`PLAYER.SWIM_SPEED` - Player movement speed while swimming
`PLAYER.RADIUS` - Physics collision radius of the player
`PLAYER.PADDING` - Padding used for boundary/collision calculations

### Shop
`SHOP.X` - World X coordinate of the shop
`SHOP.Y` - World Y coordinate of the shop

## UI Configuration - UIConfig.json

### Minimap
`MINIMAP.SIZE` - Width and height of the minimap panel in pixels
`MINIMAP.IMG_SRC` - Path to the minimap background image
`MINIMAP.POSITION.TOP` - Distance from the top of the screen (keep in sync with `#minimap-container` in `styles.css`)
`MINIMAP.POSITION.LEFT` - Distance from the left of the screen (keep in sync with `#minimap-container` in `styles.css`)
`MINIMAP.MARKER.RADIUS` - Radius of the player dot on the minimap canvas, in pixels
`MINIMAP.MARKER.FILL` - Fill colour of the player dot
`MINIMAP.MARKER.STROKE` - Outline colour of the player dot
`MINIMAP.MARKER.LINE_WIDTH` - Stroke width of the player dot outline

### Message Text
`MESSAGE_TEXT.FONT_SIZE` - Font size of the on-screen message text
`MESSAGE_TEXT.COLOR` - Text colour of the on-screen message
`MESSAGE_TEXT.BACKGROUND` - Background colour of the on-screen message

### Debug Menu
`DEBUG_MENU.TOGGLE_KEY` - Keyboard key used to open/close the debug menu (must match a key in `Phaser.Input.Keyboard.KeyCodes`)
