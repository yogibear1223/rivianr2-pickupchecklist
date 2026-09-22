import legacy from './checklist.json';
import { blankEntry, counts, type Entry, type Inspection, type Section, type VehicleMeta } from './model';

export type InspectionPhase = 'pickup' | 'followup';
export const definitionVersion = 'r2-quick-2026-09-v2';
export const deliverySections: Section[] = [
  { id: 'quick-confirm', title: 'Confirm your R2', subtitle: 'Start with your order and the vehicle in front of you.', items: [
    { id: 'quick-vin', title: 'VIN matches your order', detail: 'Compare the vehicle VIN with your order and paperwork.' },
    { id: 'quick-order-mileage', title: 'Configuration and mileage match', detail: 'Confirm paint, interior and wheels. Photograph the mileage and compare it with the paperwork.' },
    { id: 'quick-equipment', title: 'Expected accessories are here', detail: 'Check the charger, adapters, air pump and accessories on your order. Collect a plate bracket if needed; note anything shipping separately.' },
  ] },
  { id: 'quick-exterior', title: 'Walk around', subtitle: 'One lap for visible delivery damage.', items: [
    { id: 'quick-paint', title: 'Paint and body look clean', detail: 'Look for obvious dents, chips, scratches or residue. Photograph any concern.' },
    { id: 'quick-panels', title: 'Panels line up', detail: 'Check the hood, doors, roof and liftgate for conspicuous uneven gaps, raised edges or rubbing.' },
    { id: 'quick-glass-cameras', title: 'Glass and camera lenses are intact', detail: 'Look for cracks or damage in visible glass and the front, mirror and rear camera lenses.' },
    { id: 'quick-wheels-tires', title: 'Wheels and tires look undamaged', detail: 'Look at all four rims and visible tire sidewalls for scrapes, cuts or bulges.' },
    { id: 'quick-weather-seals', title: 'Seals are seated', detail: 'Check around the doors, frunk and liftgate for loose, folded or damaged seals.' },
    { id: 'quick-underbody', title: 'Visible underside looks intact', detail: 'Look from the perimeter for hanging parts, damage or unexplained fluid. Ask the specialist about any concern.' },
    { id: 'quick-charge-door', title: 'Charge-port door works', detail: 'Open and close it once; check the fit and visible condition.' },
  ] },
  { id: 'quick-cabin', title: 'Quick cabin check', subtitle: 'Stay parked and run the A/C while you look.', items: [
    { id: 'quick-openings', title: 'Doors, frunk and liftgate close properly', detail: 'Open and close once with the specialist; check for a bad latch or rubbing.' },
    { id: 'quick-upholstery', title: 'Seat surfaces are undamaged', detail: 'Scan the seats for cuts, tears, stains or scuffs.' },
    { id: 'quick-headliner-trim', title: 'Headliner and trim are secure', detail: 'Look at front and rear headliner edges and loose trim. Ask the specialist to secure any loose emergency-release cover.' },
    { id: 'quick-gloveboxes', title: 'Gloveboxes open and latch', detail: 'Open and close each fitted glovebox once.' },
    { id: 'quick-driver-position', title: 'Driver position is ready', detail: 'Adjust the driver’s seat and mirrors, save the position, and buckle the driver’s belt.' },
    { id: 'quick-climate-display', title: 'A/C runs; warnings are explained', detail: 'Turn on cooling. Look for an obvious display fault or warning and have the specialist explain it.' },
  ] },
  { id: 'quick-handover', title: 'Handover', subtitle: 'Finish the parked inspection with your specialist.', items: [
    { id: 'quick-keys', title: 'Keys received and paired', detail: 'Receive the supplied physical keys and confirm your phone key and vehicle account are set up.' },
    { id: 'quick-ready-to-leave', title: 'Controls understood; enough charge', detail: 'Have the specialist explain Park/Drive, basic braking and charging. Check battery charge for the trip. Stay parked until acceptance is complete.' },
    { id: 'quick-issue-handover', title: 'Concerns documented with next steps', detail: 'Photograph concerns and have the specialist record them. Save agreed actions and any case number in Notes & status.' },
    { id: 'quick-reporting-deadline', title: 'Reporting deadline confirmed', detail: 'Confirm the cosmetic-reporting window in writing. Use Notes & status to record the exact deadline, instructions and specialist’s name.' },
  ] },
];
export const followupSections: Section[] = [
  { id: 'after-acceptance', title: 'After you take delivery', subtitle: 'Driving and longer setup checks begin after acceptance.', items: [
    { id: 'follow-storage', title: 'Set up camera storage, if wanted', detail: 'While parked after acceptance, connect the drive, check cable clearance, run the speed test and enable Road Cam. Back up files before formatting; formatting erases the drive.', conditional: true },
    { id: 'follow-drive', title: 'Listen and feel on your first drive', detail: 'During normal, safe driving after acceptance, notice steering, braking, rattles, wind noise and new warnings. Stop safely and contact Rivian if a safety concern appears.' },
    { id: 'follow-charging', title: 'Complete a charging session', detail: 'At an available compatible charger, confirm charging starts, continues and stops normally. Check your app and supplied adapters as applicable.' },
  ] },
  { id: 'first-week', title: 'During your first week', subtitle: 'Work through these soon; report concerns as you find them.', items: [
    { id: 'follow-cosmetics', title: 'Take a closer look in daylight', detail: 'Recheck paint, glass, cabin trim and seals. Photograph concerns and report them promptly within your confirmed cosmetic-reporting window.' },
    { id: 'follow-openings-keys', title: 'Try windows, locks and every key', detail: 'Test every window and supplied key, phone-key behavior, door locks and opening controls.' },
    { id: 'follow-lights-cameras', title: 'Check lights, wipers and camera views', detail: 'Check exterior lights, signals, wipers, washers and available camera views. Test functions safely while parked.' },
    { id: 'follow-seats-climate', title: 'Try passenger seats and comfort controls', detail: 'Check remaining belts before passengers use them, seat movement/folding, equipped seat heating or ventilation, and heating/cooling.' },
    { id: 'follow-audio-ports', title: 'Try phone, audio and charging ports', detail: 'Test a call, music/speakers, USB and phone charging, and the app features you use.' },
    { id: 'follow-wake', title: 'Recheck after the vehicle sleeps', detail: 'After a normal sleep/wake cycle, recheck access, displays, camera views, lights and glovebox latches for intermittent problems.' },
    { id: 'follow-report', title: 'Report and track remaining concerns', detail: 'Submit concerns through the Rivian app promptly. Keep photos, service-request numbers and agreed next steps here; follow the deadline confirmed by your delivery team.' },
  ] },
];
export const currentSections = [...deliverySections, ...followupSections];
const currentIds = new Set(currentSections.flatMap(section => section.items.map(item => item.id)));
const legacySections = legacy.sections as Section[];
export const hasRecordedEntry = (entry?: Entry) => !!entry && (entry.status !== 0 || !!entry.note || !!entry.action || entry.resolved);

// Old answers keep their original meaning. A checked component never passes a new grouped task.
export function previousSections(doc: Inspection): Section[] {
  const previous = legacySections.map(section => ({ ...section, id: 'previous-' + section.id, title: 'Earlier / ' + section.title, subtitle: 'Saved from the previous detailed checklist.', items: section.items.filter(item => !currentIds.has(item.id) && hasRecordedEntry(doc.entries[item.id])) })).filter(section => section.items.length);
  const knownIds = new Set([...currentIds, ...legacySections.flatMap(section => section.items.map(item => item.id))]);
  const unknown = Object.keys(doc.entries).filter(id => !knownIds.has(id) && hasRecordedEntry(doc.entries[id]));
  if (unknown.length) previous.push({ id: 'previous-other', title: 'Earlier / Other saved checks', subtitle: 'Previously recorded entries retained with their original identifiers.', items: unknown.map(id => ({ id, title: 'Saved check: ' + id, detail: 'Review the original observation and agreed action below.' })) });
  return previous;
}
export function recordSections(doc: Inspection): Section[] {
  return [
    ...deliverySections.map(section => ({ ...section, title: 'Pickup / ' + section.title })),
    ...followupSections.map(section => ({ ...section, title: 'After delivery / ' + section.title })),
    ...previousSections(doc),
  ];
}
export const makeDocument = (meta: VehicleMeta): Inspection => ({ schemaVersion: 1, checklistVersion: definitionVersion, meta, entries: Object.fromEntries(currentSections.flatMap(section => section.items).map(item => [item.id, blankEntry()])), overallNotes: '', deliveryDecision: 'undecided' });
export function inspectionSummary(doc: Inspection) {
  const pickup = counts(doc, deliverySections), all = counts(doc, recordSections(doc));
  return { total: pickup.total, completed: pickup.reviewed, issues: all.open };
}
