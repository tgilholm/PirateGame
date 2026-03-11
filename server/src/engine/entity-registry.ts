import Entity from "../entities/entity";

/**
 * Repository-pattern class implementing CRUD (create, retrieve, update, delete) methods
 * on all entity-derived types. Holds a list of all the entities currently in a world.
 */
export default class EntityRegistry {
    private entities: Map<string, Entity> = new Map();
    private entitiesByType: Map<string, Set<string>> = new Map();
    private typeCache: Map<string, Entity[]> = new Map();
    private allCache: Entity[] | null = null;


    /**
     * Adds a pre-constructed Entity to the entity register
     * @param entity the pre-constructed Entity to add
     */
    public create(entity: Entity): void {
        this.entities.set(entity.id, entity);
        // Update type index
        const allTypes = [entity.type, ...(entity.supertypes ?? [])];
        for (const t of allTypes) {
            if (!this.entitiesByType.has(t)) this.entitiesByType.set(t, new Set());
            this.entitiesByType.get(t)!.add(entity.id);
            this.typeCache.delete(t);
        }

        this.allCache = null;
    }

    /**
     * Type-safe GET method. Retrieves an entity by its ID
     * @param id the id of the entity to retrieve
     * @returns the entity or subtype of Entity
     */
    public get<T extends Entity>(id: string): T | undefined {
        return this.entities.get(id) as T;  // Cast to the subtype
    }

    /**
     * Retrieves all entities currently in the register
     * @returns an array of entities
     */
    public getAll(): Entity[] {
        if (this.allCache) return this.allCache;
        this.allCache = Array.from(this.entities.values());
        return this.allCache;
    }

    /**
     * Gets all the entities matching the provided type 
     * @param type the name of the type of entity - e.g. "interactable"
     * @returns an array of that entity
     */
    public getByType<T extends Entity>(type: string): T[] {
        if (this.typeCache.has(type)) {
            return this.typeCache.get(type) as T[]; // return cached
        }

        const ids = this.entitiesByType.get(type);
        if (!ids) return [];

        const result = Array.from(ids)
            .map(id => this.entities.get(id) as T)
            .filter(e => e !== undefined);

        this.typeCache.set(type, result); // store in cache
        return result;
    }

    /**
     * Removes an entity from the game
     * @param id the id of the Entity to remove
     * @returns true if deletion succeeded, false if not found or failed
     */
    public delete(id: string): boolean {
        const entity = this.entities.get(id);
        if (!entity) return false;

        const allTypes = [entity.type, ...(entity.supertypes ?? [])];
        for (const t of allTypes) {
            this.entitiesByType.get(t)?.delete(id);
            // Update cache array in place instead of invalidating it
            const cached = this.typeCache.get(t);
            if (cached) {
                const idx = cached.indexOf(entity);
                if (idx !== -1) cached.splice(idx, 1);
            }
        }
        this.allCache = null;
        return this.entities.delete(id);
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
        return { total: this.entities.size, byType: stats };
    }

    /**
     * Removes all entities currently in the register
     */
    public clear(): void {
        this.entities.clear();
        this.entitiesByType.clear();
        this.typeCache.clear();
    }
}
