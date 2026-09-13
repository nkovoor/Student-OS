'use client';

import { WEEKDAYS } from '@/lib/engine';
import { useStudentOSData } from '@/lib/state/StudentOSProvider';
import { AvailRow } from '@/components/availability/AvailRow';
import { SlotForm } from '@/components/availability/SlotForm';

// Availability tab (spec §11): per-weekday study window + free-to-study
// readout, permanent recurring slot chips nested under each weekday, and the
// closing "Book a permanent slot" add-form.
export default function AvailabilityPage() {
  const { availability, bookedSlots } = useStudentOSData();

  return (
    <>
      <p className="muted-note">
        Book permanent weekly slots — sports, music, coaching — and set how much study time you realistically have
        each day. The scheduler will never plan over these.
      </p>

      <div className="avail-rows">
        {WEEKDAYS.map((day) => (
          <AvailRow key={day} weekday={day} availability={availability} bookedSlots={bookedSlots} />
        ))}
      </div>

      <h2 className="section-title">Book a permanent slot</h2>
      <SlotForm />
    </>
  );
}
