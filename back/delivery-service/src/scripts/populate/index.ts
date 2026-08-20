import client from '@app/db/client';
import { packages } from '@app/db/schema/package';
import { sql } from 'drizzle-orm';

const jardim = '22222222-2222-2222-2222-222222222221';
const bosque = '22222222-2222-2222-2222-222222222222';
const hour = 60 * 60 * 1000;

async function seed() {
  await client.execute(sql`TRUNCATE TABLE packages CASCADE`);
  await client.insert(packages).values([
    {
      id: '77777777-7777-7777-7777-777777777701',
      buildingId: jardim,
      residencyId: '44444444-4444-4444-4444-444444444441',
      description: 'Caixa pequena da transportadora TestExpress',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 2 * hour),
    },
    {
      id: '77777777-7777-7777-7777-777777777702',
      buildingId: jardim,
      residencyId: '44444444-4444-4444-4444-444444444442',
      description: 'Envelope registrado entregue pela portaria',
      status: 'DELIVERED',
      createdAt: new Date(Date.now() - 24 * hour),
      deliveredAt: new Date(Date.now() - 20 * hour),
    },
    {
      id: '77777777-7777-7777-7777-777777777703',
      buildingId: jardim,
      residencyId: '44444444-4444-4444-4444-444444444441',
      description: 'Pacote cancelado para demonstração',
      status: 'CANCELED',
      createdAt: new Date(Date.now() - 48 * hour),
    },
    {
      id: '77777777-7777-7777-7777-777777777704',
      buildingId: bosque,
      residencyId: '44444444-4444-4444-4444-444444444444',
      description: 'Compra aguardando retirada na portaria',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 3 * hour),
    },
    {
      id: '77777777-7777-7777-7777-777777777705',
      buildingId: bosque,
      residencyId: '44444444-4444-4444-4444-444444444445',
      description: 'Documento entregue ao morador',
      status: 'DELIVERED',
      createdAt: new Date(Date.now() - 30 * hour),
      deliveredAt: new Date(Date.now() - 27 * hour),
    },
    {
      id: '77777777-7777-7777-7777-777777777706',
      buildingId: bosque,
      residencyId: '44444444-4444-4444-4444-444444444444',
      description: 'Entrega devolvida ao remetente',
      status: 'CANCELED',
      createdAt: new Date(Date.now() - 60 * hour),
    },
  ]);
  console.log('Delivery service populate complete');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
