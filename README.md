# Rivian R2 Pickup Day

A private mobile web app for a Rivian R2 delivery inspection. It opens with 20 core parked pickup checks along seven physical stops, plus one check for each accessory listed in the vehicle setup, targeting 15–20 minutes within a 30-minute appointment. Ten after-delivery checks have separate progress. One editable record stays available across devices.

## Use the app

The live app link is listed in [LIVE-APP.md](LIVE-APP.md).

1. Sign in with the same ChatGPT account on each device.
2. In **Set up vehicle**, enter the full VIN, delivery date, location and configuration. **Import configuration & accessories** can fill recognized details from pasted order text or a selectable-text PDF after you review them.
3. Use **At pickup** for the 20 core parked checks and your individual ordered accessories. The accessory list in setup accepts one item per line or comma-separated items; imported accessories appear here automatically. **After delivery** contains first-drive, charging, camera-storage and first-week checks. Tap each inspection box: **Unchecked → Good → Minor issue → Major issue → Unchecked**. These are repeated ordinary taps, not timed double-clicks.
4. Use **Notes & status** for observations, photo references, Not applicable, or Not tested. Issues also have agreed-action/service-ticket fields and a resolution check.
5. Wait for **Saved to your account**, or tap **Save now**.
6. **Export PDF** offers a pickup report with each accessory, a complete pickup/follow-up record, or an issues-only report. Every choice includes all recorded issues across stages, including earlier saved concerns. On iPhone, use **Save / Share PDF → Save to Files**, or use the download/open links.
7. Return to the app and enter the last four VIN characters to reopen the inspection.

On iPhone Safari, **Share → Add to Home Screen** adds an app icon. Network access is needed to open and sync inspections. If a connection drops while editing, a local recovery draft preserves pending changes when browser storage is available. The interface distinguishes unsynced changes from confirmed server saves. This is not a fully offline app.

## Pickup timing and follow-up

The default view is **Pickup check · 15–20 min**, with 20 short core parked checks and one extra check per ordered accessory:

| Group | Checks | Target |
| --- | ---: | ---: |
| Front & frunk | 3 | 2–3 min |
| Passenger side | 2 | 2 min |
| Rear & cargo | 2 + accessories | 2–3 min |
| Driver side | 3 | 2–3 min |
| Cabin pass | 2 | 2–3 min |
| Driver’s seat | 4 | 3–4 min |
| Handover | 4 | 2 min |

This is designed for the user's 30-minute appointment, including the surrounding handover. Prepare details before arrival. Each accessory added during setup appears beneath the supplied-equipment check and counts toward pickup progress. Findings or a long accessory list can take extra discussion; do not mark an unperformed check Good to meet the time target.

**Driving checks happen only after acceptance.** The separate **After delivery** view has 10 checks for optional camera-storage/Road Cam setup while parked, the first drive, an actual charging session, closer cosmetic review, windows/keys, lights/cameras, comfort controls, audio/ports, sleep/wake and follow-up reporting. Its completion counter does not block completing the pickup list.

**First week is a planning target.** Confirm the applicable cosmetic-reporting deadline with the delivery specialist in writing, record it in **Handover → Reporting deadline confirmed → Notes & status**, and report concerns promptly in the Rivian app. The app does not assert a universal seven-day warranty, damage-reporting or return entitlement. The confirmed reporting notes appear in every PDF.

### Existing inspection records

Existing metadata, answers, notes, actions and issue resolutions remain in their original records. Recorded entries from the previous detailed checklist are available under **Previously recorded checks** and in the complete PDF. Their issues also appear in the global Issues view and every export. Blank legacy rows are not presented as new work. New grouped checks have distinct IDs so a partial old check never automatically passes a broader new one. Reopening/rendering an old record does not mutate it.

## Import a configuration or accessory receipt

Open **Import configuration & accessories** in setup or **Vehicle** on an existing inspection. Paste the selected configuration/order summary, or choose a PDF, then review the detected details. PDF selection starts recognition automatically; pasted text uses **Find details**.

- Recognizes known R2 trims, packages, paints, interiors and wheel names, plus an explicitly provided VIN, delivery date/time and delivery location.
- Lists accessories from itemized order sections. Unknown accessory lines are shown for review. Separate Gear Shop or vendor receipts can be imported one at a time.
- Multiple detected values need a selection. Entire shopping/catalog pages do not preselect purchases; recommendation sections are skipped.
- An accessory receipt does not overwrite the vehicle's installed configuration. Package names do not imply paint or separately purchased accessories.
- Select or edit each finding, then **Use selected details**. Review the filled form and create the inspection or save vehicle details. Unselected/missing details preserve existing entries; an existing inspection's VIN remains fixed.
- Accessory names are appended with normalized-name deduplication. Repeated imports do not add the same product again. Quantities are not automatically reconciled across orders; edit them if the same product was bought more than once.
- The original PDF/text is read on the current device and is not uploaded or retained in the account. Confirmed metadata uses the same private storage as manually entered details. No external AI service or API key is used.

PDFs must have selectable text, be at most 12 MB and have at most 20 pages. Scanned/image-only files require copied OCR text or a new PDF saved from the order page. The app reports pages without readable text. Recognition is based on known names and labeled/order sections and cannot guarantee that every private order layout or accessory is recognized; always review against the source. It cannot discover purchases missing from the supplied document. Gear Shop purchases may ship separately from the vehicle.

## Privacy and storage

The live Site is private. ChatGPT account authentication is the security boundary; four VIN characters are a lookup convenience, not a password. The server scopes every read and write to the authenticated owner. Full VINs and inspection notes are stored in the private application database, not in this repository or URLs. Authenticated API responses use `Cache-Control: no-store, private`.

Saving uses an atomic revision comparison. Changes to different fields can merge; competing edits to the same detail need an explicit choice. A repair confirmation cannot silently resolve a concurrently changed concern. A PDF is a separate snapshot and does not replace the editable record.

This project needs a server and database. GitHub Pages alone cannot provide its account authentication or cross-device storage. The repository holds the app source; Sites runs its private server and database.

## Checklist coverage

The default pickup flow follows the supplied **Rivian_R2_Delivery_Day_Checklist.pdf**, adapted from Super EV LOG's video: vehicle/order, exterior condition, quick cabin/equipment checks and documented handover. Page 2's longer added reminders are not all required during pickup. Driving and longer checks are after delivery, as requested by the user.

The original **Rivian-R2-PDI-Checklist.pdf (Rev 5)** content remains only as the definition for earlier saved entries. All statuses preserve the same meaning: Good, Minor, Major, Unchecked, Not applicable and Not tested. A changed severity reopens a previously resolved concern.

Sources:

- [Super EV LOG delivery video](https://www.youtube.com/watch?v=jAC7ajGA_S4) — source named in the supplied shorter PDF
- [Rivian service and issue reporting](https://rivian.com/experience/service)
- [DIY Wrap Club delivery checklist](https://www.diywrapclub.com/a/blog/rivian-r2-delivery-day-checklist-what-to-inspect-on-day-1-free-pdf-download)
- [Official R2 equipment](https://rivian.com/r2)
- [Official R2 configurator](https://rivian.com/configurations/builder/r2)
- [Official R2 color palette](https://rivian.com/stories/r2-color-palette-paint-finishes-2026)
- [Official Launch Package contents](https://rivian.com/stories/launch-package-r2-limited-edition)
- [Official R2 Gear Shop names](https://gearshop.rivian.com/collections/r2)
- [Gear Shop shipping](https://gearshop.rivian.com/pages/shipping)
- [R2 delivery report: hood, paint and display bezel](https://www.reddit.com/r/RivianR2/comments/1wbci81/our_r2_delivery_day_experience/)
- [R2 delivery report: keycards and trim](https://www.reddit.com/r/RivianR2/comments/1vtqafj/r2_delivery_day_impressions_mostly_great_a_few/)
- [R2 delivery checklist discussion](https://www.reddit.com/r/RivianR2/comments/1v1skrh/r2_delivery_checklist/)

## Development

Node.js 24 is used for validation. The app uses React/Vinext, a Cloudflare Worker, D1, jsPDF for reports, and PDF.js for browser-local text extraction. The checked-in `pnpm-lock.yaml` is the dependency lockfile.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Hosted authentication is dispatch-owned. `lib/identity.ts` includes a development-only identity fixture strictly limited to the internal preview hosts; production requests always need the platform's authenticated identity. Do not expose a development server to the public internet. Local database setup uses the schema migration under `drizzle/`; production migrations are applied by the hosting workflow.

Key files:

- `app/pickup-app.tsx`: setup, VIN lookup, mobile checklist, notes, review and export
- `lib/inspection-plan.ts`: 20 core parked pickup checks, individual ordered-accessory checks, 10 follow-ups, truthful summaries and earlier-record preservation
- `lib/checklist.json`: original detailed definitions used for earlier saved entries
- `lib/use-inspection.ts`: autosave, recovery drafts, conflict handling and refresh
- `app/api/inspections/route.ts`: owner-scoped create/read/update API
- `lib/pdf-report.ts`: standalone PDF generation and pagination
- `components/configuration-import.tsx`, `lib/configuration-import.ts`: import review, detection and safe metadata merge
- `lib/pdf-text.ts`: bounded PDF text extraction using a self-hosted PDF.js worker
- `components/inspection-time.tsx`, `lib/inspection-time.ts`: 15–20 minute pickup budget and after-delivery guidance
- `db/schema.ts`, `drizzle/`: database schema and migration
- `tests/`: tap/merge/validation and SQLite-backed API regression tests; PDF layout fixture

## Validation

Automated checks cover 20 core pickup / 10 follow-up items, per-accessory checks and cross-device accessory edits, preservation of the original 100 item definitions and saved answers, separate phase counts, global issue visibility, severity-change reopening, the four-state tap sequence, completion counts, valid VIN/date input, independent-field merging, conflicting edits, severity/resolution conflicts, idempotent creation, stale-revision rejection, owner isolation, anonymous rejection, and CSRF request-header validation. Pickup, complete and issues PDF reports were rendered and visually checked, including individual accessories, long notes, all-stage concerns, reporting instructions and page transitions.

Import checks cover wrapped PDF lines, multiple choices, selected-versus-recommended options, product names containing paint/wheel labels, receipts with unknown items, date/VIN ambiguity, metadata preservation, immutable VINs and duplicate accessories. Real generated multipage PDFs exercise text extraction and recognition, mixed text/blank pages, invalid files, page/size bounds and cancellation. The browser preview connection has remained unavailable for these updates, so the import and two-stage checklist UI have not received browser/device interaction verification. Core behavior, safe persistence, imports and generated reports are covered by the checks above.

The report font is a subset of DejaVu Sans; see `FONT-LICENSE.txt`. This app is an independent personal inspection aid and is not affiliated with Rivian.

## Scroll-linked area guide

The pickup list is a continuous exterior lap (front → passenger side → rear → driver side), then cabin and seated handover. A sticky official Rivian R2 image sequence rotates as the active stop changes. Gray artwork retains context; color highlights the current area. Interior and open-compartment checks switch to cropped views from the supplied configurator screenshots, with area-specific highlight masks. Reduced-motion preferences switch views without animation. The reference vehicle is Launch Green and does not represent the saved configuration. Artwork provenance is in public/r2-360/README.md.

Detail artwork extraction and provenance: `public/r2-details/README.md`. The five optimized crops total approximately 150 KB and exclude browser chrome, notifications and order/sidebar content.

### Motion and highlight rendering

The guide decodes images before transitions, interpolates adjacent exterior frames, and eases toward the next stop as it approaches the reading line. Canvas snapshots allow interrupted transitions to continue from what is actually visible. Entering the cabin blends through the open-door reference and zooms toward the door before showing the interior. This is a composed image transition, not a hinged-door 3D simulation. Highlights use curved paths following visible body seams, wheel arches, upholstery and display contours. Reduced motion shows the destination directly. The rendering canvas maintains a fixed aspect ratio to avoid layout shifts.

### Recorded opening transitions (September 23)

Three cropped, silent clips from the owner's configurator recording now supply actual hood, liftgate, and driver-side door motion (about 210 KB combined). The guide plays each transition once when entering its relevant area and blends into the existing contoured inspection highlight. The 72-frame exterior rotation remains scroll driven. Rapid navigation cancels the previous animation, and reduced-motion settings or unavailable/blocked playback use the reference stills. No loading frames, account/sidebar content, or audio from the recording are included. Interior entry is a crossfade, not a continuous 3D camera path through a door; the source recording does not contain that path.

Validated inline muted clip playback and rapid stop navigation in the managed browser preview, plus TypeScript checking and the production build. Physical iOS Safari/Home Screen playback remains unverified; the still-image fallback is retained.
