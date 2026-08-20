import client from '@app/db/client';
import { visitorAccesses } from '@app/db/schema/access';
import { sql } from 'drizzle-orm';

const jardim = '22222222-2222-2222-2222-222222222221';
const bosque = '22222222-2222-2222-2222-222222222222';
const hour = 60 * 60 * 1000;

async function seed() {
  await client.execute(sql`TRUNCATE TABLE visitor_accesses CASCADE`);
  await client.insert(visitorAccesses).values([
    {
      id: '88888888-8888-8888-8888-888888888801',
      buildingId: jardim,
      residencyId: '44444444-4444-4444-4444-444444444441',
      residencyName: 'Apartamento 101A',
      rg: '11.111.111-1',
      cpf: '111.111.111-11',
      name: 'Visitante de João',
      entryAt: new Date(Date.now() - hour),
    },
    {
      id: '88888888-8888-8888-8888-888888888802',
      buildingId: jardim,
      residencyId: '44444444-4444-4444-4444-444444444442',
      residencyName: 'Apartamento 102A',
      rg: '22.222.222-2',
      cpf: '222.222.222-22',
      name: 'Prestador de serviço',
      entryAt: new Date(Date.now() - 24 * hour),
    },
    {
      id: '88888888-8888-8888-8888-888888888803',
      buildingId: bosque,
      residencyId: '44444444-4444-4444-4444-444444444444',
      residencyName: 'Casa 01',
      rg: '33.333.333-3',
      cpf: '333.333.333-33',
      name: 'Visitante de Carlos',
      entryAt: new Date(Date.now() - 2 * hour),
    },
    {
      id: '88888888-8888-8888-8888-888888888804',
      buildingId: bosque,
      residencyId: '44444444-4444-4444-4444-444444444445',
      residencyName: 'Casa 02',
      rg: '44.444.444-4',
      cpf: '444.444.444-44',
      name: 'Técnico de internet',
      entryAt: new Date(Date.now() - 26 * hour),
    },
  ]);
  console.log('Visitor service populate complete');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
