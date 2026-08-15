import { useEffect, useState } from 'react';
import { Document, Chunk } from '../../shared/types';

interface Props {
  document: Document;
}

export function DocumentDetail({ document }: Props) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [showChunks, setShowChunks] = useState(false);
  const [chunkError, setChunkError] = useState<string | null>(null);

  useEffect(() => {
    if (document.status === 'indexed' || document.status === 'error') {
      window.knowledgeBase.indexing.chunks(document.id).then(
        (result) => {
          setChunks(result);
          setChunkError(null);
        },
        (err) => {
          setChunks([]);
          setChunkError(String(err));
        }
      );
    } else {
      setChunks([]);
      setChunkError(null);
    }
  }, [document.id, document.status]);

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
        {document.title}
      </h2>
      <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
        <div>Filename: {document.filename}</div>
        <div>Imported: {new Date(document.importedAt).toLocaleString()}</div>
        <div>Size: {(document.size / 1024).toFixed(1)} KB</div>
        <div>Status: {document.status}</div>
        {document.chunks !== undefined && document.status === 'indexed' && (
          <div>Chunks: {document.chunks}</div>
        )}
      </div>

      {/* Error state banner */}
      {document.status === 'error' && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          background: '#3a1a1a',
          border: '1px solid #d9534f',
          borderRadius: '6px',
          color: '#f0a0a0',
          fontSize: '13px',
        }}>
          <strong style={{ color: '#d9534f' }}>⚠ Indexing Error</strong>
          {document.error && (
            <p style={{ margin: '6px 0 0 0', lineHeight: 1.5 }}>{document.error}</p>
          )}
          {!document.error && (
            <p style={{ margin: '6px 0 0 0', lineHeight: 1.5 }}>
              This document could not be indexed. Try re-importing the document and indexing again.
            </p>
          )}
          <button
            onClick={() => window.knowledgeBase.indexing.start(document.id)}
            style={{
              marginTop: '8px',
              padding: '6px 12px',
              background: '#d9534f',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Retry Indexing
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {document.status === 'indexed' && (
          <button
            onClick={() => setShowChunks(!showChunks)}
            style={{
              padding: '6px 12px',
              background: '#0f3460',
              color: '#e0e0e0',
              border: '1px solid #1a1a4e',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {showChunks ? 'Hide' : 'Show'} Chunks ({chunks.length})
          </button>
        )}
        {document.status === 'imported' && (
          <button
            onClick={() => window.knowledgeBase.indexing.start(document.id)}
            style={{
              padding: '6px 12px',
              background: '#533483',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Index Document
          </button>
        )}
      </div>

      {chunkError && (
        <div style={{ color: '#d9534f', fontSize: '13px', marginBottom: '8px' }}>
          Error loading chunks: {chunkError}
        </div>
      )}

      {showChunks && !chunkError && (
        <div>
          {chunks.length === 0 ? (
            <div style={{ color: '#666', fontSize: '13px', padding: '10px' }}>
              No chunks available for this document.
            </div>
          ) : (
            chunks.map(chunk => (
              <div
                key={chunk.id}
                style={{
                  padding: '10px',
                  marginBottom: '8px',
                  background: '#1a1a3e',
                  borderRadius: '4px',
                  borderLeft: '3px solid #533483',
                  fontSize: '13px',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                  Chunk {chunk.index} ({chunk.metadata.charCount} chars)
                </div>
                {chunk.content || (
                  <span style={{ color: '#d9534f', fontStyle: 'italic' }}>
                    (empty chunk)
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
