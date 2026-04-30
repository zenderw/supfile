import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { kindOf, previewApi } from '@/lib/api/preview';

export function PreviewPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [textContent, setTextContent] = useState<string | null>(null);

  const meta = useQuery({
    queryKey: ['preview-meta', fileId],
    queryFn: () => previewApi.getMetadata(fileId!),
    enabled: !!fileId,
  });

  const tokenQ = useQuery({
    queryKey: ['preview-token', fileId],
    queryFn: () => previewApi.getDownloadToken(fileId!),
    enabled: !!fileId,
    refetchInterval: 45_000,
  });

  const kind = meta.data ? kindOf(meta.data.mimeType) : null;
  const url = fileId && tokenQ.data ? previewApi.buildDownloadUrl(fileId, tokenQ.data) : null;

  useEffect(() => {
    if (kind !== 'text' || !url) return;
    let cancelled = false;
    fetch(url)
      .then((r) => r.text())
      .then((t) => {
        if (!cancelled) setTextContent(t);
      })
      .catch(() => {
        if (!cancelled) setTextContent('— Erreur de chargement —');
      });
    return () => {
      cancelled = true;
    };
  }, [kind, url]);

  if (!fileId) return null;
  if (meta.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  }
  if (!meta.data) {
    return <p className="text-sm text-destructive">Fichier introuvable</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        <h1 className="text-xl font-bold flex-1 truncate">{meta.data.name}</h1>
        {url && (
          <a href={url} download={meta.data.name}>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Télécharger
            </Button>
          </a>
        )}
      </div>

      <div className="border rounded-lg bg-muted/20 p-4 min-h-[60vh] flex items-center justify-center">
        {url && kind === 'image' && (
          <img src={url} alt={meta.data.name} className="max-w-full max-h-[70vh] object-contain" />
        )}
        {url && kind === 'video' && (
          <video src={url} controls className="max-w-full max-h-[70vh]" />
        )}
        {url && kind === 'audio' && <audio src={url} controls />}
        {url && kind === 'pdf' && (
          <iframe src={url} title={meta.data.name} className="w-full h-[70vh] border-0" />
        )}
        {kind === 'text' && (
          <pre className="w-full max-h-[70vh] overflow-auto text-sm font-mono whitespace-pre-wrap">
            {textContent ?? 'Chargement du contenu...'}
          </pre>
        )}
        {kind === 'unsupported' && (
          <p className="text-sm text-muted-foreground">
            Aperçu indisponible pour ce type de fichier. Utilisez "Télécharger".
          </p>
        )}
      </div>
    </div>
  );
}
