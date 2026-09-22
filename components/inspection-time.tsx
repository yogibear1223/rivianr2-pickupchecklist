import { Clock3 } from 'lucide-react';
import { fullInspectionMinutes, minutesLabel } from '@/lib/inspection-time';
import type { InspectionPhase } from '@/lib/inspection-plan';

export function InspectionTime({ phase = 'pickup' }: { phase?: InspectionPhase }) {
  return <aside className="time-estimate" aria-label="Estimated inspection time">
    <Clock3 size={21} aria-hidden="true" />
    <div><p><strong>{phase === 'pickup' ? 'Pickup check · ' + minutesLabel(fullInspectionMinutes) : 'After delivery · first week'}</strong><span>{phase === 'pickup' ? '20 parked checks' : '10 follow-up checks'}</span></p>
      <p className="time-context">{phase === 'pickup' ? 'Designed for your 30-minute appointment alongside the handover. Driving checks come after you take delivery.' : 'Driving checks start after acceptance. Report concerns promptly and follow your delivery team’s confirmed reporting deadline.'}</p>
      {phase === 'pickup' && <details><summary>Keep pickup simple</summary>
        <p>Prepare your vehicle details before arrival. Take one walkaround, check the cabin, then record concerns with your specialist. The 15–20 minute target covers inspection; an issue may need extra discussion. Use “Not tested” for a check you cannot complete.</p>
      </details>}
    </div>
  </aside>;
}
