import type { Section } from './model';

// Follow the vehicle once: front → passenger side → rear → driver side,
// then inspect the cabin before settling into the driver's seat.
export const routeSections: Section[] = [
  { id: 'route-front', title: 'Start at the front', subtitle: 'Have your order open. Check the front and frunk before moving down the passenger side.', items: [
    { id: 'quick-vin', title: 'VIN matches your order', detail: 'Compare the vehicle VIN with your order and paperwork.' },
    { id: 'route-front-body', title: 'Hood, front trim & frunk', detail: 'Look for paint blemishes, scratches and gouges in the bumper or plastic trim. Compare both rear hood corners near the windshield for flared edges or unequal gaps. Open the frunk once; check its seals and latch, then close it.' },
    { id: 'route-windshield-outside', title: 'Windshield, headlights & front camera', detail: 'Look across the windshield for scratches, chips and cracks. Check the headlight lenses and front camera for visible damage. You’ll check the view through the glass when seated later.' },
  ] },
  { id: 'route-passenger', title: 'Down the passenger side', subtitle: 'Front to back. Finish each area before taking the next step.', items: [
    { id: 'route-passenger-front', title: 'Passenger front corner & door', detail: 'Scan the front wheel and tire, fender, mirror, window and door. Look for paint damage, uneven panel gaps and scratched plastic trim. Check the visible lower edge from standing height.' },
    { id: 'route-passenger-rear', title: 'Passenger rear door & wheel', detail: 'Continue along the rear door, window and quarter panel. Check paint, trim and gaps, then the rear wheel, tire and visible lower edge. Leave cabin and door-seal checks for the inside pass.' },
  ] },
  { id: 'route-rear', title: 'At the rear', subtitle: 'Open the liftgate once. Check the cargo area and equipment, then close it before continuing.', items: [
    { id: 'route-rear-body', title: 'Liftgate, rear glass & cargo opening', detail: 'Check rear paint, plastic trim, glass, lights and camera for damage. Open the liftgate: inspect both side seals for pinching or folds and scan the cargo trim. After checking the equipment below, close the liftgate and confirm its fit and latch.' },
    { id: 'quick-equipment', title: 'Supplied equipment is here', detail: 'Check the charger, adapters and air pump, if included. Collect a plate bracket if needed. Check each ordered accessory below separately.' },
  ] },
  { id: 'route-driver', title: 'Up the driver’s side', subtitle: 'Rear to front. This completes the exterior lap.', items: [
    { id: 'route-driver-rear', title: 'Driver-side rear wheel & door', detail: 'Check the rear wheel and tire, quarter panel, rear door and window. Look for damaged paint or plastic, uneven gaps and anything hanging below the visible lower edge.' },
    { id: 'quick-charge-door', title: 'Charge-port door works', detail: 'Open and close it once; check the fit and visible condition.' },
    { id: 'route-driver-front', title: 'Driver’s door surround & front corner', detail: 'Look closely at the plastic around the driver’s door for deep scratches or gouges. Scan the door, window, mirror, fender, front wheel and tire. Compare panel gaps and check the visible lower edge.' },
  ] },
  { id: 'route-cabin', title: 'Make one cabin pass', subtitle: 'Check the rear seating area, then the front passenger area. Finish at the driver’s door.', items: [
    { id: 'route-rear-cabin', title: 'Rear seats, headliner & door seals', detail: 'From the open rear doors, scan the seats, rear headliner and trim for cuts, stains or loose edges. Check the door seals and close each rear door once to confirm the latch. Look across the whole rear bench before moving on.' },
    { id: 'route-passenger-cabin', title: 'Front passenger seat & storage', detail: 'Check the passenger seat, front headliner, door trim and seal. Open and close the passenger glovebox. Note loose trim or an emergency-release cover, then close the door and move to the driver’s seat.' },
  ] },
  { id: 'route-seat', title: 'Now sit in the driver’s seat', subtitle: 'Stay here for controls, readings and the handover. No driving until acceptance is complete.', items: [
    { id: 'route-driver-cabin', title: 'Driver area & view through the windshield', detail: 'Check the driver’s seat surface, door trim and seal before sitting. Close the door, test the driver glovebox and look through the windshield for scratches or other visible defects from your driving position.' },
    { id: 'quick-driver-position', title: 'Driver position is ready', detail: 'Adjust the driver’s seat and mirrors, save the position, and buckle the driver’s belt.' },
    { id: 'quick-climate-display', title: 'A/C runs; warnings are explained', detail: 'Turn on cooling. Look for an obvious display fault or warning and have the specialist explain it.' },
    { id: 'quick-order-mileage', title: 'Configuration and mileage match', detail: 'Confirm paint, interior and wheels. Photograph the mileage and compare it with the paperwork.' },
  ] },
  { id: 'route-handover', title: 'Finish the handover', subtitle: 'Review the record with your specialist while you’re still parked.', items: [
    { id: 'quick-keys', title: 'Keys received and paired', detail: 'Receive the supplied physical keys and confirm your phone key and vehicle account are set up.' },
    { id: 'quick-ready-to-leave', title: 'Controls understood; enough charge', detail: 'Have the specialist explain Park/Drive, basic braking and charging. Check battery charge for the trip. Stay parked until acceptance is complete.' },
    { id: 'quick-issue-handover', title: 'Concerns documented with next steps', detail: 'Photograph concerns and have the specialist record them. Save agreed repairs, timing and any case number in Notes & status. Record any loaner or revised pickup arrangements in Handoff notes.' },
    { id: 'quick-reporting-deadline', title: 'Reporting deadline confirmed', detail: 'Confirm the cosmetic-reporting window in writing. Use Notes & status to record the exact deadline, instructions and specialist’s name.' },
  ] },
];
