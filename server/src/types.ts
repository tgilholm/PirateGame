export type EntityConfig = typeof import("@shared/entity-config.json");

export type PlayerConfig = EntityConfig["player"];
export type ShipConfig = EntityConfig["ship"];

