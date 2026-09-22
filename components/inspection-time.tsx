import { Clock3 } from 'lucide-react';
import { fullInspectionMinutes, minutesLabel } from '@/lib/inspection-time';

export function InspectionTime() {
  return <aside className="time-estimate" aria-label="Estimated inspection time">
    <Clock3 size={21} aria-hidden="true" />
    <div><p><strong>Plan {minutesLabel(fullInspectionMinutes)}</strong><span>Full checklist</span></p>
      <details><summary>What this estimate includes</summary>
        <p>A steady walkaround, a brief charging test, a short drive, and the active after-wake recheck. Allow extra time for staff waits, the vehicle’s sleep cycle, and documenting issues. This is a planning estimate, not a timer.</p>
        <p>Set up your details before pickup. Use “Not tested” when a check cannot be completed; you can return to it later.</p>
      </details>
    </div>
  </aside>;
}
