/* Runs backend (which also serves the frontend) and prints URLs. */
const { spawn } = require('child_process');
const path = require('path');
const be = spawn('npm', ['--prefix', 'backend', 'start'], { stdio: 'inherit', shell: true });
be.on('exit', (c) => process.exit(c || 0));
console.log('Storefront + API: http://localhost:4000');
