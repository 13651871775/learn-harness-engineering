import { Document, AppStatus, Chunk, QAResponse, QAHistory } from '../shared/types';

declare global {
  interface Window {
    knowledgeBase: {
      documents: {
        list: () => Promise<Document[]>;
        import: (filePath: string) => Promise<Document>;
        get: (id: string) => Promise<Document | null>;
        delete: (id: string) => Promise<boolean>;
      };
      indexing: {
        start: (documentId?: string) => Promise<AppStatus>;
        status: () => Promise<AppStatus>;
        chunks: (documentId: string) => Promise<Chunk[]>;
      };
      qa: {
        ask: (question: string) => Promise<QAResponse>;
        history: () => Promise<QAHistory[]>;
      };
    };
  }
}

export {};
