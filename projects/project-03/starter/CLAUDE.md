# CLAUDE.md -- Quick Reference for Claude Code

@AGENTS.md

## Project Overview

This is an Electron + TypeScript + React knowledge base application for project-03, focusing on **multi-session continuity with scope control**. It builds on the P2 foundation with document chunking, metadata extraction, indexing status UI, and grounded Q&A with citations.

## Build & Run

```bash
npm install        # Install dependencies
npm run check      # Type-check without emitting
npm run build      # Compile main/preload + bundle renderer
npm run dev        # Build + launch Electron
npm test           # Run vitest suite
```

## Key Files

| File | Purpose |
|------|---------|
| `src/main/main.ts` | Electron entry point, window creation, service wiring |
| `src/main/ipc-handlers.ts` | IPC channel registration |
| `src/preload/preload.ts` | contextBridge API exposure |
| `src/renderer/App.tsx` | Root React component |
| `src/renderer/components/StatusBar.tsx` | Indexing status display |
| `src/renderer/components/QuestionPanel.tsx` | Q&A input with citations display |
| `src/services/document-service.ts` | Document CRUD with metadata extraction |
| `src/services/indexing-service.ts` | Paragraph-aware chunking (~500 chars) |
| `src/services/qa-service.ts` | Mock Q&A with citations and confidence |
| `src/services/persistence-service.ts` | File I/O for data persistence |
| `src/shared/types.ts` | Shared types and IPC channel constants |
| `feature_list.json` | Feature tracking with pass/fail status and evidence |

## Architecture Rules

- Renderer never imports Node.js modules.
- All main-renderer communication goes through IPC.
- Services use constructor-injected `PersistenceService`.
- IPC channel names live in `src/shared/types.ts`.
- Named exports only; no `any` without a comment explaining why.

## New Features for P3

| Feature | Description |
|---------|-------------|
| **Document Chunking** | `IndexingService` splits documents into ~500 char chunks at paragraph boundaries |
| **Metadata Extraction** | Extract word count, line count, file type on import |
| **Indexing Status UI** | `StatusBar` shows indexing progress with document counts |
| **Grounded Q&A** | `QaService` returns answers with document citations and confidence scores |

## How to Add a Feature

1. Define the IPC channel in `src/shared/types.ts`.
2. Add the handler in `src/main/ipc-handlers.ts`.
3. Expose the API in `src/preload/preload.ts`.
4. Add the type declaration in `src/renderer/types.d.ts`.
5. Build the UI in `src/renderer/components/`.
6. Update `feature_list.json` with the result.

## Session Handoff

When starting a session, check for `session-handoff.md` at the project root. If it exists, read it first to resume work instantly. If missing, reconstruct state from `feature_list.json`, `docs/ARCHITECTURE.md`, `docs/PRODUCT.md`, and the current git diff.

Before ending a session, write/update `session-handoff.md` recording:
- What was accomplished
- What remains (next unfinished feature)
- Any blockers or decisions made
- Files that were modified

## Testing

```bash
npm test           # Run vitest suite
npm run test:watch # Run tests in watch mode
```