# CLAUDE.md

## Startup
Before writing any code:
1. Read AGENTS.md.
2. Read feature_list.json and pick the highest-priority unfinished feature.
3. Run `npm install && npm run check` to verify the build.

## Feature Lifecycle

- **Pick a feature**: Read `feature_list.json`, find the first `"status": "not-started"` feature.
- **Complete a feature**: After `npm run check` passes and the feature is working, update its entry in `feature_list.json`:
  - Set `"status": "pass"`
  - Set `"evidence"` to a short description of what was implemented
  - Set `"testedAt"` to `new Date().toISOString()`
  - If you pause mid-feature, set `"status": "in-progress"` so the next session picks up correctly.