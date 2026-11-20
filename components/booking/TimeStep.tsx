import { useEffect, useMemo } from "react";
import { Clock, Loader2, CalendarX2 } from "lucide-react";
import { AvailabilityDay } from "./DateStep";
import { useGetProfessionalAvailabilityQuery } from "@/features/profesional/profesionalApi";

export interface ApiSlot {
  startsAt: string;
  endsAt: string;
}

export interface DisplaySlot extends ApiSlot {
  label: string;
  hour: number;
  isAvailable: boolean;
}

interface TimeStepProps {
  userId?: string;
  selectedDate: string;
  selectedTime: string;
  setSelectedTime: (t: string) => void;
  handleNextStep: () => void;
  availability?: AvailabilityDay[];
  startDate?: string | null;
  endDate?: string | null;
  onSlotSelect?: (slot: ApiSlot) => void;
}

export default function TimeStep({
  userId,
  selectedDate,
  selectedTime,
  setSelectedTime,
  handleNextStep,
  availability = [],
  startDate,
  endDate,
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
        timeZone: "UTC",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoStr;
    }
  };

  // Generate the full daily slot timeline (both available and booked slots)
  const mappedSlots: DisplaySlot[] = useMemo(() => {
    if (!selectedDate) return [];

    // 1. Determine day of week in UTC
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = dayNames[dateObj.getUTCDay()];

    // 2. Determine openTime and closeTime from weekly availability schedule
    const daySchedule = availability.find(
      (item) => item.day.toLowerCase() === dayName.toLowerCase()
    );

    let openTime = daySchedule?.openTime || "09:00";
    let closeTime = daySchedule?.closeTime || "19:00";

    // 3. Contract / Chair rental limits if applicable
    if (startDate && typeof startDate === "string" && startDate.startsWith(selectedDate)) {
      const rentalStart = startDate.substring(11, 16);
      if (rentalStart && rentalStart > openTime) openTime = rentalStart;
    }
    if (endDate && typeof endDate === "string" && endDate.startsWith(selectedDate)) {
      const rentalEnd = endDate.substring(11, 16);
      if (rentalEnd && rentalEnd < closeTime) closeTime = rentalEnd;
    }

    // 4. Bound against actual returned API slots to never cut off live slots
    if (rawApiSlots.length > 0) {
      const earliestApi = rawApiSlots[0]?.startsAt?.substring(11, 16);
      const latestApi = rawApiSlots[rawApiSlots.length - 1]?.endsAt?.substring(11, 16);
      if (earliestApi && earliestApi < openTime) openTime = earliestApi;
      if (latestApi && latestApi > closeTime) closeTime = latestApi;
    }

    const getMinutes = (t: string) => {
      const [h, min] = t.split(":").map(Number);
      return (h || 0) * 60 + (min || 0);
    };

    let startMinutes = getMinutes(openTime);
    let endMinutes = getMinutes(closeTime);

    if (startMinutes >= endMinutes) {
      startMinutes = 9 * 60; // 09:00
      endMinutes = 18 * 60;  // 18:00
    }

    const availableStartsSet = new Set(rawApiSlots.map((s) => s.startsAt));
    const allSlots: DisplaySlot[] = [];
    const generatedStarts = new Set<string>();

    for (let currentMin = startMinutes; currentMin < endMinutes; currentMin += 30) {
      const h = Math.floor(currentMin / 60);
      const min = currentMin % 60;
      const hStr = String(h).padStart(2, "0");
      const minStr = String(min).padStart(2, "0");

      const nextMin = currentMin + 30;
      const nextH = Math.floor(nextMin / 60);
      const nextM = nextMin % 60;
      const nextHStr = String(nextH).padStart(2, "0");
      const nextMStr = String(nextM).padStart(2, "0");

      const startsAt = `${selectedDate}T${hStr}:${minStr}:00.000Z`;
      const endsAt = `${selectedDate}T${nextHStr}:${nextMStr}:00.000Z`;

      generatedStarts.add(startsAt);
      const isAvailable = availableStartsSet.has(startsAt);

      allSlots.push({
        startsAt,
        endsAt,
        label: formatSlotTime(startsAt),
        hour: h,
        isAvailable,
      });
    }

    // Include any API slots that might fall outside the initial calculated window
    rawApiSlots.forEach((slot) => {
      if (!generatedStarts.has(slot.startsAt)) {
        const match = slot.startsAt.match(/T(\d{2})/);
        const hour = match ? parseInt(match[1], 10) : 10;
        allSlots.push({
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          label: formatSlotTime(slot.startsAt),
          hour,
          isAvailable: true,
        });
      }
    });

    // Sort chronologically
    allSlots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

    return allSlots;
  }, [selectedDate, availability, startDate, endDate, rawApiSlots]);

  // Categorize slots
  const morningSlots = mappedSlots.filter((s) => s.hour < 12);
  const afternoonSlots = mappedSlots.filter((s) => s.hour >= 12 && s.hour < 17);
  const eveningSlots = mappedSlots.filter((s) => s.hour >= 17);

  const availableSlots = useMemo(() => mappedSlots.filter((s) => s.isAvailable), [mappedSlots]);

  // Auto-sync or auto-select available slot when slots load or date changes
  useEffect(() => {
    if (availableSlots.length > 0) {
      const matched = availableSlots.find((s) => s.label === selectedTime);
      if (matched) {
        if (onSlotSelect) {
          onSlotSelect({ startsAt: matched.startsAt, endsAt: matched.endsAt });
        }
      } else {
        const firstAvailable = availableSlots[0];
        setSelectedTime(firstAvailable.label);
        if (onSlotSelect) {
          onSlotSelect({ startsAt: firstAvailable.startsAt, endsAt: firstAvailable.endsAt });
        }
      }
    }
  }, [availableSlots, selectedTime, setSelectedTime, onSlotSelect]);

  const handleSelectSlot = (slot: DisplaySlot) => {
    if (!slot.isAvailable) return;
    setSelectedTime(slot.label);
    if (onSlotSelect) {
      onSlotSelect({ startsAt: slot.startsAt, endsAt: slot.endsAt });
    }
  };

  const isSelectedSlotAvailable = availableSlots.some((s) => s.label === selectedTime);
  const isDisabled = isSlotsLoading || availableSlots.length === 0 || !selectedTime || !isSelectedSlotAvailable;

  const renderSlotButton = (slot: DisplaySlot) => {
    const isSelected = selectedTime === slot.label && slot.isAvailable;

    if (!slot.isAvailable) {
      return (
        <button
          key={slot.startsAt}
          type="button"
          disabled
          aria-disabled="true"
          title={`${slot.label} is already booked`}
          className="py-3 px-3 rounded-xl text-xs sm:text-sm border text-center font-medium opacity-40 bg-muted/20 border-dashed border-muted-foreground/40 text-muted-foreground cursor-not-allowed flex flex-col items-center justify-center min-h-[52px] relative select-none transition-none"
        >
          <span className="tracking-tight">{slot.label}</span>
        </button>
      );
    }

    return (
      <button
        key={slot.startsAt}
        type="button"
        onClick={() => handleSelectSlot(slot)}
        className={`py-3.5 px-4 rounded-xl text-xs sm:text-sm transition-all border text-center font-semibold cursor-pointer flex flex-col items-center justify-center min-h-[52px] ${isSelected
          ? "bg-[#D99722] text-white border-[#D99722] shadow-md ring-2 ring-[#D99722]/50 scale-[1.02]"
          : "bg-card hover:bg-accent text-foreground border-border hover:border-[#D99722]/40"
          }`}
      >
        <span>{slot.label}</span>
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
          Available and reserved schedule for <span className="font-bold text-foreground">{selectedDate || "selected date"}</span>
        </p>

        {isSlotsFetching && (
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-lg bg-[#D99722]/10 border border-[#D99722]/20 text-xs text-[#D99722]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Updating availability...</span>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 pb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D99722]" />
            <span className="text-foreground font-medium">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-border bg-card" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
            <span className="text-muted-foreground">Reserved</span>
          </div>
        </div>
      </div>

      {isSlotsLoading ? (
        <div className="space-y-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-12 bg-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : mappedSlots.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-border rounded-2xl bg-card/50">
          <CalendarX2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">No slots scheduled</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            This professional has no working hours scheduled on {selectedDate}. Please pick another date.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* MORNING */}
          {morningSlots.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#D99722]" />
                  <span>MORNING ({morningSlots.filter((s) => s.isAvailable).length} available)</span>
                </span>
                <span className="text-[10px] font-normal lowercase text-muted-foreground">
                  {morningSlots.length} total
                </span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {morningSlots.map(renderSlotButton)}
              </div>
            </div>
          )}

          {/* AFTERNOON */}
          {afternoonSlots.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#D99722]" />
                  <span>AFTERNOON ({afternoonSlots.filter((s) => s.isAvailable).length} available)</span>
                </span>
                <span className="text-[10px] font-normal lowercase text-muted-foreground">
                  {afternoonSlots.length} total
                </span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {afternoonSlots.map(renderSlotButton)}
              </div>
            </div>
          )}

          {/* EVENING */}
          {eveningSlots.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#D99722]" />
                  <span>EVENING ({eveningSlots.filter((s) => s.isAvailable).length} available)</span>
                </span>
                <span className="text-[10px] font-normal lowercase text-muted-foreground">
                  {eveningSlots.length} total
                </span>
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
        className={`w-full py-4 font-bold text-sm rounded-xl shadow-md transition-all text-center block mt-8 ${isDisabled
          ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
          : "bg-[#D99722] hover:bg-[#C2841B] text-white cursor-pointer"
          }`}
      >
        {isDisabled ? "Please select an available time slot" : `Continue with ${selectedTime}`}
      </button>
    </div>
  );
}
