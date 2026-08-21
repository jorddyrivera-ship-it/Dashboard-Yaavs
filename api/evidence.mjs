import { saveEvidenceUpload } from '../../server/evidenceStore.mjs';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }
  try {
    const result = saveEvidenceUpload({
      id: req.body?.id,
      name: req.body?.name,
      mimeType: req.body?.mimeType,
      dataUrl: req.body?.dataUrl,
      base64: req.body?.base64,
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : 'No se pudo guardar la evidencia',
    });
  }
}
