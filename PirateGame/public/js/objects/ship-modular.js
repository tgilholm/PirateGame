import Parent from "./parent.js";
import { Sails, Cannons, Head, Body, CrowsNest, Anchor, Rudder } from './ship-components/index.js';
import { getPreset, createCustomShip } from './ship-components/shipPresets.js';

/**
 * ModularShip - A ship built from interchangeable components
 * This class demonstrates the component-based ship system where you can
 * mix and match different parts to create unique ship configurations.
 */
export default class ModularShip extends Parent {
    constructor(scene, x, y, config = null) {
        super(scene, x, y);
        
        // Ship components
        this.components = {
            body: null,
            sails: null,
            cannons: null,
            head: null,
            crowsnest: null,
            anchor: null,
            rudder: null
        };

        // Combined ship stats (calculated from components)
        this.stats = {
            health: 0,
            maxHealth: 0,
            speed: 0,
            turnRate: 0,
            armor: 0,
            firepower: 0,
            cargoCapacity: 0,
            crewCapacity: 0
        };

        // Configuration
        this.config = config;
        
        // Initialize the ship
        this.initializeShip(config);
    }

    /**
     * Initialize ship from configuration
     * @param {Object|String} config - Configuration object or preset name
     */
    initializeShip(config) {
        let shipConfig;

        // If config is a string, treat it as a preset name
        if (typeof config === 'string') {
            shipConfig = getPreset(config);
        }
        // If config is an object with components, use it directly
        else if (config && config.components) {
            shipConfig = config;
        }
        // Otherwise use default/custom configuration
        else {
            shipConfig = createCustomShip(config || {});
        }

        // TODO: Store the configuration
        this.config = shipConfig;

        // TODO: Create all components
        this.createComponents(shipConfig.components);

        // TODO: Calculate combined stats
        this.calculateStats();

        // TODO: Arrange components visually
        this.arrangeComponents();
    }

    /**
     * Create all ship components based on configuration
     * @param {Object} componentConfig - Configuration for each component
     */
    createComponents(componentConfig) {
        // TODO: Create body component (hull)
        if (componentConfig.body) {
            this.components.body = new Body(this.scene, componentConfig.body);
            // TODO: Initialize and add to container
        }

        // TODO: Create sails component
        if (componentConfig.sails) {
            this.components.sails = new Sails(this.scene, componentConfig.sails);
            // TODO: Initialize and add to container
        }

        // TODO: Create cannons component
        if (componentConfig.cannons) {
            this.components.cannons = new Cannons(this.scene, componentConfig.cannons);
            // TODO: Initialize and add to container
        }

        // TODO: Create head (figurehead) component
        if (componentConfig.head && componentConfig.head !== 'none') {
            this.components.head = new Head(this.scene, componentConfig.head);
            // TODO: Initialize and add to container
        }

        // TODO: Create crow's nest component
        if (componentConfig.crowsnest && componentConfig.crowsnest !== 'none') {
            this.components.crowsnest = new CrowsNest(this.scene, componentConfig.crowsnest);
            // TODO: Initialize and add to container
        }

        // TODO: Create anchor component
        if (componentConfig.anchor) {
            this.components.anchor = new Anchor(this.scene, componentConfig.anchor);
            // TODO: Initialize and add to container
        }

        // TODO: Create rudder component
        if (componentConfig.rudder) {
            this.components.rudder = new Rudder(this.scene, componentConfig.rudder);
            // TODO: Initialize and add to container
        }
    }

    /**
     * Arrange all components in their proper positions on the ship
     */
    arrangeComponents() {
        // TODO: Position each component relative to ship center
        // TODO: Use component offset values
        // TODO: Create sprites for each component
        // TODO: Set proper layering/depth for each component
        
        // Suggested order (back to front):
        // 1. Body (hull) - base layer
        // 2. Anchor - on hull
        // 3. Rudder - at stern
        // 4. Cannons - on sides
        // 5. Sails - middle/upper
        // 6. Crow's nest - top
        // 7. Head (figurehead) - at bow
    }

    /**
     * Calculate combined ship stats from all components
     */
    calculateStats() {
        // TODO: Reset stats
        this.stats = {
            health: 0,
            maxHealth: 0,
            speed: 0,
            turnRate: 0,
            armor: 0,
            firepower: 0,
            cargoCapacity: 0,
            crewCapacity: 0
        };

        // TODO: Add stats from body (hull)
        if (this.components.body) {
            const bodyStats = this.components.body.getStats();
            // TODO: Aggregate body stats
        }

        // TODO: Add stats from sails
        if (this.components.sails) {
            const sailStats = this.components.sails.getStats();
            // TODO: Apply speed and turn modifiers
        }

        // TODO: Add stats from cannons
        if (this.components.cannons) {
            const cannonStats = this.components.cannons.getStats();
            // TODO: Calculate firepower
        }

        // TODO: Add bonuses from other components
        // Head, crow's nest, anchor, rudder

        // TODO: Apply synergy bonuses
        // Some component combinations work better together

        // TODO: Calculate final derived stats
    }

    /**
     * Update ship and all its components
     * @param {Number} delta - Time since last frame
     */
    update(delta) {
        // TODO: Update base Parent class
        super.interpolate();

        // TODO: Update each component
        if (this.components.body) this.components.body.update(delta);
        if (this.components.sails) this.components.sails.update(delta);
        if (this.components.cannons) this.components.cannons.update(delta);
        if (this.components.head) this.components.head.update(delta);
        if (this.components.crowsnest) this.components.crowsnest.update(delta);
        if (this.components.anchor) this.components.anchor.update(delta);
        if (this.components.rudder) this.components.rudder.update(delta);

        // TODO: Update ship physics based on component stats
        // TODO: Handle component interactions
    }

    /**
     * Replace a component with a different variant
     * @param {String} componentType - Type of component to replace
     * @param {String} variant - New variant to use
     */
    replaceComponent(componentType, variant) {
        // TODO: Remove old component
        if (this.components[componentType]) {
            this.components[componentType].destroy();
        }

        // TODO: Create new component based on type
        switch (componentType) {
            case 'body':
                this.components.body = new Body(this.scene, variant);
                break;
            case 'sails':
                this.components.sails = new Sails(this.scene, variant);
                break;
            case 'cannons':
                this.components.cannons = new Cannons(this.scene, variant);
                break;
            case 'head':
                this.components.head = new Head(this.scene, variant);
                break;
            case 'crowsnest':
                this.components.crowsnest = new CrowsNest(this.scene, variant);
                break;
            case 'anchor':
                this.components.anchor = new Anchor(this.scene, variant);
                break;
            case 'rudder':
                this.components.rudder = new Rudder(this.scene, variant);
                break;
        }

        // TODO: Re-initialize the new component
        // TODO: Re-position it on the ship
        // TODO: Recalculate ship stats
        this.calculateStats();
    }

    /**
     * Get a specific component
     * @param {String} componentType - Type of component to get
     * @returns {ShipComponent} The requested component
     */
    getComponent(componentType) {
        return this.components[componentType];
    }

    /**
     * Get all ship stats
     * @returns {Object} Complete stats object
     */
    getStats() {
        return this.stats;
    }

    /**
     * Fire cannons
     * @param {String} side - 'port' or 'starboard'
     * @param {Object} target - Target to fire at
     */
    fireCannons(side, target) {
        // TODO: Check if cannons exist
        if (this.components.cannons) {
            // TODO: Delegate to cannons component
            this.components.cannons.fire(side, target);
        }
    }

    /**
     * Deploy anchor
     */
    deployAnchor() {
        // TODO: Check if anchor exists
        if (this.components.anchor) {
            // TODO: Delegate to anchor component
            this.components.anchor.deploy();
        }
    }

    /**
     * Retrieve anchor
     */
    retrieveAnchor() {
        // TODO: Check if anchor exists
        if (this.components.anchor) {
            // TODO: Delegate to anchor component
            this.components.anchor.retrieve();
        }
    }

    /**
     * Take damage to the ship
     * @param {Number} damage - Amount of damage
     * @param {String} location - Location of hit (optional)
     */
    takeDamage(damage, location) {
        // TODO: Determine which component was hit
        // TODO: Apply damage to that component
        // TODO: If body (hull) is hit, reduce overall health
        // TODO: Recalculate stats if component is damaged
        // TODO: Visual damage effects
    }

    /**
     * Repair the ship
     * @param {Number} amount - Amount to repair
     * @param {String} componentType - Specific component to repair (optional)
     */
    repair(amount, componentType = null) {
        // TODO: If specific component specified, repair it
        // TODO: Otherwise distribute repair across all damaged components
        // TODO: Recalculate stats after repair
    }

    /**
     * Destroy ship and all components
     */
    destroy() {
        // TODO: Destroy all components
        Object.values(this.components).forEach(component => {
            if (component) component.destroy();
        });

        // TODO: Clean up container and graphics
        super.destroy();
    }
}
