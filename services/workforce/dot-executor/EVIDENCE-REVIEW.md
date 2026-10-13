# Evidence Review Package — Scout vertical slice (2026-10-12)
**Human review: PENDING — owner approval not claimed.**

All paths relative to `~/workspace/forgeos/services/workforce/dot-executor/`.

## What to open

| # | Evidence | Path | Open with |
|---|---|---|---|
| 1 | Status report (stages, outcome, screenshots) | `runs/slice1/report.html` | `xdg-open runs/slice1/report.html` — or double-click in Files |
| 2 | Screenshot: page loaded | `runs/slice1/screenshots/step1-loaded.png` | any image viewer |
| 3 | Screenshot: final state | `runs/slice1/screenshots/step2-final.png` | any image viewer |
| 4 | Task result JSON | `runs/slice1/result.json` | `cat runs/slice1/result.json` |
| 5 | SQLite task store + full action traces | `runs/tasks.db` | `sqlite3 runs/tasks.db "SELECT id,status,title FROM dot_task_history;"` then `sqlite3 runs/tasks.db "SELECT action_type,substr(detail,1,80) FROM dot_task_actions WHERE task_id='<id>';"` |
| 6 | T1–T8 test results | `../../../goals/forgeos-workforce-opendots-integration-and-storage/files/VERTICAL-SLICE-DELIVERABLE.md` | any markdown viewer |
| 7 | API-driven run report | `runs/api-task_1791815028995_1rbyfj/report.html` | `xdg-open` as above |
| 8 | Failure-test reports | `runs/slice-fail*/report.html` | `xdg-open` as above |

## What the evidence proves (agent-verified, owner to confirm)

- Task `task_1791814795142_9u5jgm` (standalone) and `task_1791815030831_qym94l` (via `POST /api/tasks`): **completed** — title "Example Domain", 1 visible link, HTTP 200.
- 4 failure runs: honest `failed` with error traces, sessions destroyed, ~5 s each.
- 6 tasks total persisted in `runs/tasks.db`, readable from fresh processes after runner exit (restart-proof).
- 15-action trace per success run: received → routed → executing → shim-ready → allowlist-check → browser-launch → navigate → response → screenshot → extract → screenshot → browser-close → dot-result → shim-stopped → cleanup-check.

## Credential hygiene (re-verified 2026-10-12)

Scanned: all task titles/plans/outcomes/actions in `runs/tasks.db`, all `report.html`, all run outputs.
- `proxy-authorization` header name: **0 occurrences** in any evidence file.
- `document.cookie` / `set-cookie`: **0**.
- `bearer <token>` patterns: **0**.
- `api_key=` / `password=` / `secret=` assignments: **0**.
- Long tokens present are file paths and JSON fragments only (verified non-base64).
- The proxy credential exists only in the process environment at runtime, is re-read per connection by `proxy-shim.py`, and is never written to disk, logs, or the database. Verified by code inspection + output scans.

## Known to the reviewer

- TLS uses `--ignore-certificate-errors` (proxy MITM; see hardening notes). No credentials are used in these tasks.
- T4 (result correctness) verified by the building agent against the screenshot; **owner's visual check is the final gate**.
