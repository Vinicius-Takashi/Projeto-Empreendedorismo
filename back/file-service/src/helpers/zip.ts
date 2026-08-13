import AdmZip from 'adm-zip';
import path from 'path';

export interface PdfEntry {
  entryName: string;
  residencyName: string;
  originalName: string;
  buffer: Buffer;
}

export interface InvalidEntry {
  entryName: string;
  reason: string;
}

export interface ParsedZip {
  pdfEntries: PdfEntry[];
  invalidEntries: InvalidEntry[];
}

function normalizeEntryName(entryName: string) {
  return entryName.replaceAll('\\', '/').replace(/^\/+/, '');
}

function isUnsafePath(entryName: string) {
  const normalized = normalizeEntryName(entryName);
  return normalized.split('/').some((segment) => segment === '..');
}

function isPdf(buffer: Buffer, fileName: string) {
  return fileName.toLowerCase().endsWith('.pdf') && buffer.subarray(0, 4).toString() === '%PDF';
}

export function parseZip(buffer: Buffer): ParsedZip {
  const zip = new AdmZip(buffer);
  const pdfEntries: PdfEntry[] = [];
  const invalidEntries: InvalidEntry[] = [];

  zip.getEntries().forEach((entry) => {
    if (entry.isDirectory) {
      return;
    }

    const entryName = normalizeEntryName(entry.entryName);

    if (isUnsafePath(entryName)) {
      invalidEntries.push({ entryName, reason: 'Caminho invalido dentro do ZIP.' });
      return;
    }

    const segments = entryName.split('/').filter(Boolean);
    const buffer = entry.getData();
    const originalName = path.basename(entryName);
    const residencyName = (
      segments.length >= 2 ? segments[0] : path.basename(originalName, path.extname(originalName))
    ).trim();

    if (!residencyName) {
      invalidEntries.push({
        entryName,
        reason: 'Use o formato Nome da residencia/boleto.pdf ou Nome da residencia.pdf.',
      });
      return;
    }

    if (!isPdf(buffer, originalName)) {
      invalidEntries.push({ entryName, reason: 'Apenas arquivos PDF validos sao aceitos.' });
      return;
    }

    pdfEntries.push({
      entryName,
      residencyName,
      originalName,
      buffer,
    });
  });

  return { pdfEntries, invalidEntries };
}
