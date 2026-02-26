import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const SERVER_CONFIG = require('./serverConfig.json');

export let CONFIG = {

    TICK_RATE: 45,
    NET_TICK_RATE: 20,
    PORT: 3000,

    ...SERVER_CONFIG

};
