// Budget for the short parked inspection within a 30-minute delivery appointment.
export const sectionMinutes: Record<string, readonly [number, number]> = {
  'quick-confirm': [2, 2], 'quick-exterior': [5, 7], 'quick-cabin': [5, 6], 'quick-handover': [3, 5],
};
export const fullInspectionMinutes = Object.values(sectionMinutes).reduce(
  (total, range) => [total[0] + range[0], total[1] + range[1]], [0, 0],
);
export const minutesLabel = (range: readonly number[]) => range[0] === range[1] ? `${range[0]} min` : `${range[0]}–${range[1]} min`;
