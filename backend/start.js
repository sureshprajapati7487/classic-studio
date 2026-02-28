// start.js — Smart launcher: kills port 5000 then starts server.js
const killPort = require('kill-port');
const { spawn } = require('child_process');

console.log('🔄 Checking port 5000...');

killPort(5000)
    .then(() => console.log('✅ Port 5000 cleared'))
    .catch(() => console.log('✅ Port 5000 was already free'))
    .finally(() => {
        const child = spawn('node', ['server.js'], { stdio: 'inherit' });
        child.on('exit', (code) => process.exit(code));
    });
