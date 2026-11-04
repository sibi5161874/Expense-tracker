const path = require('path');
const { spawn } = require('child_process');

process.loadEnvFile(path.join(__dirname, '../apps/web/.env.test.local'));
process.env.NODE_ENV = 'production';
process.env.E2E_MODE = 'true';
process.env.NEXT_PUBLIC_E2E_MODE = 'true';
process.env.PORT = '4000';

const nextBin = path.join(__dirname, '../apps/web/node_modules/next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, 'start', '-p', '4000'], {
  cwd: path.join(__dirname, '../apps/web'),
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));
