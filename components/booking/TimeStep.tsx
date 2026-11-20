import { useEffect, useMemo } from "react";
import { Clock, Loader2, CalendarX2 } from "lucide-react";
import { AvailabilityDay } from "./DateStep";
import { useGetProfessionalAvailabilityQuery } from "@/features/profesional/profesionalApi";

export interface ApiSlot {
  startsAt: string;
  endsAt: string;
}

interface TimeStepProps {
  userId?: string;
  selectedDate: string;
  selectedTime: string;
  setSelectedTime: (t: string) => void;
  handleNextStep: () => void;
  availability?: AvailabilityDay[];
  onSlotSelect?: (slot: ApiSlot) => void;
}

export default function TimeStep({
  userId,
  selectedDate,
  selectedTime,
  setSelectedTime,
  handleNextStep,
  availability = [],
  onSlotSelect,
}: TimeStepProps) {
  // Fetch real-time available slots for that professional on the selected date
  const {
    data: availabilityRes,
    isLoading: isSlotsLoading,
    isFetching: isSlotsFetching,
  } = useGetProfessionalAvailabilityQuery(
    { userId: userId || "", date: selectedDate },
    { skip: !userId || !selectedDate }
  );

  const rawApiSlots: ApiSlot[] = Array.isArray(availabilityRes?.data?.slots)
    ? availabilityRes.data.slots
    : [];

  // Helper to convert ISO slot to formatted 12h time string (e.g. "10:30 AM")
  const formatSlotTime = (isoStr: string) => {
    try {
      const match = isoStr.match(/T(\d{2}):(\d{2})/);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = match[2];
        const ampm = h >= 12 ? "PM" : "AM";
        if (h > 12) h -= 12;
        if (h === 0) h = 12;
        return `${h}:${m} ${ampm}`;
      }
      return new Date(isoStr).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoStr;
    }
  };

  // Map API slots to slot items with hour metadata for section categorization
  const mappedSlots = useMemo(() => {
    return rawApiSlots.map((slot) => {
      const timeLabel = formatSlotTime(slot.startsAt);
      const match = slot.startsAt.match(/T(\d{2})/);
      const hour = match ? parseInt(match[1], 10) : 10;
      return {
        ...slot,
        label: timeLabel,
        hour,
      };
    });
  }, [rawApiSlots]);

  // Categorize slots
  const morningSlots = mappedSlots.filter((s) => s.hour < 12);
  const afternoonSlots = mappedSlots.filter((s) => s.hour >= 12 && s.hour < 17);
  const eveningSlots = mappedSlots.filter((s) => s.hour >= 17);

  // Auto-select first available slot when slots load or date changes
  useEffect(() => {
    if (mappedSlots.length > 0) {
      const isCurrentSelectedValid = mappedSlots.some((s) => s.label === selectedTime);
      if (!selectedTime || !isCurrentSelectedValid) {
        const firstSlot = mappedSlots[0];
        setSelectedTime(firstSlot.label);
        if (onSlotSelect) {
          onSlotSelect({ startsAt: firstSlot.startsAt, endsAt: firstSlot.endsAt });
        }
      }
    }
  }, [mappedSlots, selectedTime, setSelectedTime, onSlotSelect]);

  const handleSelectSlot = (slot: { startsAt: string; endsAt: string; label: string }) => {
    setSelectedTime(slot.label);
    if (onSlotSelect) {
      onSlotSelect({ startsAt: slot.startsAt, endsAt: slot.endsAt });
    }
  };

  const isSelectedSlotAvailable = mappedSlots.some((s) => s.label === selectedTime);
  const isDisabled = isSlotsLoading || mappedSlots.length === 0 || !selectedTime || !isSelectedSlotAvailable;

  const renderSlotButton = (slot: { startsAt: string; endsAt: string; label: string }) => {
    const isSelected = selectedTime === slot.label;

    return (
      <button
        key={slot.startsAt}
        type="button"
        onClick={() => handleSelectSlot(slot)}
        className={`py-3.5 px-4 rounded-xl text-xs sm:text-sm transition-all border text-center font-semibold cursor-pointer ${
          isSelected
            ? "bg-[#D99722] text-white border-[#D99722] shadow-md ring-2 ring-[#D99722]/50 scale-[1.02]"
            : "bg-card hover:bg-accent text-foreground border-border hover:border-[#D99722]/40"
        }`}
      >
        {slot.label}
      </button>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-1">
          Choose a time slot
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-normal">
          Available start times for <span className="font-bold text-foreground">{selectedDate || "selected date"}</span>
        </p>

        {isSlotsFetching && (
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-lg bg-[#D99722]/10 border border-[#D99722]/20 text-xs text-[#D99722]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Fetching live availability for {selectedDate}...</span>
          </div>
        )}
      </div>

      {isSlotsLoading ? (
        <div className="space-y-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-12 bg-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground animate-pulse">
            Loading available appointment slots...
          </p>
        </div>
      ) : mappedSlots.length === 0 ? (
        <div className="p-10 text-center bg-card rounded-2xl border border-border space-y-3">
          <CalendarX2 className="w-10 h-10 text-muted-foreground/60 mx-auto" />
          <h4 className="text-sm font-bold text-foreground">No Available Slots on This Date</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            This professional has no open booking slots on <strong className="text-foreground">{selectedDate}</strong>.
            Please go back to the previous step and pick another date.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* MORNING */}
          {morningSlots.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#D99722]" />
                <span>MORNING ({morningSlots.length})</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {morningSlots.map(renderSlotButton)}
              </div>
            </div>
          )}

          {/* AFTERNOON */}
          {afternoonSlots.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#D99722]" />
                <span>AFTERNOON ({afternoonSlots.length})</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {afternoonSlots.map(renderSlotButton)}
              </div>
            </div>
          )}

          {/* EVENING */}
          {eveningSlots.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#D99722]" />
                <span>EVENING ({eveningSlots.length})</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {eveningSlots.map(renderSlotButton)}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={isDisabled}
        onClick={handleNextStep}
        className={`w-full py-4 font-bold text-sm rounded-xl shadow-md transition-all text-center block mt-8 ${
          isDisabled
            ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            : "bg-[#D99722] hover:bg-[#C2841B] text-white cursor-pointer"
        }`}
      >
        {isDisabled ? "Please select an available time slot" : `Continue with ${selectedTime}`}
      </button>
    </div>
  );
}

