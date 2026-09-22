// Planning estimates for active inspection, not measured delivery durations.
export const sectionMinutes: Record<string, readonly [number, number]> = {
  arrival: [3, 4], exterior: [6, 8], wheels: [3, 4], lights: [3, 5],
  openings: [7, 10], cabin: [5, 8], controls: [6, 9], drive: [8, 12],
  access: [7, 10], app: [5, 8], 'after-wake': [3, 5], handover: [4, 7],
};
export const fullInspectionMinutes = Object.values(sectionMinutes).reduce(
  (total, range) => [total[0] + range[0], total[1] + range[1]], [0, 0],
);
export const minutesLabel = (range: readonly number[]) => `${range[0]}–${range[1]} min`;
