import type { VehicleMeta } from './model';

export const MAX_IMPORT_TEXT = 160_000;
export type ImportMode = 'auto' | 'vehicle' | 'accessories';
export type ImportField = 'vin' | 'trim' | 'package' | 'paint' | 'interior' | 'wheels' | 'deliveryDate' | 'deliveryTime' | 'location';
export const importLabels: Record<ImportField, string> = {
  vin: 'VIN', trim: 'R2 trim', package: 'Package', paint: 'Exterior paint', interior: 'Interior',
  wheels: 'Wheels & tires', deliveryDate: 'Delivery date', deliveryTime: 'Appointment time', location: 'Delivery location',
};
export type Candidate = { value: string; evidence: string };
export type DetectedField = { field: ImportField; candidates: Candidate[]; certain: boolean };
export type DetectedAccessory = Candidate & { certain: boolean };
export type ImportResult = { fields: DetectedField[]; accessories: DetectedAccessory[]; warnings: string[]; kind: 'vehicle' | 'accessories' };

const normalize = (s: string) => s.normalize('NFKC').replace(/[‘’]/g, "'").replace(/[“”″]/g, '"').replace(/[–—−]/g, '-').replace(/\u00a0/g, ' ');
const key = (s: string) => normalize(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const trimLine = (s: string) => normalize(s).replace(/^\s*[•●▪✓☑*-]\s*/, '').replace(/\s+/g, ' ').trim();
const evidence = (s: string) => s.slice(0, 240);
const recommendation = /\b(recommended|recommendations|suggested|you may also like|you might also like|customers also|complete your (?:setup|adventure)|optional extras|available accessories|shop accessories)\b/i;
const excluded = /\b(not (?:selected|included|ordered|purchased)|unselected|removed|declined|cancelled|canceled|refunded)\b/i;
const optionalDescription = /\b(?:available|optional|option of|offered|can be (?:added|selected)|choose from|select from|upgrade to)\b/i;
const commerce = /\b(add to (?:cart|bag)|choose options|quick add|sold out|sort by|filter by|out of stock)\b/i;
const accessoryHeading = /^(?:(?:your|selected|included|purchased|ordered)\s+)?(?:options\s*(?:&|and)\s*)?(?:accessories|gear|add-ons|line items|items ordered|order items|items in (?:your|this) (?:order|shipment)|order summary)(?:\s*[:(].*)?$/i;
const sectionEnd = /^(?:subtotal|total|order total|tax(?:es)?|shipping(?: address| method)?|billing(?: address)?|payment(?: method| information)?|financing|(?:delivery|pickup|pick-up)(?: date| time| location| address| center| details)?|appointment(?: date| time)?|vin|vehicle identification(?: number)?|vehicle|configuration|exterior|interior|wheels|summary|contact(?: information)?|customer(?: information)?)(?:\s*[:(].*)?$/i;
const accessoryWord = /\b(mats?|crossbars?|cargo (?:cover|liner|tray)|spare(?: tire)?|chargers?|adapters?|sunshades?|screen protectors?|car cover|device holder|key fob|tow package|autonomy\+|storage (?:case|bin)|organizer|first aid|recovery (?:kit|boards)|tire (?:repair|inflator)|wheel and tire set|interior (?:care )?kit|ceramic|microfiber|t-shirt|hoodie|bottle|waterproof|beasley|rivian care)\b/i;
const nonProduct = /^(?:order\b|thank you\b|confirmed\b|confirmation\b|payment\b|shipping\b|billing\b|delivery\b|customer\b|contact\b|subtotal\b|total\b|tax\b|taxes\b|discount\b|quantity\b|qty\b|price\b|amount\b|item\b|product\b|sku\b|track\b|view\b|continue\b|shop\b|https?:|www\.|page \d|\d+\s+of\s+\d+|\$|\d+[.,]\d{2}$)/i;

type Rule = { field: ImportField; pattern: RegExp; label: RegExp; value: string };
const rules: Rule[] = [
  ...['Performance', 'Premium', 'Standard'].map(value => ({ field: 'trim' as const, value: 'R2 ' + value, pattern: new RegExp('\\b(?:Rivian\\s+)?R2\\s+' + value + '\\b', 'i'), label: /\b(?:trim|model|vehicle|configuration)\b/i })),
  ...['Launch Green', 'Glacier White', 'Esker Silver', 'Midnight', 'Forest Green', 'Half Moon Grey', 'Catalina Cove', 'Borealis'].map(value => ({ field: 'paint' as const, value, pattern: new RegExp('\\b' + (value === 'Half Moon Grey' ? 'Half Moon Gr[ae]y' : value).replace(/ /g, '\\s+') + '\\b', 'i'), label: /\b(?:exterior|paint|color|colour)\b/i })),
  { field: 'interior', value: 'Black Crater Signature', pattern: /\bBlack\s+Crater\s+Signature\b/i, label: /\binterior\b/i },
  { field: 'interior', value: 'Coastal Cloud Signature', pattern: /\bCoastal\s+Cloud(?:\s+Signature)?\b/i, label: /\binterior\b/i },
  { field: 'interior', value: 'Black Crater', pattern: /\bBlack\s+Crater\b(?!\s+Signature)/i, label: /\binterior\b/i },
  { field: 'wheels', value: '21-inch Liquid Tungsten All-Season', pattern: /\bLiquid\s+Tungsten\b/i, label: /\b(?:wheels?|tires?)\b/i },
  { field: 'wheels', value: '20-inch Black Sand All-Terrain', pattern: /\bBlack\s+Sand\b/i, label: /\b(?:wheels?|tires?)\b/i },
  { field: 'wheels', value: '20-inch Bicolor Carbon All-Season', pattern: /\bBi[- ]?color\s+Carbon\b/i, label: /\b(?:wheels?|tires?)\b/i },
  { field: 'wheels', value: '19-inch Machined Graphite All-Season', pattern: /\bMachined\s+Graphite\b/i, label: /\b(?:wheels?|tires?)\b/i },
  { field: 'package', value: 'Launch Package', pattern: /\bLaunch\s+Package\b/i, label: /\bpackage\b/i },
  { field: 'package', value: 'No package', pattern: /\b(?:no package|without (?:the )?launch package)\b/i, label: /\bpackage\b/i },
];

function unique(candidates: Candidate[]): Candidate[] {
  const seen = new Set<string>();
  return candidates.filter(candidate => { const k = key(candidate.value); if (seen.has(k)) return false; seen.add(k); return true; });
}
function stripPrice(line: string) {
  return line.replace(/\s+(?:\$|USD\s*)[\d,.]+(?:\s*(?:USD|each))?/gi, '').replace(/\s*[|·-]\s*$/g, '').trim();
}
function cleanAccessory(line: string) {
  return stripPrice(line).replace(/^(?:accessories|options & accessories|included|selected|purchased|ordered)\s*:\s*/i, '').replace(/\s+(?:quantity|qty)\s*:?\s*(\d+)\s*$/i, ' (qty $1)').slice(0, 250).trim();
}
const accessoryKey = (s: string) => key(s.replace(/\bRivian\b|\bR2\b|\(qty\s*\d+\)|\b(?:qty|quantity)\s*:?\s*\d+|^\d+\s*[x×]\s*|\s*[x×]\s*\d+$/gi, ''));
export function mergeAccessoryText(existing: string, incoming: string[]): string {
  const original = existing.trim();
  const seen = new Set(original.split(/[\n;,]+/).map(accessoryKey).filter(Boolean));
  const added: string[] = [];
  for (const value of incoming.map(s => s.trim()).filter(Boolean)) {
    const k = accessoryKey(value);
    if (!seen.has(k)) { seen.add(k); added.push(value); }
  }
  return [original, ...added].filter(Boolean).join('\n');
}
function parseDate(value: string): string | null {
  let match = value.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  let year: number, month: number, day: number;
  if (match) [, year, month, day] = match.map(Number);
  else if ((match = value.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/))) [, month, day, year] = match.map(Number);
  else {
    match = value.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})\b/i);
    if (!match) return null;
    month = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(match[1].slice(0, 3).toLowerCase()) + 1;
    day = Number(match[2]); year = Number(match[3]);
  }
  const result = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const parsed = new Date(result + 'T12:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === result ? result : null;
}

export function parseConfigurationText(input: string, mode: ImportMode = 'auto'): ImportResult {
  if (!input.trim()) throw new Error('Paste your order summary or choose a PDF first.');
  if (input.length > MAX_IMPORT_TEXT) throw new Error('This document is too long. Import the configuration or order-summary pages only.');
  let normalized = normalize(input).replace(/([A-Za-z])-\s*\n\s*([a-z])/g, '$1$2').replace(/\s*\|\s*/g, '\n').replace(/\s+(?=(?:exterior(?: paint| color)?|paint|interior|wheels?(?: & tires)?|accessories|vin|delivery (?:date|time|location))\s*:)/gi, '\n');
  for (const rule of rules) normalized = normalized.replace(new RegExp(rule.pattern.source, 'gi'), match => match.replace(/\s*\n\s*/g, ' '));
  const lines = normalized.split(/\r?\n/).map(trimLine).filter(Boolean);
  const kind = mode === 'accessories' || (mode === 'auto' && /\bgear\s*shop\b|\bitems (?:in your order|ordered)\b/i.test(input) && !/\bR2\s+(Performance|Premium|Standard)\b/i.test(input)) ? 'accessories' : 'vehicle';
  const catalog = lines.some(line => commerce.test(line));
  const result: ImportResult = { fields: [], accessories: [], warnings: [], kind };
  const records: { line: string; context: string; accessory: boolean; ignored: boolean }[] = [];
  let inAccessories = false, inRecommendations = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (recommendation.test(line)) inRecommendations = true;
    if (accessoryHeading.test(line) && (kind === 'accessories' || !/^order summary$/i.test(line))) { inAccessories = true; inRecommendations = false; }
    else if (sectionEnd.test(line) || /^(?:exterior|paint|interior|wheels|trim|model|vin|delivery date)\s*:/i.test(line)) inAccessories = false;
    const prefix = i > 0 && /^(?:exterior(?: paint| color)?|paint(?: color)?|interior|wheels?(?: & tires)?|trim|model|vehicle|package|vin|delivery (?:date|time|location)|appointment (?:date|time))\s*:?$/i.test(lines[i - 1]) ? lines[i - 1] + ' ' : '';
    records.push({ line, context: prefix + line, accessory: inAccessories, ignored: inRecommendations || excluded.test(line) || commerce.test(line) || (optionalDescription.test(line) && !/\bselected\b/i.test(line)) });
  }
  if (catalog) result.warnings.push('This looks like a shopping or options page. Detected items are not selected for import; confirm what is actually on your order.');
  if (records.some(r => r.ignored && recommendation.test(r.line))) result.warnings.push('Recommendation sections were skipped. Import your order summary to capture purchased items.');
  const candidates = new Map<ImportField, { value: string; evidence: string; explicit: boolean }[]>();
  const add = (field: ImportField, value: string, context: string, explicit: boolean) => {
    candidates.set(field, [...(candidates.get(field) || []), { value, evidence: evidence(context), explicit }]);
  };
  for (const record of records) {
    const { line, context, accessory, ignored } = record;
    if (ignored) continue;
    if (kind === 'vehicle' && !accessory && !accessoryWord.test(line)) {
      for (const rule of rules) {
        if (rule.pattern.test(context) && !(rule.field === 'package' && rule.value === 'Launch Package' && /without|no launch/i.test(context))) {
          add(rule.field, rule.value, context, rule.label.test(context) || /\bselected\b/i.test(context));
        }
      }
      const trimmed = context.match(/\b(?:trim|model)\s*[:=-]?\s*(Performance|Premium|Standard)\b/i);
      if (trimmed) add('trim', 'R2 ' + trimmed[1][0].toUpperCase() + trimmed[1].slice(1).toLowerCase(), context, true);
      for (const vin of context.toUpperCase().match(/\b[A-HJ-NPR-Z0-9]{17}\b/g) || []) {
        if (/\d/.test(vin) && (/\bVIN\b|vehicle identification/i.test(context) || /^7PD/.test(vin))) add('vin', vin, context, true);
      }
      if (/^(?:(?:your|scheduled|confirmed)\s+)?(?:delivery|pickup|pick-up|appointment)\b/i.test(context) && !/\b(?:estimated|window|between|shipping|shipment|payment|purchase|complete|deadline|due|before|by)\b/i.test(context)) {
        const date = parseDate(context);
        if (date) add('deliveryDate', date, context, true);
        const time = context.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(a\.?m\.?|p\.?m\.?)\b/i);
        if (time) add('deliveryTime', String(Number(time[1]) % 12 + (/^p/i.test(time[3]) ? 12 : 0)).padStart(2, '0') + ':' + (time[2] || '00'), context, true);
        else { const military = context.match(/\b([01]\d|2[0-3]):([0-5]\d)\b/); if (military) add('deliveryTime', military[1] + ':' + military[2], context, true); }
      }
      const location = context.match(/^(?:delivery|pickup|pick-up)\s+(?:location|address|center)\s*[:=-]?\s+(.+)/i);
      if (location && location[1].length <= 250) add('location', location[1], context, true);
    }
    const labeledAccessory = /^(?:accessories|options & accessories|included|selected|purchased|ordered)\s*:/i.test(line);
    if ((!accessoryHeading.test(line) || labeledAccessory) && !sectionEnd.test(line) && (accessory || labeledAccessory || accessoryWord.test(line))) {
      // Product snippets stay candidates; reading a name cannot prove a purchase.
      const values = (labeledAccessory ? line.replace(/^[^:]+:\s*/, '') : line).split(labeledAccessory ? /\s*[;,•]\s*/ : /\s*[;•]\s*/);
      for (const raw of values) {
        const value = cleanAccessory(raw);
        if (!value || value.length < 3 || !/[a-z]/i.test(value) || nonProduct.test(value) || /@|\b\d{5}(?:-\d{4})?\b/.test(value)) continue;
        if (!accessoryWord.test(value) && (rules.some(rule => rule.pattern.test(value)) || /^(?:VIN|[A-HJ-NPR-Z0-9]{17})$/i.test(value))) continue;
        if (!(accessoryWord.test(value) || ((accessory || labeledAccessory) && !/\b(?:R2 (?:Performance|Premium|Standard)|Launch Package)\b/i.test(value)))) continue;
        const certain = !catalog && (labeledAccessory || (accessory && accessoryWord.test(value)));
        result.accessories.push({ value, evidence: evidence(context), certain });
      }
    }
  }
  for (const [field, found] of candidates) {
    const selected = found.filter(value => /\bselected\b/i.test(value.evidence));
    const explicit = found.filter(value => value.explicit);
    // A clear labeled selection can take precedence over unrelated option names.
    const strongest = selected.length ? selected : explicit.length && !catalog ? explicit : found;
    const values = unique(strongest);
    result.fields.push({ field, candidates: values, certain: values.length === 1 && !catalog });
  }
  const accessoriesByKey = new Map<string, DetectedAccessory>();
  for (const accessory of result.accessories) {
    const k = accessoryKey(accessory.value);
    const prior = accessoriesByKey.get(k);
    if (!prior || (!prior.certain && accessory.certain)) accessoriesByKey.set(k, accessory);
  }
  result.accessories = [...accessoriesByKey.values()].slice(0, 80);
  if (result.fields.some(field => field.candidates.length > 1)) result.warnings.push('More than one value was found for some details. Choose the one on your final order.');
  if (!result.fields.length && !result.accessories.length) result.warnings.push('No configuration or accessory details were recognized. Try the selected configuration summary or an itemized receipt; you can also fill the form manually.');
  if (result.accessories.length) result.warnings.push('Confirm each accessory was ordered or included. Separate purchases may ship separately from your vehicle.');
  return result;
}

export function applyImportedDetails(current: VehicleMeta, fields: Partial<Record<ImportField, string>>, accessories: string[], editing: boolean): VehicleMeta {
  const allowed: Partial<VehicleMeta> = {};
  for (const field of Object.keys(importLabels) as ImportField[]) {
    const value = fields[field]?.trim();
    if (value && !(editing && field === 'vin')) allowed[field] = value;
  }
  const mergedAccessories = mergeAccessoryText(current.accessories, accessories);
  if (mergedAccessories.length > 2000) throw new Error('The combined accessory list is too long. Deselect a few items or shorten the descriptions.');
  return { ...current, ...allowed, accessories: mergedAccessories };
}
