import { v4 as uuidv4 } from 'uuid';
import { Chunk, Document } from '../shared/types';
import { PersistenceService } from './persistence-service';

const INDEX_META = 'index-meta.json';
const CHUNKS_DIR = 'chunks';

interface IndexStatus {
  status: 'idle' | 'indexing' | 'ready' | 'error';
  currentIndexed: number;
  totalDocuments: number;
  lastIndexed: string | null;
  error?: string;
}

export class IndexingService {
  private persistence: PersistenceService;

  constructor(persistence: PersistenceService) {
    this.persistence = persistence;
  }

  /** Start indexing documents. If documentId is provided, index only that document. */
  async startIndexing(documentId?: string): Promise<IndexStatus> {
    const status = this.getStatus();

    if (documentId) {
      // Index a single document
      const content = this.persistence.readText(`content/${documentId}.txt`);
      if (!content) {
        return {
          ...status,
          status: 'error',
          lastIndexed: new Date().toISOString(),
          error: `Document content not found for ${documentId}. Re-import the document and try again.`,
        };
      }
      try {
        const chunks = this.chunkDocument(documentId, content);
        if (chunks.length === 0) {
          return {
            ...status,
            status: 'error',
            lastIndexed: new Date().toISOString(),
            error: `No valid chunks were produced for document ${documentId}.`,
          };
        }
        this.persistence.writeJson(`${CHUNKS_DIR}/${documentId}.json`, chunks);
        const chunksMeta = this.persistence.readJson<Record<string, string[]>>(INDEX_META) ?? {};
        chunksMeta[documentId] = chunks.map(c => c.id);
        this.persistence.writeJson(INDEX_META, chunksMeta);
        this.updateDocumentIndexStatus(documentId, 'indexed', chunks.length);
        return this.getStatus();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.updateDocumentIndexStatus(documentId, 'error');
        return {
          ...status,
          status: 'error',
          lastIndexed: new Date().toISOString(),
          error: `Indexing failed: ${message}`,
        };
      }
    }

    // Index all documents that haven't been indexed yet
    const docsMeta = this.persistence.readJson<Document[]>('documents-meta.json') ?? [];
    const chunksMeta = this.persistence.readJson<Record<string, string[]>>(INDEX_META) ?? {};
    let failed = false;

    for (const doc of docsMeta) {
      if (chunksMeta[doc.id]) continue;

      const content = this.persistence.readText(`content/${doc.id}.txt`);
      if (!content) {
        failed = true;
        this.updateDocumentIndexStatus(doc.id, 'error', undefined, `Content missing for ${doc.filename}. Re-import the document.`);
        continue;
      }

      const chunks = this.chunkDocument(doc.id, content);
      if (chunks.length === 0) {
        failed = true;
        this.updateDocumentIndexStatus(doc.id, 'error', undefined, `No valid chunks for ${doc.filename}.`);
        continue;
      }

      this.persistence.writeJson(`${CHUNKS_DIR}/${doc.id}.json`, chunks);
      chunksMeta[doc.id] = chunks.map(c => c.id);
      this.updateDocumentIndexStatus(doc.id, 'indexed', chunks.length);
    }

    this.persistence.writeJson(INDEX_META, chunksMeta);
    const finalStatus = this.getStatus();
    if (failed) {
      finalStatus.status = 'error';
      finalStatus.error = 'One or more documents failed to index. Check individual document statuses in the document list.';
      finalStatus.lastIndexed = new Date().toISOString();
    }
    return finalStatus;
  }

  /** Update a document's status (and optional chunk count) in the metadata file. */
  private updateDocumentIndexStatus(
    documentId: string,
    status: Document['status'],
    chunkCount?: number,
    errorMessage?: string
  ): void {
    const docs = this.persistence.readJson<Document[]>('documents-meta.json');
    if (!docs) return;

    const index = docs.findIndex(d => d.id === documentId);
    if (index === -1) return;

    docs[index] = {
      ...docs[index],
      status,
      ...(chunkCount !== undefined ? { chunks: chunkCount } : {}),
      ...(errorMessage !== undefined ? { error: errorMessage } : {}),
    };
    this.persistence.writeJson('documents-meta.json', docs);
  }

  /** Get current indexing status. */
  getStatus(): IndexStatus {
    const docs = this.persistence.readJson<Document[]>('documents-meta.json') ?? [];
    const chunksMeta = this.persistence.readJson<Record<string, string[]>>(INDEX_META) ?? {};

    const currentIndexed = Object.keys(chunksMeta).length;
    const totalDocuments = docs.length;
    const isReady = currentIndexed === totalDocuments && totalDocuments > 0;

    return {
      status: isReady ? 'ready' : currentIndexed > 0 ? 'indexing' : 'idle',
      currentIndexed,
      totalDocuments,
      lastIndexed: new Date().toISOString(),
    };
  }

  /** Get all chunks for a document. */
  getChunksForDocument(documentId: string): Chunk[] {
    return this.persistence.readJson<Chunk[]>(`${CHUNKS_DIR}/${documentId}.json`) ?? [];
  }

  /** Get all chunks across all documents. */
  getAllChunks(): Chunk[] {
    const chunksMeta = this.persistence.readJson<Record<string, string[]>>(INDEX_META) ?? {};
    const allChunks: Chunk[] = [];

    for (const docId of Object.keys(chunksMeta)) {
      const chunks = this.getChunksForDocument(docId);
      allChunks.push(...chunks);
    }

    return allChunks;
  }

  /** Split a document into chunks of ~500 characters at paragraph boundaries. */
  private chunkDocument(documentId: string, content: string): Chunk[] {
    const CHUNK_SIZE = 500;
    const chunks: Chunk[] = [];

    // Split on double newlines (paragraphs)
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    console.log(`[IndexingService] chunkDocument called for ${documentId}, content length=${content.length}`);

    let buffer = '';
    let chunkIndex = 0;

    for (const para of paragraphs) {
      if (buffer.length + para.length > CHUNK_SIZE && buffer.length > 0) {
        chunks.push(this.createChunk(documentId, chunkIndex++, buffer.trim()));
        buffer = para;
      } else {
        buffer += (buffer ? '\n\n' : '') + para;
      }
    }

    if (buffer.trim()) {
      chunks.push(this.createChunk(documentId, chunkIndex, buffer.trim()));
    }

    console.log(`[IndexingService] chunkDocument produced ${chunks.length} chunks for ${documentId}`);
    return chunks;
  }

  private createChunk(documentId: string, index: number, content: string): Chunk {
    return {
      id: uuidv4(),
      documentId,
      content,
      index,
      metadata: {
        charCount: String(content.length),
        wordCount: String(content.split(/\s+/).length),
      },
    };
  }
}
