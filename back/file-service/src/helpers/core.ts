import config from '@app/config';

export interface ResolvedResidency {
  id: string;
  code: string;
  name: string | null;
}

export async function resolveResidencies(names: string[], token: string) {
  const response = await fetch(`${config.coreServiceUrl}/residencies/resolve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ names }),
  });

  if (!response.ok) {
    throw new Error(`Core service returned ${response.status}`);
  }

  const data = (await response.json()) as { residencies: ResolvedResidency[] };
  return data.residencies;
}
