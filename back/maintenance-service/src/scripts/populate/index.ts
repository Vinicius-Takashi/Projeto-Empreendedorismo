import client from '@app/db/client';
import { ticketAttachments, ticketComments, ticketHistory, tickets } from '@app/db/schema/ticket';
import { sql } from 'drizzle-orm';

const ids = {
  buildings: {
    jardim: '22222222-2222-2222-2222-222222222221',
    bosque: '22222222-2222-2222-2222-222222222222',
  },
  residencies: {
    ap101: '44444444-4444-4444-4444-444444444441',
    ap102: '44444444-4444-4444-4444-444444444442',
    casa01: '44444444-4444-4444-4444-444444444444',
    casa02: '44444444-4444-4444-4444-444444444445',
  },
  users: {
    joao: '00000000-0000-0000-0000-000000000001',
    maria: '00000000-0000-0000-0000-000000000002',
    carlos: '00000000-0000-0000-0000-000000000003',
    ana: '00000000-0000-0000-0000-000000000004',
    beatriz: '00000000-0000-0000-0000-000000000005',
    fernanda: '00000000-0000-0000-0000-000000000006',
    rafael: '00000000-0000-0000-0000-000000000007',
    luciana: '00000000-0000-0000-0000-000000000008',
  },
};

function relativeDate(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

const ticketData: (typeof tickets.$inferInsert)[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
    buildingId: ids.buildings.jardim,
    residencyId: ids.residencies.ap101,
    openedByUserId: ids.users.joao,
    category: 'PLUMBING',
    title: 'Vazamento na pia da cozinha',
    description: 'Há um vazamento contínuo abaixo da pia da cozinha.',
    location: 'Apartamento 101A - cozinha',
    priority: 'NORMAL',
    status: 'OPEN',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
    buildingId: ids.buildings.jardim,
    residencyId: ids.residencies.ap102,
    openedByUserId: ids.users.maria,
    assignedToUserId: ids.users.ana,
    category: 'ELECTRICAL',
    title: 'Lâmpada do corredor piscando',
    description: 'A luminária do corredor em frente à unidade apresenta falhas.',
    location: 'Torre B - primeiro andar',
    priority: 'HIGH',
    status: 'UNDER_REVIEW',
    dueAt: relativeDate(2),
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03',
    buildingId: ids.buildings.jardim,
    residencyId: null,
    openedByUserId: ids.users.fernanda,
    assignedToUserId: ids.users.ana,
    category: 'COMMON_AREA',
    title: 'Portão da garagem com ruído',
    description: 'O portão apresenta ruído durante a abertura e precisa de inspeção.',
    location: 'Garagem principal',
    priority: 'EMERGENCY',
    status: 'IN_PROGRESS',
    dueAt: relativeDate(1),
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04',
    buildingId: ids.buildings.jardim,
    residencyId: ids.residencies.ap102,
    openedByUserId: ids.users.maria,
    assignedToUserId: ids.users.ana,
    category: 'ELEVATOR',
    title: 'Botão do elevador substituído',
    description: 'O botão do primeiro andar não respondia corretamente.',
    location: 'Torre B - elevador social',
    priority: 'HIGH',
    status: 'RESOLVED',
    resolution: 'Botão e conexão elétrica substituídos.',
    resolvedAt: relativeDate(-1),
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05',
    buildingId: ids.buildings.jardim,
    residencyId: ids.residencies.ap101,
    openedByUserId: ids.users.joao,
    assignedToUserId: ids.users.ana,
    category: 'SECURITY',
    title: 'Interfone revisado',
    description: 'O interfone da unidade estava sem áudio.',
    location: 'Apartamento 101A',
    priority: 'NORMAL',
    status: 'CLOSED',
    resolution: 'Fiação do interfone reconectada.',
    resolvedAt: relativeDate(-4),
    closedAt: relativeDate(-3),
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06',
    buildingId: ids.buildings.bosque,
    residencyId: ids.residencies.casa01,
    openedByUserId: ids.users.carlos,
    category: 'STRUCTURAL',
    title: 'Infiltração na parede da sala',
    description: 'A parede próxima à janela apresenta umidade após as chuvas.',
    location: 'Casa 01 - sala',
    priority: 'HIGH',
    status: 'OPEN',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07',
    buildingId: ids.buildings.bosque,
    residencyId: ids.residencies.casa02,
    openedByUserId: ids.users.beatriz,
    assignedToUserId: ids.users.rafael,
    category: 'PLUMBING',
    title: 'Baixa pressão no chuveiro',
    description: 'A pressão da água caiu somente no banheiro da suíte.',
    location: 'Casa 02 - banheiro da suíte',
    priority: 'NORMAL',
    status: 'UNDER_REVIEW',
    dueAt: relativeDate(3),
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08',
    buildingId: ids.buildings.bosque,
    residencyId: null,
    openedByUserId: ids.users.luciana,
    assignedToUserId: ids.users.rafael,
    category: 'SECURITY',
    title: 'Câmera da entrada sem imagem',
    description: 'A câmera principal perdeu o sinal durante a madrugada.',
    location: 'Portaria principal',
    priority: 'EMERGENCY',
    status: 'IN_PROGRESS',
    dueAt: relativeDate(1),
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa09',
    buildingId: ids.buildings.bosque,
    residencyId: ids.residencies.casa02,
    openedByUserId: ids.users.beatriz,
    assignedToUserId: ids.users.rafael,
    category: 'ELECTRICAL',
    title: 'Tomada da garagem reparada',
    description: 'A tomada usada para equipamentos de limpeza não funcionava.',
    location: 'Casa 02 - garagem',
    priority: 'NORMAL',
    status: 'RESOLVED',
    resolution: 'Módulo da tomada e disjuntor auxiliar substituídos.',
    resolvedAt: relativeDate(-2),
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10',
    buildingId: ids.buildings.bosque,
    residencyId: ids.residencies.casa01,
    openedByUserId: ids.users.carlos,
    assignedToUserId: ids.users.rafael,
    category: 'CLEANING',
    title: 'Retirada de galhos concluída',
    description: 'Galhos da área comum bloqueavam parcialmente a passagem.',
    location: 'Alameda das Palmeiras',
    priority: 'LOW',
    status: 'CLOSED',
    resolution: 'Galhos recolhidos e passagem liberada.',
    resolvedAt: relativeDate(-5),
    closedAt: relativeDate(-4),
  },
];

async function seed() {
  await client.execute(sql`
    TRUNCATE TABLE
      maintenance_ticket_attachments,
      maintenance_ticket_comments,
      maintenance_ticket_history,
      maintenance_tickets
    CASCADE
  `);

  await client.insert(tickets).values(ticketData);
  await client.insert(ticketComments).values([
    {
      ticketId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
      authorUserId: ids.users.joao,
      content: 'O vazamento aumentou desde a abertura do chamado.',
      internal: false,
    },
    {
      ticketId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
      authorUserId: ids.users.fernanda,
      content: 'Verificar se será necessário interditar o corredor.',
      internal: true,
    },
    {
      ticketId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03',
      authorUserId: ids.users.ana,
      content: 'A empresa responsável já foi acionada.',
      internal: false,
    },
    {
      ticketId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06',
      authorUserId: ids.users.carlos,
      content: 'Enviei uma foto mostrando a área mais úmida.',
      internal: false,
    },
    {
      ticketId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07',
      authorUserId: ids.users.luciana,
      content: 'Confirmar se outras unidades da alameda apresentam o mesmo problema.',
      internal: true,
    },
    {
      ticketId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08',
      authorUserId: ids.users.rafael,
      content: 'O fornecedor fará a vistoria ainda hoje.',
      internal: false,
    },
  ]);
  await client.insert(ticketAttachments).values([
    {
      ticketId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
      fileId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      fileName: 'vazamento-jardim.png',
      contentType: 'image/png',
      sizeBytes: 68,
      attachmentType: 'PROBLEM_PHOTO',
      uploadedByUserId: ids.users.joao,
    },
    {
      ticketId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06',
      fileId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
      fileName: 'infiltracao-bosque.png',
      contentType: 'image/png',
      sizeBytes: 68,
      attachmentType: 'PROBLEM_PHOTO',
      uploadedByUserId: ids.users.carlos,
    },
  ]);
  await client.insert(ticketHistory).values(
    ticketData.map((ticket) => ({
      ticketId: ticket.id!,
      actorUserId: ticket.openedByUserId,
      eventType: 'TICKET_CREATED',
      newValue: ticket.status ?? 'OPEN',
    })),
  );

  console.log('Maintenance service populate complete');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
