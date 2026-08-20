import { AccountInsert } from '@app/db/schema/account';

const defaultHash = '$2b$10$W8XGMd..YoBo/drINWS34.lCyxpiAaO9SrLFv41uh87vSRx62CdCG';

export const accountData: AccountInsert[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11999990001',
    hashedPassword: defaultHash,
    active: true,
  },
  {
    id: '11111111-1111-1111-1111-111111111112',
    name: 'Maria Silva',
    email: 'maria@example.com',
    phone: '11999990002',
    hashedPassword: defaultHash,
    active: true,
  },
  {
    id: '11111111-1111-1111-1111-111111111113',
    name: 'Carlos Souza',
    email: 'carlos@example.com',
    phone: '11999990003',
    hashedPassword: defaultHash,
    active: true,
  },
  {
    id: '11111111-1111-1111-1111-111111111115',
    name: 'Beatriz Lima',
    email: 'beatriz@example.com',
    phone: '11999990004',
    hashedPassword: defaultHash,
    active: true,
  },
  {
    id: '11111111-1111-1111-1111-111111111114',
    name: 'Ana Recepção',
    email: 'ana@example.com',
    phone: '11999990101',
    hashedPassword: defaultHash,
    active: true,
  },
  {
    id: '11111111-1111-1111-1111-111111111116',
    name: 'Fernanda Síndica',
    email: 'fernanda@example.com',
    phone: '11999990102',
    hashedPassword: defaultHash,
    active: true,
  },
  {
    id: '11111111-1111-1111-1111-111111111117',
    name: 'Rafael Portaria',
    email: 'rafael@example.com',
    phone: '11999990201',
    hashedPassword: defaultHash,
    active: true,
  },
  {
    id: '11111111-1111-1111-1111-111111111118',
    name: 'Luciana Síndica',
    email: 'luciana@example.com',
    phone: '11999990202',
    hashedPassword: defaultHash,
    active: true,
  },
];
