// Budget for the short parked inspection within a 30-minute delivery appointment.
export const sectionMinutes: Record<string, readonly [number, number]> = {
  'route-front': [2, 3], 'route-passenger': [2, 2], 'route-rear': [2, 3], 'route-driver': [2, 3], 'route-cabin': [2, 3], 'route-seat': [3, 4], 'route-handover': [2, 2],
};
export const fullInspectionMinutes = Object.values(sectionMinutes).reduce(
  (total, range) => [total[0] + range[0], total[1] + range[1]], [0, 0],
);
export const minutesLabel = (range: readonly number[]) => range[0] === range[1] ? `${range[0]} min` : `${range[0]}–${range[1]} min`;
