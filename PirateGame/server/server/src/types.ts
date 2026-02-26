export type EntityConfig = typeof import("./entity-config.json");

export type PlayerConfig = EntityConfig["player"];
export type ShipConfig = EntityConfig["ship"];

