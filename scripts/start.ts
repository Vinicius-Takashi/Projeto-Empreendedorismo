import { type ChildProcess, spawn } from 'child_process';
import { createRequire } from 'module';
import { createConnection } from 'net';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

type Application = {
  workspace: string;
  label: string;
  port: number;
  args?: string[];
};

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptsDirectory, '..');
const showHelp = process.argv.includes('--help') || process.argv.includes('-h');
const watchMode = process.argv.includes('--watch');
const frontPortArgument = process.argv.find((argument) => argument.startsWith('--front-port='));
const frontPort = frontPortArgument ? Number(frontPortArgument.split('=')[1]) : 5173;
const serviceRequire = createRequire(
  resolve(repositoryRoot, 'back/maintenance-service/package.json'),
);
const frontRequire = createRequire(resolve(repositoryRoot, 'front/package.json'));
const tsxCli = serviceRequire.resolve('tsx/cli');
const viteCli = resolve(dirname(frontRequire.resolve('vite/package.json')), 'bin/vite.js');

const infrastructure = [
  { label: 'PostgreSQL', port: 5432 },
  { label: 'MinIO', port: 9090 },
] as const;

const applications: Application[] = [
  { workspace: 'event-bus', label: 'Event Bus', port: 8004 },
  { workspace: 'auth-service', label: 'Auth API', port: 8001 },
  { workspace: 'core-service', label: 'Core API', port: 8000 },
  { workspace: 'delivery-service', label: 'Delivery API', port: 8002 },
  { workspace: 'visitor-service', label: 'Visitor API', port: 8003 },
  {
    workspace: 'reservation-service',
    label: 'Reservation API',
    port: 8005,
  },
  {
    workspace: 'communication-service',
    label: 'Communication API',
    port: 8006,
  },
  { workspace: 'file-service', label: 'File API', port: 8007 },
  {
    workspace: 'maintenance-service',
    label: 'Maintenance API',
    port: 8008,
  },
  {
    workspace: 'front',
    label: 'Front-end',
    port: frontPort,
    args: ['--strictPort', '--port', String(frontPort)],
  },
];

const children = new Map<string, ChildProcess>();
let shuttingDown = false;

function isHostPortOpen(host: string, port: number) {
  return new Promise<boolean>((resolvePort) => {
    const socket = createConnection({ host, port });
    let settled = false;
    const finish = (open: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolvePort(open);
    };

    socket.setTimeout(500);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function isPortOpen(port: number) {
  const checks = await Promise.all([
    isHostPortOpen('127.0.0.1', port),
    isHostPortOpen('::1', port),
  ]);
  return checks.some(Boolean);
}

async function waitForPort(port: number, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortOpen(port)) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 300));
  }

  throw new Error(`A porta ${port} não ficou disponível.`);
}

function waitForCommand(command: string, args: string[]) {
  return new Promise<number | null>((resolveCommand) => {
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.once('error', () => resolveCommand(null));
    child.once('exit', (code) => resolveCommand(code));
  });
}

async function stopProcess(child: ChildProcess) {
  if (!child.pid || child.exitCode !== null) return;

  if (process.platform === 'win32') {
    const taskkillCode = await waitForCommand('taskkill', ['/PID', String(child.pid), '/T', '/F']);
    if (taskkillCode !== 0 && child.exitCode === null) child.kill();
    return;
  }

  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
}

async function shutdown(exitCode: number) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log('\n[start] Encerrando aplicações...');
  await Promise.allSettled([...children.values()].map(stopProcess));
  process.exit(exitCode);
}

function startApplication(application: Application) {
  const isFront = application.workspace === 'front';
  const workspaceDirectory = isFront
    ? resolve(repositoryRoot, 'front')
    : resolve(repositoryRoot, 'back', application.workspace);
  const args = isFront
    ? [viteCli, ...(application.args ?? [])]
    : [tsxCli, ...(watchMode ? ['watch'] : []), 'src/index.ts'];
  const child = spawn(process.execPath, args, {
    cwd: workspaceDirectory,
    stdio: ['ignore', 'inherit', 'inherit'],
    detached: process.platform !== 'win32',
    windowsHide: true,
    env: { ...process.env, NO_COLOR: '1' },
  });

  children.set(application.workspace, child);
  child.once('error', (error) => {
    console.error(`[start] Não foi possível iniciar ${application.label}:`, error);
    void shutdown(1);
  });
  child.once('exit', (code, signal) => {
    if (shuttingDown) return;
    console.error(
      `[start] ${application.label} encerrou inesperadamente (${signal ?? `código ${code}`}).`,
    );
    void shutdown(code && code > 0 ? code : 1);
  });
}

async function validateEnvironment() {
  if (!Number.isInteger(frontPort) || frontPort < 1 || frontPort > 65_535) {
    throw new Error('A porta informada em --front-port deve estar entre 1 e 65535.');
  }

  const unavailableInfrastructure: string[] = [];
  for (const dependency of infrastructure) {
    if (!(await isPortOpen(dependency.port))) {
      unavailableInfrastructure.push(`${dependency.label} (:${dependency.port})`);
    }
  }

  if (unavailableInfrastructure.length > 0) {
    throw new Error(
      `Infraestrutura indisponível: ${unavailableInfrastructure.join(', ')}. Execute "yarn setup" primeiro.`,
    );
  }

  const portsInUse: number[] = [];
  for (const application of applications) {
    if (await isPortOpen(application.port)) portsInUse.push(application.port);
  }

  if (portsInUse.length > 0) {
    throw new Error(
      `As portas ${portsInUse.join(', ')} já estão em uso. Encerre as aplicações existentes antes de continuar.`,
    );
  }
}

function printHelp() {
  console.log('Uso:');
  console.log('  yarn start       Inicia todas as APIs, o event-bus e o front-end.');
  console.log('  yarn start --watch             Reinicia as APIs após alterações no código.');
  console.log('  yarn start --front-port=5174   Usa outra porta para o front-end.');
  console.log('');
  console.log(
    'Execute "yarn setup" antes do primeiro uso para preparar a infraestrutura e os dados.',
  );
  console.log('Use Ctrl+C para encerrar todas as aplicações iniciadas pelo script.');
}

async function main() {
  if (showHelp) {
    printHelp();
    return;
  }

  console.log('[start] Verificando infraestrutura e portas...');
  await validateEnvironment();

  console.log('[start] Iniciando APIs, event-bus e front-end...');
  applications.forEach(startApplication);
  await Promise.all(applications.map((application) => waitForPort(application.port)));

  console.log('\n[start] Ambiente disponível:');
  console.log(`  Front-end:       http://localhost:${frontPort}`);
  console.log('  Core API:        http://localhost:8000');
  console.log('  Auth API:        http://localhost:8001');
  console.log('  Delivery API:    http://localhost:8002');
  console.log('  Visitor API:     http://localhost:8003');
  console.log('  Event Bus:       http://localhost:8004');
  console.log('  Reservation API: http://localhost:8005');
  console.log('  Communication:   http://localhost:8006');
  console.log('  File API:        http://localhost:8007');
  console.log('  Maintenance API: http://localhost:8008');
  console.log('\n[start] Pressione Ctrl+C para encerrar tudo.');
}

process.once('SIGINT', () => void shutdown(0));
process.once('SIGTERM', () => void shutdown(0));

main().catch((error) => {
  console.error('\n[start] Falha:', error instanceof Error ? error.message : error);
  void shutdown(1);
});
