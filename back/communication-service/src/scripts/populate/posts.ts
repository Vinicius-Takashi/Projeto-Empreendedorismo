import { type PostInsert } from '@app/db/schema/post';
import { ids } from './ids';

function futureEvent(days: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

export const postSeedData: PostInsert[] = [
  {
    id: '55555555-5555-5555-5555-555555555551',
    buildingId: ids.buildings.jardim,
    authorUserId: ids.users.fernanda,
    title: 'Manutenção da caixa d’água',
    description: 'Na próxima sexta-feira haverá manutenção da caixa d’água.',
    eventAt: futureEvent(2, 8),
  },
  {
    id: '55555555-5555-5555-5555-555555555552',
    buildingId: ids.buildings.jardim,
    authorUserId: ids.users.fernanda,
    title: 'Assembleia do Jardim das Flores',
    description: 'Reunião para apresentar melhorias nas áreas comuns.',
    eventAt: futureEvent(7, 19),
  },
  {
    id: '55555555-5555-5555-5555-555555555553',
    buildingId: ids.buildings.jardim,
    authorUserId: ids.users.ana,
    title: 'Portão social em manutenção',
    description: 'Utilize a entrada lateral durante o período informado.',
  },
  {
    id: '55555555-5555-5555-5555-555555555554',
    buildingId: ids.buildings.bosque,
    authorUserId: ids.users.luciana,
    title: 'Poda preventiva das árvores',
    description: 'A equipe de jardinagem realizará a poda nas áreas do condomínio.',
    eventAt: futureEvent(4, 9),
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    buildingId: ids.buildings.bosque,
    authorUserId: ids.users.luciana,
    title: 'Encontro dos moradores',
    description: 'Todos estão convidados para o encontro no salão de festas.',
    eventAt: futureEvent(9, 18),
  },
  {
    id: '55555555-5555-5555-5555-555555555556',
    buildingId: ids.buildings.bosque,
    authorUserId: ids.users.rafael,
    title: 'Atualização do controle de acesso',
    description: 'A portaria fará a conferência dos cadastros de visitantes.',
  },
];
