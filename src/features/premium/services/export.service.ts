import api from '@/services/api.service';

export type ExportFormat = 'pdf' | 'docx' | 'epub';

export const exportWork = async (workId: string, format: ExportFormat): Promise<Blob> => {
  const res = await api.post('/export', { workId, format }, { responseType: 'blob' });
  return res.data;
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
