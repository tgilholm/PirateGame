import express from 'express';
import { calculateShipStats, updateShipComponent } from './entities/calculateComponents.js'; // relative path from server

const router = express.Router();

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