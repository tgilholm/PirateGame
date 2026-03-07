import entityConfig from "../../shared/entity-config.json"

// Provides type hinting to both TS and JS files using the shared entity config
// This makes it easier to use the entity config without needing to import it directly into the file being used

export type EntityConfig = typeof entityConfig;
export type PlayerConfig = typeof entityConfig["player"];
export type ShipConfig = typeof entityConfig["ship"];