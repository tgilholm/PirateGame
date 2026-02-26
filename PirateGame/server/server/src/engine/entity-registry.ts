import Entity from "../entities/entity";

/**
 * Repository-pattern class implementing CRUD (create, retrieve, update, delete) methods
 * on all entity-derived types. Holds a list of all the entities currently in a world.
 */
export default class EntityRegistry {
    private entities: Map<string, Entity> = new Map();
    private entitiesByType: Map<string, Set<string>> = new Map();


    /**
     * Adds a pre-constructed Entity to the entity register
     * @param entity the pre-constructed Entity to add
     */
    public create(entity: Entity): void {
        this.entities.set(entity.id, entity);
        // Update type index
        if (!this.entitiesByType.has(entity.type)) {
            this.entitiesByType.set(entity.type, new Set());
        }
        this.entitiesByType.get(entity.type)!.add(entity.id);

        console.debug(`[Registry] Added ${entity.type}:${entity.id}`);
    }

    /**
     * Type-safe GET method. Retrieves an entity by its ID
     * @param id the id of the entity to retrieve
     * @returns the entity or subtype of Entity
     */
    public get<T extends Entity>(id: string): T | undefined 
    {
        return this.entities.get(id) as T;  // Cast to the subtype
    }

    /**
     * Retrieves all entities currently in the register
     * @returns an array of entities
     */
    public getAll(): Entity[] {
        return Array.from(this.entities.values());
    }

    public getByType<T extends Entity>(type: string): T[] {
        const ids = this.entitiesByType.get(type);
        if (!ids) return [];

        return Array.from(ids)
            .map(id => this.entities.get(id) as T)
            .filter(e => e !== undefined);
    }

    /**
     * 
     * @param id the id of the Entity to remove
     * @returns true if deletion succeeded, false if not found or failed
     */
    public delete(id: string): boolean {
        const entity = this.entities.get(id);
        if (!entity) return false;  // not found

        this.entitiesByType.get(entity.type)?.delete(id);   // Delete from type register
        return this.entities.delete(id);    // Delete from total register
    }

    /**
     * Enumerates all entities in the register for output
     * @returns an object containing the stats data
     */
    public getStats(): object {
        const stats: Record<string, number> = {};
        this.entitiesByType.forEach((ids, type) => {
            stats[type] = ids.size;
        });
        return {total: this.entities.size, byType: stats};
    }

    /**
     * Removes all entities currently in the register
     */
    public clear(): void {
        this.entities.clear();
        this.entitiesByType.clear();
    }
}
