# Rivian R2 Pickup Day

A private mobile web app for a Rivian R2 delivery inspection. It has 100 checks in 12 sections, including a dedicated after-wake recheck, and saves one editable inspection across devices.

## Use the app

The live app link is listed in [LIVE-APP.md](LIVE-APP.md).

1. Sign in with the same ChatGPT account on each device.
2. In **Set up vehicle**, enter the full VIN, delivery date, location and configuration.
3. Tap each inspection box: **Unchecked → Good → Minor issue → Major issue → Unchecked**. These are repeated ordinary taps, not timed double-clicks.
4. Use **Notes & status** for observations, photo references, Not applicable, or Not tested. Issues also have agreed-action/service-ticket fields and a resolution check.
5. Wait for **Saved to your account**, or tap **Save now**.
6. **Export PDF** creates either a complete inspection or an issues-only handoff report. On iPhone, use **Save / Share PDF → Save to Files**, or use the download/open links.
7. Return to the app and enter the last four VIN characters to reopen the inspection.

On iPhone Safari, **Share → Add to Home Screen** adds an app icon. Network access is needed to open and sync inspections. If a connection drops while editing, a local recovery draft preserves pending changes when browser storage is available. The interface distinguishes unsynced changes from confirmed server saves. This is not a fully offline app.

## Privacy and storage

The live Site is private. ChatGPT account authentication is the security boundary; four VIN characters are a lookup convenience, not a password. The server scopes every read and write to the authenticated owner. Full VINs and inspection notes are stored in the private application database, not in this repository or URLs. Authenticated API responses use `Cache-Control: no-store, private`.

Saving uses an atomic revision comparison. Changes to different fields can merge; competing edits to the same detail need an explicit choice. A repair confirmation cannot silently resolve a concurrently changed concern. A PDF is a separate snapshot and does not replace the editable record.

This project needs a server and database. GitHub Pages alone cannot provide its account authentication or cross-device storage. The repository holds the app source; Sites runs its private server and database.

## Checklist coverage

Your R2; Exterior; Wheels; Lights; Openings; Cabin; Controls; Short drive; Access & audio; App & features; After wake; Handover.

The uploaded **Rivian-R2-PDI-Checklist.pdf (Rev 5)** is the base. It is adapted in fresh wording and supplemented with battery/charging checks and selected R2 owner observations. Reports are anecdotes, not defect-rate evidence. Configuration-dependent features can be marked not applicable. An untested check is never counted as good.

Sources:

- [DIY Wrap Club delivery checklist](https://www.diywrapclub.com/a/blog/rivian-r2-delivery-day-checklist-what-to-inspect-on-day-1-free-pdf-download)
- [Official R2 equipment](https://rivian.com/r2)
- [Official R2 configurator](https://rivian.com/configurations/builder/r2)
- [Official R2 color palette](https://rivian.com/stories/r2-color-palette-paint-finishes-2026)
- [R2 delivery report: hood, paint and display bezel](https://www.reddit.com/r/RivianR2/comments/1wbci81/our_r2_delivery_day_experience/)
- [R2 delivery report: keycards and trim](https://www.reddit.com/r/RivianR2/comments/1vtqafj/r2_delivery_day_impressions_mostly_great_a_few/)
- [R2 delivery checklist discussion](https://www.reddit.com/r/RivianR2/comments/1v1skrh/r2_delivery_checklist/)

## Development

Node.js 24 is used for validation. The app uses React/Vinext, a Cloudflare Worker, D1, and jsPDF. The checked-in `pnpm-lock.yaml` is the dependency lockfile.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Hosted authentication is dispatch-owned. `lib/identity.ts` includes a development-only identity fixture strictly limited to the internal preview hosts; production requests always need the platform's authenticated identity. Do not expose a development server to the public internet. Local database setup uses the schema migration under `drizzle/`; production migrations are applied by the hosting workflow.

Key files:

- `app/pickup-app.tsx`: setup, VIN lookup, mobile checklist, notes, review and export
- `lib/checklist.json`: versioned inspection content and source notes
- `lib/use-inspection.ts`: autosave, recovery drafts, conflict handling and refresh
- `app/api/inspections/route.ts`: owner-scoped create/read/update API
- `lib/pdf-report.ts`: standalone PDF generation and pagination
- `db/schema.ts`, `drizzle/`: database schema and migration
- `tests/`: tap/merge/validation and SQLite-backed API regression tests; PDF layout fixture

## Validation

Automated checks cover 100 stable item IDs, the four-state tap sequence, completion counts, valid VIN/date input, independent-field merging, conflicting edits, severity/resolution conflicts, idempotent creation, stale-revision rejection, owner isolation, anonymous rejection, and CSRF request-header validation. Browser checks cover setup, repeated taps, notes and confirmed saves. Full and issue PDF reports were rendered and visually checked, including long notes and page transitions.

The report font is a subset of DejaVu Sans; see `FONT-LICENSE.txt`. This app is an independent personal inspection aid and is not affiliated with Rivian.
