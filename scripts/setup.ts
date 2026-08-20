import { spawn } from 'child_process';
import { createConnection } from 'net';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptsDirectory, '..');
const composeFile = resolve(repositoryRoot, 'back/docker-compose.yml');
const yarnCommand = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';
const shouldReset = process.argv.includes('--reset');
const skipInfrastructure = process.argv.includes('--skip-infra');
const showHelp = process.argv.includes('--help') || process.argv.includes('-h');

const databaseServices = [
  'auth-service',
  'core-service',
  'delivery-service',
  'reservation-service',
  'visitor-service',
  'communication-service',
  'file-service',
  'maintenance-service',
] as const;

const databases = [
  'authDb',
  'coreDb',
  'deliveryDb',
  'reservationDb',
  'communicationDb',
  'visitorDb',
  'fileDb',
  'maintenanceDb',
] as const;

const populationExpectations = [
  { service: 'auth-service', database: 'authDb', table: 'accounts', expected: 8 },
  { service: 'core-service', database: 'coreDb', table: 'buildings', expected: 2 },
  { service: 'core-service', database: 'coreDb', table: 'groups', expected: 4 },
  { service: 'core-service', database: 'coreDb', table: 'residencies', expected: 4 },
  { service: 'core-service', database: 'coreDb', table: 'users', expected: 8 },
  { service: 'delivery-service', database: 'deliveryDb', table: 'packages', expected: 6 },
  {
    service: 'reservation-service',
    database: 'reservationDb',
    table: 'reservations',
    expected: 4,
  },
  {
    service: 'reservation-service',
    database: 'reservationDb',
    table: 'common_areas',
    expected: 6,
  },
  {
    service: 'visitor-service',
    database: 'visitorDb',
    table: 'visitor_accesses',
    expected: 4,
  },
  {
    service: 'communication-service',
    database: 'communicationDb',
    table: 'posts',
    expected: 6,
  },
  {
    service: 'communication-service',
    database: 'communicationDb',
    table: 'post_recipients',
    expected: 24,
  },
  { service: 'file-service', database: 'fileDb', table: 'file_batches', expected: 2 },
  { service: 'file-service', database: 'fileDb', table: 'residency_files', expected: 4 },
  { service: 'file-service', database: 'fileDb', table: 'file_batch_errors', expected: 1 },
  { service: 'file-service', database: 'fileDb', table: 'service_files', expected: 2 },
  {
    service: 'maintenance-service',
    database: 'maintenanceDb',
    table: 'maintenance_tickets',
    expected: 10,
  },
  {
    service: 'maintenance-service',
    database: 'maintenanceDb',
    table: 'maintenance_ticket_attachments',
    expected: 2,
  },
  {
    service: 'maintenance-service',
    database: 'maintenanceDb',
    table: 'maintenance_ticket_comments',
    expected: 6,
  },
  {
    service: 'maintenance-service',
    database: 'maintenanceDb',
    table: 'maintenance_ticket_history',
    expected: 10,
  },
] as const;

function logStep(message: string) {
  console.log(`\n[setup] ${message}`);
}

function delay(ms: number) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function runCommand(command: string, args: string[]) {
  return new Promise<void>((resolveCommand, rejectCommand) => {
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      stdio: 'inherit',
      shell: process.platform === 'win32' && command.endsWith('.cmd'),
      env: { ...process.env, NO_COLOR: '1' },
    });

    child.once('error', rejectCommand);
    child.once('exit', (code) => {
      if (code === 0) resolveCommand();
      else rejectCommand(new Error(`${command} terminou com codigo ${code}.`));
    });
  });
}

function runCommandCapture(command: string, args: string[]) {
  return new Promise<string>((resolveCommand, rejectCommand) => {
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32' && command.endsWith('.cmd'),
      env: { ...process.env, NO_COLOR: '1' },
    });
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => (stdout += data.toString()));
    child.stderr?.on('data', (data) => (stderr += data.toString()));
    child.once('error', rejectCommand);
    child.once('exit', (code) => {
      if (code === 0) resolveCommand(stdout);
      else rejectCommand(new Error(`${command} terminou com codigo ${code}. ${stderr}`));
    });
  });
}

function isPortOpen(port: number) {
  return new Promise<boolean>((resolvePort) => {
    const socket = createConnection({ host: '127.0.0.1', port });
    const finish = (open: boolean) => {
      socket.destroy();
      resolvePort(open);
    };
    socket.setTimeout(500);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function waitForPort(port: number, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortOpen(port)) return;
    await delay(300);
  }
  throw new Error(`A porta ${port} nao ficou disponivel.`);
}

function dockerComposeArgs(...args: string[]) {
  return ['compose', '-f', composeFile, ...args];
}

function psqlArgs(sql: string, database = 'postgres') {
  return dockerComposeArgs(
    'exec',
    '-T',
    'db',
    'psql',
    '-U',
    'admin',
    '-d',
    database,
    '-v',
    'ON_ERROR_STOP=1',
    '-tAc',
    sql,
  );
}

async function waitForPostgres() {
  const deadline = Date.now() + 90_000;
  const requiredConsecutiveChecks = 3;
  let consecutiveChecks = 0;

  while (Date.now() < deadline) {
    try {
      await runCommandCapture('docker', psqlArgs('SELECT 1'));
      consecutiveChecks += 1;

      if (consecutiveChecks >= requiredConsecutiveChecks) return;
    } catch {
      consecutiveChecks = 0;
    }

    await delay(750);
  }
  throw new Error('PostgreSQL nao permaneceu estavel para receber conexoes.');
}

async function prepareInfrastructure() {
  if (skipInfrastructure && shouldReset) {
    throw new Error('--reset e --skip-infra nao podem ser usados juntos.');
  }

  if (skipInfrastructure) {
    logStep('Reutilizando containers ativos por --skip-infra');
  } else {
    if (shouldReset) {
      logStep('Removendo containers e volumes locais do projeto');
      await runCommand('docker', dockerComposeArgs('down', '--volumes', '--remove-orphans'));
    }

    logStep('Subindo PostgreSQL, pgAdmin e MinIO');
    await runCommand('docker', dockerComposeArgs('up', '-d', 'db', 'db-dashboard', 'minio'));
  }

  await Promise.all([waitForPort(5432), waitForPort(9090)]);
  await waitForPostgres();

  logStep('Normalizando credencial local e garantindo bancos');
  await runCommand('docker', psqlArgs(`ALTER USER admin WITH PASSWORD 'adminPasswd'`));
  for (const database of databases) {
    const exists = await runCommandCapture(
      'docker',
      psqlArgs(`SELECT 1 FROM pg_database WHERE datname = '${database}'`),
    );
    if (exists.trim() !== '1') {
      await runCommand('docker', psqlArgs(`CREATE DATABASE "${database}"`));
      console.log(`[setup] Banco ${database} criado.`);
    }
  }
}

async function synchronizeSchemas() {
  logStep('Sincronizando schemas com Drizzle');
  for (const service of databaseServices) {
    console.log(`[setup] Schema: ${service}`);
    await runCommand(yarnCommand, ['workspace', service, 'drizzle-kit', 'push', '--force']);
  }
}

async function populateServices() {
  logStep('Limpando e populando os bancos de todos os servicos');
  for (const service of databaseServices) {
    console.log(`[setup] Dados: ${service}`);
    await runCommand(yarnCommand, ['workspace', service, 'db:populate']);
  }
}

async function validatePopulation() {
  logStep('Validando os dados de demonstracao');
  for (const expectation of populationExpectations) {
    const result = await runCommandCapture(
      'docker',
      psqlArgs(`SELECT COUNT(*) FROM ${expectation.table}`, expectation.database),
    );
    const actual = Number(result.trim());

    if (actual !== expectation.expected) {
      throw new Error(
        `${expectation.service}: ${expectation.table} possui ${actual} registros; eram esperados ${expectation.expected}.`,
      );
    }

    console.log(
      `[setup] OK: ${expectation.service}.${expectation.table} = ${expectation.expected}`,
    );
  }
}

function printSummary() {
  const password = process.env.HIVE_SEED_PASSWORD ?? 'hive123';
  console.log('\n[setup] Ambiente preparado com sucesso.');
  console.log('[setup] Condominio Jardim das Flores:');
  console.log(`  Morador 101A:     joao@example.com / ${password}`);
  console.log(`  Moradora 102A:    maria@example.com / ${password}`);
  console.log(`  Funcionaria:      ana@example.com / ${password}`);
  console.log(`  Administradora:   fernanda@example.com / ${password}`);
  console.log('[setup] Condominio Bosque Verde:');
  console.log(`  Morador Casa 01:  carlos@example.com / ${password}`);
  console.log(`  Moradora Casa 02: beatriz@example.com / ${password}`);
  console.log(`  Funcionario:      rafael@example.com / ${password}`);
  console.log(`  Administradora:   luciana@example.com / ${password}`);
  console.log(
    '\n[setup] Execute scripts/run.sh ou inicie os workspaces desejados com start:watch.',
  );
}

function printHelp() {
  console.log('Uso:');
  console.log('  yarn setup                 Prepara infraestrutura, schemas e dados.');
  console.log('  yarn setup:reset           Remove volumes e prepara tudo do zero.');
  console.log('  yarn setup --skip-infra    Usa PostgreSQL e MinIO que ja estejam ativos.');
  console.log('');
  console.log('Variavel opcional: HIVE_SEED_PASSWORD define a senha dos usuarios de demonstracao.');
}

async function main() {
  if (showHelp) {
    printHelp();
    return;
  }

  console.log('[setup] ATENCAO: a populacao substitui os dados locais dos servicos.');
  await prepareInfrastructure();
  await synchronizeSchemas();
  await populateServices();
  await validatePopulation();
  printSummary();
}

main().catch((error) => {
  console.error('\n[setup] Falha:', error);
  process.exitCode = 1;
});
