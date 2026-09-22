import assert from 'node:assert/strict';
import { parseConfigurationText, applyImportedDetails, mergeAccessoryText, MAX_IMPORT_TEXT } from '../lib/configuration-import';
import { blankMeta } from '../lib/model';
import { fullInspectionMinutes, sectionMinutes } from '../lib/inspection-time';
import { deliverySections } from '../lib/inspection-plan';

const field = (text: string, name: string) => parseConfigurationText(text).fields.find(result => result.field === name);
const summary = `Your configuration
R2 Performance
Launch Package
Exterior: Launch Green
Interior: Black Crater Signature
Wheels: 21” Liquid Tungsten All-Season
VIN: 7PD2EAAB0VN000001
Delivery date: September 24, 2026 at 10:30 am
Delivery location: Example Service Center
Accessories
R2 All-Weather Floor Mats $180.00
R2 Compact Spare Tire $550.00
Recommended: R2 Cargo Crossbars $550.00`;
const found = parseConfigurationText(summary);
assert.equal(found.fields.find(result => result.field === 'paint')?.candidates[0].value, 'Launch Green');
assert.equal(found.fields.find(result => result.field === 'interior')?.candidates[0].value, 'Black Crater Signature');
assert.equal(found.fields.find(result => result.field === 'wheels')?.candidates[0].value, '21-inch Liquid Tungsten All-Season');
assert.equal(found.fields.find(result => result.field === 'deliveryDate')?.candidates[0].value, '2026-09-24');
assert.equal(found.fields.find(result => result.field === 'deliveryTime')?.candidates[0].value, '10:30');
assert.equal(found.fields.find(result => result.field === 'location')?.candidates[0].value, 'Example Service Center');
assert.equal(found.accessories.length, 2);
assert.ok(found.accessories.every(item => item.certain));
assert.ok(!found.accessories.some(item => /Crossbars/.test(item.value)));

// Labels and values on separate PDF lines; do not mistake the shorter interior name.
const wrapped = `Order summary\nR2 Premium\nExterior\nHalf Moon Gray\nInterior\nBlack Crater Signature\nWheels\n20-inch Bicolor Carbon\nDelivery date\n09/24/2026`;
assert.equal(field(wrapped, 'paint')?.candidates[0].value, 'Half Moon Grey');
assert.equal(field(wrapped, 'interior')?.candidates.length, 1);
assert.equal(field('Interior\nBlack Crater\nSignature', 'interior')?.candidates[0].value, 'Black Crater Signature');
assert.equal(field(wrapped, 'deliveryDate')?.candidates[0].value, '2026-09-24');
assert.equal(field('R2 Performance\nLaunch Package', 'paint'), undefined);
assert.equal(field('Launch Package', 'package')?.candidates[0].value, 'Launch Package');
assert.equal(field('No Launch Package / without the Launch Package', 'package')?.candidates[0].value, 'No package');

// A full options page is ambiguous. A catalog can never assert a purchase.
const options = parseConfigurationText('Exterior paint\nLaunch Green\nGlacier White\nMidnight\nAdd to cart\nR2 Cargo Crossbars');
assert.equal(options.fields.find(result => result.field === 'paint')?.candidates.length, 3);
assert.ok(options.fields.every(result => !result.certain));
assert.ok(options.accessories.every(result => !result.certain));
assert.equal(field('Selected exterior: Glacier White\nOther options\nLaunch Green\nMidnight', 'paint')?.candidates[0].value, 'Glacier White');
assert.equal(parseConfigurationText('Selected: Launch Green').accessories.length, 0);
assert.equal(field('Launch Package includes the option of Launch Green exterior paint', 'paint'), undefined);
const inline = parseConfigurationText('R2 Performance | Exterior: Launch Green | Interior: Black Crater Signature | Accessories: R2 All-Weather Floor Mats');
assert.equal(inline.fields.length, 3); assert.equal(inline.accessories.length, 1);
const afterAccessory = parseConfigurationText('Accessories\nR2 All-Weather Floor Mats\nVIN\n7PD2EAAB0VN000001\nDelivery date\n09/24/2026');
assert.equal(afterAccessory.accessories.length, 1);
assert.equal(afterAccessory.fields.find(result => result.field === 'vin')?.candidates[0].value, '7PD2EAAB0VN000001');
assert.equal(afterAccessory.fields.find(result => result.field === 'deliveryDate')?.candidates[0].value, '2026-09-24');

// Gear names that contain colors and wheels never overwrite vehicle configuration.
const gear = parseConfigurationText(`Rivian Gear Shop\nOrder summary\nR2 Midnight Tent T-Shirt $40.00\nR2 21” Liquid Tungsten All-Season Wheel and Tire Set $3800.00\nCustom Adventure Storage Box $70.00\nShipping address\nSample Person\n123 Sample Street\nExample City, OK 73000`);
assert.equal(gear.kind, 'accessories'); assert.equal(gear.fields.length, 0);
assert.equal(gear.accessories.length, 3);
assert.ok(gear.accessories.some(item => /Custom Adventure/.test(item.value) && !item.certain));
assert.ok(!gear.accessories.some(item => /Sample|Street|Example City/.test(item.value)));

assert.equal(field('Order date: 09/01/2026\nShipping date: 09/18/2026', 'deliveryDate'), undefined);
assert.equal(field('Complete your payment before delivery by September 23, 2026 at 3 pm', 'deliveryDate'), undefined);
assert.equal(field('Delivery payment due September 23, 2026 at 3 pm', 'deliveryTime'), undefined);
assert.equal(field('Estimated delivery window: September 24, 2026', 'deliveryDate'), undefined);
assert.equal(field('Delivery date: 02/31/2026', 'deliveryDate'), undefined);
assert.equal(field('Delivery date: 09/24/2026 at 12:15 PM', 'deliveryTime')?.candidates[0].value, '12:15');
assert.equal(field('VIN: 7PD2EAAB0VN000001\nVIN: 7PD2EAAB0VN000002', 'vin')?.candidates.length, 2);
assert.equal(field('VIN: 7PD2EAABOVN000001', 'vin'), undefined);
assert.deepEqual(parseConfigurationText('Included: Tow Package - $0.00').accessories.map(item => item.value), ['Tow Package']);
assert.equal(parseConfigurationText('Accessories: R2 Cargo Cover, R2 Floor Mats').accessories.length, 2);
assert.equal(parseConfigurationText('Accessories\nR2 Cargo Cover - not selected\nR2 Front Sunshade - refunded').accessories.length, 0);

const current = { ...blankMeta(), vin: '7PD2EAAB0VN000001', paint: 'Glacier White', accessories: 'R2 All-Weather Floor Mats\nCargo Cover', location: 'Saved location' };
const applied = applyImportedDetails(current, { vin: '7PD2EAAB0VN000002', interior: 'Coastal Cloud Signature' }, ['R2 All Weather Floor Mats', 'R2 Cargo Crossbars'], true);
assert.equal(applied.vin, current.vin); assert.equal(applied.paint, current.paint); assert.equal(applied.location, current.location);
assert.equal(applied.interior, 'Coastal Cloud Signature'); assert.equal(applied.accessories, current.accessories + '\nR2 Cargo Crossbars');
assert.equal(mergeAccessoryText(applied.accessories, ['R2 Cargo Crossbars']), applied.accessories);
assert.equal(mergeAccessoryText('R2 Cargo Cover (qty 1)', ['Cargo Cover']), 'R2 Cargo Cover (qty 1)');
assert.equal(current.interior, '');
assert.throws(() => parseConfigurationText('x'.repeat(MAX_IMPORT_TEXT + 1)), /too long/);
assert.throws(() => applyImportedDetails(current, {}, ['x'.repeat(2100)], false), /too long/);
assert.deepEqual(fullInspectionMinutes, [15, 20]);
assert.deepEqual(Object.keys(sectionMinutes), deliverySections.map(section => section.id));
console.log('Import checks passed: selected summaries, PDF line breaks, ambiguous options, gear receipts, date/VIN handling, safe merge and timing.');
