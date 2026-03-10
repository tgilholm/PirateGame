import express from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const typesData = require('./entities/components.json');

const router = express.Router();

//returns component/variant definitions from components.json
router.get('/types', (req, res) => {
    res.json(typesData);
});

export default router;