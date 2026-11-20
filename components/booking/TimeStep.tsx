import { useEffect } from "react";
import { Clock } from "lucide-react";
import { AvailabilityDay } from "./DateStep";

interface TimeStepProps {
  selectedDate: string;
  selectedTime: string;
  setSelectedTime: (t: string) => void;
  handleNextStep: () => void;
  availability?: AvailabilityDay[];
}

export default function TimeStep({
  selectedDate,
  selectedTime,
  setSelectedTime,
  handleNextStep,
  availability = [],
}: TimeStepProps) {
  // Convert "10:30 AM" or "19:00" string to minutes from midnight
  const parseTimeToMinutes = (timeStr?: string): number | null => {
    if (!timeStr) return null;
    const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match12) {
      let h = parseInt(match12[1], 10);
      const m = parseInt(match12[2], 10);
      const ampm = match12[3]?.toUpperCase();
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return h * 60 + m;
    }
    const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
    }
    return null;
  };

  // Find operating hours for selected date
  const getDayAvailability = () => {
    if (!selectedDate || !availability || availability.length === 0) return null;
    try {
      const parts = selectedDate.split("-").map(Number);
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayName = dayNames[d.getDay()];
        return availability.find((a) => a.day?.toLowerCase() === dayName.toLowerCase()) || null;
      }
    } catch {
      return null;
    }
    return null;
  };

  const dayAvail = getDayAvailability();
  const openMinutes = dayAvail?.openTime ? parseTimeToMinutes(dayAvail.openTime) : null;
  const closeMinutes = dayAvail?.closeTime ? parseTimeToMinutes(dayAvail.closeTime) : null;
  const isAvailableDay = dayAvail ? dayAvail.isAvailable !== false && dayAvail.openTime !== dayAvail.closeTime : true;

  const isSlotAvailable = (timeSlot: string): boolean => {
    if (!isAvailableDay) return false;
    if (openMinutes === null || closeMinutes === null) return true;
    const slotMinutes = parseTimeToMinutes(timeSlot);
    if (slotMinutes === null) return true;
    return slotMinutes >= openMinutes && slotMinutes < closeMinutes;
  };

  const morningSlots = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"];
  const afternoonSlots = ["12:00 PM", "1:00 PM", "2:00 PM", "2:30 PM", "3:00 PM", "4:00 PM"];
  const eveningSlots = ["5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM"];
  const allSlots = [...morningSlots, ...afternoonSlots, ...eveningSlots];

  // Auto-select first available time slot if currently selected time is outside business hours
  useEffect(() => {
    if (selectedTime && !isSlotAvailable(selectedTime)) {
      const firstValid = allSlots.find((s) => isSlotAvailable(s));
      if (firstValid) {
        setSelectedTime(firstValid);
      }
    } else if (!selectedTime) {
      const firstValid = allSlots.find((s) => isSlotAvailable(s));
      if (firstValid) {
        setSelectedTime(firstValid);
      }
    }
  }, [selectedDate, dayAvail, selectedTime]);

  const isDisabled = !selectedTime || !isSlotAvailable(selectedTime);

  const renderSlotButton = (t: string) => {
    const available = isSlotAvailable(t);
    const isSelected = selectedTime === t;

    return (
      <button
        key={t}
        type="button"
        disabled={!available}
        onClick={() => setSelectedTime(t)}
        title={!available ? "Outside salon operating hours" : undefined}
        className={`py-3.5 px-4 rounded-xl text-xs sm:text-sm transition-all border text-center font-semibold ${
          isSelected
            ? "bg-[#D99722] text-white border-[#D99722] shadow-md ring-1 ring-[#D99722]/50"
            : !available
            ? "bg-muted/15 text-muted-foreground/30 border-transparent cursor-not-allowed opacity-35 line-through decoration-muted-foreground/30"
            : "bg-card hover:bg-accent text-foreground border-border cursor-pointer"
        }`}
      >
        {t}
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

        {dayAvail && dayAvail.openTime && dayAvail.closeTime && (
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-lg bg-accent/60 border border-border text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-[#D99722]" />
            <span>
              Operating hours on this day:{" "}
              <strong className="text-foreground">
                {dayAvail.openTime} – {dayAvail.closeTime}
              </strong>
            </span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* MORNING */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
            MORNING
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {morningSlots.map(renderSlotButton)}
          </div>
        </div>

        {/* AFTERNOON */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
            AFTERNOON
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {afternoonSlots.map(renderSlotButton)}
          </div>
        </div>

        {/* EVENING */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
            EVENING
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {eveningSlots.map(renderSlotButton)}
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={isDisabled}
        onClick={handleNextStep}
        className={`w-full py-4 font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer text-center block mt-8 ${
          isDisabled
            ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            : "bg-[#D99722] hover:bg-[#C2841B] text-white"
        }`}
      >
        {isDisabled ? "Please select an available time slot" : `Continue with ${selectedTime}`}
      </button>
    </div>
  );
}

