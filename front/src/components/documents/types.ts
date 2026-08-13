export type DocumentViewMode = 'upload' | 'residency';

export interface DocumentViewOption {
  mode: DocumentViewMode;
}

export interface ResidencyFile {
  id: string;
  batchId: string | null;
  buildingId: string;
  residencyId: string;
  residencyName: string;
  type: 'BOLETO';
  referenceMonth: string;
  originalName: string;
  sizeBytes: number;
  version: number;
  createdAt: string;
}

export interface FileBatch {
  id: string;
  buildingId: string;
  uploadedByUserId: string;
  originalZipName: string;
  referenceMonth: string;
  status: 'PROCESSING' | 'COMPLETED' | 'COMPLETED_WITH_ERRORS' | 'FAILED';
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  createdAt: string;
  finishedAt: string | null;
}

export interface FileBatchError {
  entryName: string;
  reason: string;
}
