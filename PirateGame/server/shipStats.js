import express from 'express';
import { calculateShipStats } from './entities/calculateComponents.js'; // relative path from server

const router = express.Router();

router.get('/stats', (req, res) => {
    const stats = calculateShipStats();
    res.json(stats);
});

export default router;