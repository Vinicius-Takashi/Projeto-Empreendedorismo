import { ReservationInsert } from '@app/db/schema/reservation';
import { ids } from './ids';

function futureDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export const reservationData: ReservationInsert[] = [
  {
    id: '66666666-6666-6666-6666-666666666601',
    userId: '00000000-0000-0000-0000-000000000001',
    residentName: 'João Silva',
    residencyId: '44444444-4444-4444-4444-444444444441',
    buildingId: ids.buildings.jardim,
    commonAreaId: ids.commonAreas.jardimChurrasqueira,
    commonAreaName: 'Churrasqueira',
    reservationDate: futureDate(2),
  },
  {
    id: '66666666-6666-6666-6666-666666666602',
    userId: '00000000-0000-0000-0000-000000000002',
    residentName: 'Maria Silva',
    residencyId: '44444444-4444-4444-4444-444444444442',
    buildingId: ids.buildings.jardim,
    commonAreaId: ids.commonAreas.jardimSalaoFestas,
    commonAreaName: 'Salão de Festas',
    reservationDate: futureDate(5),
  },
  {
    id: '66666666-6666-6666-6666-666666666603',
    userId: '00000000-0000-0000-0000-000000000003',
    residentName: 'Carlos Souza',
    residencyId: '44444444-4444-4444-4444-444444444444',
    buildingId: ids.buildings.bosque,
    commonAreaId: ids.commonAreas.bosqueChurrasqueira,
    commonAreaName: 'Churrasqueira',
    reservationDate: futureDate(3),
  },
  {
    id: '66666666-6666-6666-6666-666666666604',
    userId: '00000000-0000-0000-0000-000000000005',
    residentName: 'Beatriz Lima',
    residencyId: '44444444-4444-4444-4444-444444444445',
    buildingId: ids.buildings.bosque,
    commonAreaId: ids.commonAreas.bosqueSalaoFestas,
    commonAreaName: 'Salão de Festas',
    reservationDate: futureDate(6),
  },
];
