import entityConfig from "../shared/entity-config.json"

export type EntityConfig = typeof entityConfig;
export type PlayerConfig = typeof entityConfig["player"];
export type ShipConfig = typeof entityConfig["ship"];