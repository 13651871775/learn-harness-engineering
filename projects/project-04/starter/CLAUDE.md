# CLAUDE.md -- Quick Reference for Claude Code

@AGENTS.md

## Project Overview

This is an Electron + TypeScript + React knowledge base application for project-04. It builds on the P3 foundation with incremental indexing, grounded Q&A with citations, and a **seeded indexing defect** that causes large-file chunking to fail silently.


## Build & Run

```bash
npm install        # Install dependencies
npm run check      # Type-check without emitting (tsconfig.json + tsconfig.node.json)
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
| `src/renderer/components/ImportPanel.tsx` | File import UI |
| `src/renderer/components/DocumentList.tsx` | Document list with selection |
| `src/renderer/components/DocumentDetail.tsx` | Document detail with chunk viewer |
| `src/renderer/components/QuestionPanel.tsx` | Q&A input with citations display |
| `src/renderer/components/StatusBar.tsx` | Indexing status display |
| `src/services/document-service.ts` | Document CRUD with metadata extraction |
| `src/services/indexing-service.ts` | Paragraph-aware chunking (~500 chars) — **contains seeded bug** |
| `src/services/qa-service.ts` | Mock Q&A with citations and confidence |
| `src/services/persistence-service.ts` | File I/O for data persistence |
| `src/shared/types.ts` | Shared types and IPC channel constants |
| `scripts/dev.js` | Dev build pipeline (tsc + vite + electron) |
| `vite.config.ts` | Renderer Vite config |
| `vite.preload.config.ts` | Preload Vite config (self-contained CJS bundle) |
| `tsconfig.json` | Renderer TypeScript config |
| `tsconfig.node.json` | Main/preload TypeScript config |

## Architecture Rules

- Renderer never imports Node.js modules.
- All main-renderer communication goes through IPC.
- Services use constructor-injected `PersistenceService`.
- IPC channel names live in `src/shared/types.ts` — single source of truth.
- Preload is a self-contained CJS bundle; `electron` is the only external dependency.
- Main process compiles via `tsconfig.node.json` (CommonJS); renderer bundles via Vite (ESM).
- Named exports only; no `any` without a comment explaining why.

## New Features for P4

| Feature | Description |
|---------|-------------|

| **Fix Indexing Bug** | Fix the seeded chunking bug so large documents produce valid chunks |
| **Error State UI** | Surface error states in StatusBar and document detail with actionable messages |

## How to Add a Feature

1. Define the IPC channel in `src/shared/types.ts`.
2. Add the handler in `src/main/ipc-handlers.ts`.
3. Expose the API in `src/preload/preload.ts`.
4. Add the type declaration in `src/renderer/types.d.ts`.
5. Build the UI in `src/renderer/components/`.

## Testing

```bash
npm test           # Run vitest suite
npm run test:watch # Run tests in watch mode
```