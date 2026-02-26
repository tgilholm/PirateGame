import express from 'express';
import { calculateShipStats, updateShipComponent } from './entities/calculateComponents.js'; // relative path from server
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const typesData = require('./entities/types.json');

const router = express.Router();

// Returns the raw component/variant definitions from types.json
router.get('/types', (req, res) => {
    res.json(typesData);
});

router.get('/stats', (req, res) => {
    const stats = calculateShipStats();
    res.json(stats);
});

router.post('/component', express.json(), (req, res) => {
    const { componentType, variant } = req.body;

    if (!componentType || !variant) {
        return res.status(400).json({ error: 'componentType and variant are required' });
    }

    try {
        updateShipComponent(componentType, variant); // calls logStats
        const stats = calculateShipStats();
        res.json(stats); //returns updated stats
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

export default router;