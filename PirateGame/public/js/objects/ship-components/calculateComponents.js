const TYPES_URL = '/js/objects/ship-components/types.json';

const DEFAULT_COMPONENTS = {
    body: 'LVL1',
    sails: 'LVL1',
    cannons: 'LVL1',
    head: 'LVL1',
    crowsNest: 'LVL1',
    anchor: 'LVL1',
    rudder: 'LVL1',
    crew: 'LVL1'
};

let cachedTypes = null;

const IS_NODE = typeof process !== 'undefined' && !!process.versions?.node;

async function loadTypesFromNode() {
    const fileUrl = new URL('./types.json', import.meta.url);
    const { readFile } = await import('node:fs/promises');
    const contents = await readFile(fileUrl, 'utf-8');
    return JSON.parse(contents);
}

async function getTypes() {
    if (cachedTypes) {
        return cachedTypes;
    }

    if (IS_NODE) {
        cachedTypes = await loadTypesFromNode();
        return cachedTypes;
    }

    const response = await fetch(TYPES_URL);
    if (!response.ok) {
        throw new Error(`Failed to load types.json: ${response.status}`);
    }

    cachedTypes = await response.json();
    return cachedTypes;
}

function normalizeComponents(components) {
    return {
        ...DEFAULT_COMPONENTS,
        ...components
    };
}

export function updateShipComponent(currentComponents, componentType, variant) {
    const nextComponents = normalizeComponents(currentComponents);
    const key = componentType === 'crowsnest' ? 'crowsNest' : componentType;
    if (Object.prototype.hasOwnProperty.call(nextComponents, key)) {
        nextComponents[key] = variant;
    }
    return nextComponents;
}

export async function calculateShipStats(components = {}) {
    const types = await getTypes();
    const selection = normalizeComponents(components);

    return {
        //body
        maxHealth: 0 + types.components.body.variants[selection.body].stats.maxHealth,
        crewCapacity: 0 + types.components.body.variants[selection.body].stats.crewCapacity,

        //sails
        acceleration: 0 + types.components.sails.variants[selection.sails].stats.acceleration,
        maxSpeed: 0 + types.components.sails.variants[selection.sails].stats.maxSpeed,

        //cannons
        damage: 0 + types.components.cannons.variants[selection.cannons].stats.damage,
        range: 0 + types.components.cannons.variants[selection.cannons].stats.range,
        cannonCount: 0 + types.components.cannons.variants[selection.cannons].stats.cannonCount,

        //head
        rammingPower: 0 + types.components.head.variants[selection.head].stats.rammingPower,

        //crows nest
        minimapRange: 0 + types.components.crowsNest.variants[selection.crowsNest].stats.minimapRange,
        visionRange: 0 + types.components.crowsNest.variants[selection.crowsNest].stats.visionRange,
        crewSlots: 0 + types.components.crowsNest.variants[selection.crowsNest].stats.crewSlots,

        //anchor
        stopPower: 0 + types.components.anchor.variants[selection.anchor].stats.stopPower,
        deployTime: 0 + types.components.anchor.variants[selection.anchor].stats.deployTime,
        retrieveTime: 0 + types.components.anchor.variants[selection.anchor].stats.retrieveTime,

        //rudder
        turnSpeed: 0 + types.components.rudder.variants[selection.rudder].stats.turnSpeed,
        responseTime: 0 + types.components.rudder.variants[selection.rudder].stats.responseTime,
        straighteningSpeed: 0 + types.components.rudder.variants[selection.rudder].stats.straighteningSpeed,

        //crew
        fireRate: 0 + types.components.crew.variants[selection.crew].stats.fireRate,
        accuracy: 0 + types.components.crew.variants[selection.crew].stats.accuracy,

        //universal
        weight: 0
            + types.components.body.variants[selection.body].stats.weight
            + types.components.sails.variants[selection.sails].stats.weight
            + types.components.cannons.variants[selection.cannons].stats.weight
            + types.components.head.variants[selection.head].stats.weight
            + types.components.crowsNest.variants[selection.crowsNest].stats.weight
            + types.components.anchor.variants[selection.anchor].stats.weight
            + types.components.rudder.variants[selection.rudder].stats.weight
            + types.components.crew.variants[selection.crew].stats.weight
    };
}

export function logStats(stats) {
    // Body Stats
    console.log('Max Health:', stats.maxHealth);
    console.log('Crew Capacity:', stats.crewCapacity);

    // Sails Stats
    console.log('Acceleration:', stats.acceleration);
    console.log('Max Speed:', stats.maxSpeed);

    // Cannons Stats
    console.log('Damage:', stats.damage);
    console.log('Range:', stats.range);
    console.log('Cannon Count:', stats.cannonCount);

    // Head Stats
    console.log('Ramming Power:', stats.rammingPower);

    // Crow's Nest Stats
    console.log('Minimap Range:', stats.minimapRange);
    console.log('Vision Range:', stats.visionRange);
    console.log('Crew Slots:', stats.crewSlots);

    // Anchor Stats
    console.log('Stop Power:', stats.stopPower);
    console.log('Deploy Time:', stats.deployTime);
    console.log('Retrieve Time:', stats.retrieveTime);

    // Rudder Stats
    console.log('Turn Speed:', stats.turnSpeed);
    console.log('Response Time:', stats.responseTime);
    console.log('Straightening Speed:', stats.straighteningSpeed);

    // Crew Stats
    console.log('Fire Rate:', stats.fireRate);
    console.log('Accuracy:', stats.accuracy);

    // Universal Stats
    console.log('Weight:', stats.weight);
}

