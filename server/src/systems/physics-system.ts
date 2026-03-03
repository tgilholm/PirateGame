import EntityRegistry from "../engine/entity-registry";
import Matter from 'matter-js';
import { BaseSystem } from "./base-system";
import TerrainMap from "../engine/terrain-map";
import Ship from "../entities/ship";

export default class PhysicsSystem implements BaseSystem {
    constructor(
        private registry: EntityRegistry,
        private engine: Matter.Engine,
        terrainMap: TerrainMap
    ) {
        this.initTerrain(terrainMap);
    }


    private initTerrain(terrainMap: TerrainMap): void {
        const W = terrainMap.widthInPixels;
        const H = terrainMap.heightInPixels;
        const T = 2000; // wall thickness

        const walls = [
            Matter.Bodies.rectangle(W / 2, -T / 2, W, T, { isStatic: true, label: 'bound' }), // top
            Matter.Bodies.rectangle(W / 2, H + T / 2, W, T, { isStatic: true, label: 'bound' }), // bottom
            Matter.Bodies.rectangle(-T / 2, H / 2, T, H, { isStatic: true, label: 'bound' }), // left
            Matter.Bodies.rectangle(W + T / 2, H / 2, T, H, { isStatic: true, label: 'bound' }), // right
        ];

        Matter.World.add(this.engine.world, walls);

        // Add a rectangle at each solid object
        terrainMap.getIslandTiles().forEach(({ worldX, worldY }) => {
            const body = Matter.Bodies.rectangle(
                worldX, worldY,
                terrainMap.tileWidth, terrainMap.tileWidth,
                { isStatic: true, label: 'island' }
            );
            Matter.World.add(this.engine.world, body);
        });

        console.log(`[PhysicsSystem] Added island collision bodies`);
    }

    public addBody(body: Matter.Body): void {
        Matter.World.add(this.engine.world, body);
    }

    public removeBody(body: Matter.Body): void {
        Matter.World.remove(this.engine.world, body);
    }

    public update(dt: number): void {
        Matter.Engine.update(this.engine, dt * 1000);

        // Sync matter body state back to ship entities
        this.registry.getByType<Ship>('ship').forEach(ship => {

            ship.x = ship.body.position.x;
            ship.y = ship.body.position.y;
            ship.r = ship.body.angle;
            ship.vx = ship.body.velocity.x;
            ship.vy = ship.body.velocity.y;
            ship.av = ship.body.angularVelocity;
        });
    }
}