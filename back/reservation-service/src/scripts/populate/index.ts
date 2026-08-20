import client from '@app/db/client';
import { commonAreas, reservations } from '@app/db/schema/reservation';
import { sql } from 'drizzle-orm';
import { commonAreaData } from './commonAreas';
import { reservationData } from './reservations';

async function clearDb() {
  await client.execute(sql`
    TRUNCATE TABLE
      reservations,
      common_areas
    CASCADE
  `);
}

async function seed() {
  await clearDb();

  console.log('Populating common areas...');
  await client.insert(commonAreas).values(commonAreaData);

  console.log('Populating reservations...');
  await client.insert(reservations).values(reservationData);

  console.log('Populate Finished');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
