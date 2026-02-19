export default class gameState {
    constructor() {
        this.zoomLevel = 'normal'; // 'normal' or 'zoomed-out'
        this.controlMode = 'player'; // 'player' or 'ship'
        this.playerLocation = 'ship'; // 'ship', 'land', 'water'
        this.inventory = []; // player inventory
        
        // Zoom constants
        this.ZOOM_NORMAL = 1.0;
        this.ZOOM_OUT = 0.25;
    }
    
    setZoom(level) {
        this.zoomLevel = level;
        this.controlMode = level === 'zoomed-out' ? 'ship' : 'player';
    }
    
    toggleZoom() {
        const newLevel = this.zoomLevel === 'normal' ? 'zoomed-out' : 'normal';
        this.setZoom(newLevel);
        return this.zoomLevel;
    }
    
    getZoomValue() {
        return this.zoomLevel === 'zoomed-out' ? this.ZOOM_OUT : this.ZOOM_NORMAL;
    }
    
    canControlShip() {
        return this.controlMode === 'ship';
    }
    
    canControlPlayer() {
        return this.controlMode === 'player';
    }
    
}