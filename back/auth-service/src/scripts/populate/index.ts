import { sql } from 'drizzle-orm';
import client from '@app/db/client';

import { accounts } from '@app/db/schema/account';
import { accountData } from './accounts';
import hashPassword from '@app/helpers/hashPassword';

async function clearDb() {
  await client.execute(sql`
    TRUNCATE TABLE accounts CASCADE
  `);
}

async function seed() {
  await clearDb();

  console.log('Populating accounts...');
  const seedPassword = process.env.HIVE_SEED_PASSWORD ?? 'hive123';
  const hashedPassword = await hashPassword(seedPassword);
  await client.insert(accounts).values(
    accountData.map((account) => ({
      ...account,
      hashedPassword,
    })),
  );

  console.log('Auth service populate complete');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
