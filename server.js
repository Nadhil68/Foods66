const mod = require('./foods66/backend/dist/server.js');
const app = mod.default || mod.app || mod;
module.exports = app;
module.exports.default = app;
