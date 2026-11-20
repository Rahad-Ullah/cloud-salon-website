"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarDays, Info, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export interface AvailabilityDay {
  day: string;
  openTime?: string;
  closeTime?: string;
  isAvailable?: boolean;
}

interface DateStepProps {
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  handleNextStep: () => void;
  startDate?: string;
  endDate?: string;
  professionalName?: string;
  availability?: AvailabilityDay[];
}

export default function DateStep({
  selectedDate,
  setSelectedDate,
  handleNextStep,
  startDate,
  endDate,
  professionalName = "Specialist",
  availability = [],
}: DateStepProps) {
  const today = new Date();
  const formatLocalYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const todayStr = formatLocalYYYYMMDD(today);

  // Format helper for YYYY-MM-DD
  const formatYYYYMMDD = (dStr?: string) => {
    if (!dStr) return "";
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr.slice(0, 10);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${d.getFullYear()}-${m}-${day}`;
    } catch (e) {
      return "";
    }
  };

  // Format helper for human readable date e.g. "Oct 7, 2026"
  const formatHumanDate = (dStr?: string) => {
    if (!dStr) return "";
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return "";
    }
  };

  const minAvailableStr = formatYYYYMMDD(startDate);
  const maxAvailableStr = formatYYYYMMDD(endDate);

  const startHumanStr = formatHumanDate(startDate);
  const endHumanStr = formatHumanDate(endDate);

  const availableRangeText =
    startHumanStr && endHumanStr
      ? `${startHumanStr} – ${endHumanStr}`
      : startHumanStr
      ? `From ${startHumanStr}`
      : endHumanStr
      ? `Until ${endHumanStr}`
      : null;

  // Day of week helper (e.g. 0 -> "Sunday", 1 -> "Monday")
  const getDayNameFromDate = (d: Date) => {
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
  };

  // Check if a given date string is an off-day based on salon/professional availability
  const isOffDayFromDateStr = (dateStr: string): boolean => {
    if (!availability || availability.length === 0) return false;
    try {
      const parts = dateStr.split("-").map(Number);
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const dayName = getDayNameFromDate(d);
        const match = availability.find(
          (item) => item.day?.toLowerCase() === dayName.toLowerCase()
        );
        if (match) {
          if (match.isAvailable === false) return true;
          if (match.openTime === "00:00" && match.closeTime === "00:00") return true;
        }
      }
    } catch {
      return false;
    }
    return false;
  };

  // Check if a date string is open and bookable
  const isDateBookable = (dateStr: string): boolean => {
    if (!dateStr || dateStr < todayStr) return false;
    if (minAvailableStr && dateStr < minAvailableStr) return false;
    if (maxAvailableStr && dateStr > maxAvailableStr) return false;
    if (isOffDayFromDateStr(dateStr)) return false;
    return true;
  };

  // Find the first available open day starting from a given date
  const findFirstOpenDate = (fromStr: string): string => {
    try {
      const parts = fromStr.split("-").map(Number);
      let curr = new Date(parts[0], parts[1] - 1, parts[2]);
      for (let i = 0; i < 60; i++) {
        const candidateStr = formatLocalYYYYMMDD(curr);
        if (isDateBookable(candidateStr)) {
          return candidateStr;
        }
        curr.setDate(curr.getDate() + 1);
      }
    } catch {
      return fromStr;
    }
    return fromStr;
  };

  // Auto-initialize selectedDate to the first valid open day (skipping off-days & past dates)
  useEffect(() => {
    const baseStart = minAvailableStr && minAvailableStr > todayStr ? minAvailableStr : todayStr;
    if (!selectedDate || !isDateBookable(selectedDate)) {
      const firstOpen = findFirstOpenDate(baseStart);
      setSelectedDate(firstOpen);
    }
  }, [minAvailableStr, maxAvailableStr, availability, selectedDate]);

  // Calendar View Month/Year state
  const initialRefDateStr = selectedDate || (minAvailableStr && minAvailableStr >= todayStr ? minAvailableStr : todayStr);
  const initialDateObj = new Date(initialRefDateStr + "T00:00:00");
  const [viewDate, setViewDate] = useState<Date>(
    isNaN(initialDateObj.getTime()) ? today : initialDateObj
  );

  useEffect(() => {
    if (selectedDate) {
      const d = new Date(selectedDate + "T00:00:00");
      if (!isNaN(d.getTime())) {
        setViewDate(d);
      }
    }
  }, [selectedDate]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    const prev = new Date(currentYear, currentMonth - 1, 1);
    if (
      prev.getFullYear() < today.getFullYear() ||
      (prev.getFullYear() === today.getFullYear() && prev.getMonth() < today.getMonth())
    ) {
      return;
    }
    setViewDate(prev);
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysArray.push(d);
  }

  const formatFullDate = (dayNum: number) => {
    const m = String(currentMonth + 1).padStart(2, "0");
    const d = String(dayNum).padStart(2, "0");
    return `${currentYear}-${m}-${d}`;
  };

  const isPastDay = (dayNum: number) => {
    const dateStr = formatFullDate(dayNum);
    return dateStr < todayStr;
  };

  const isOutsideAvailableRange = (dayNum: number) => {
    const dateStr = formatFullDate(dayNum);
    if (minAvailableStr && dateStr < minAvailableStr) return true;
    if (maxAvailableStr && dateStr > maxAvailableStr) return true;
    return false;
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      if (isOffDayFromDateStr(val)) {
        toast.error("The selected date is an off-day (closed). Please choose an open operating day.");
        return;
      }
      setSelectedDate(val);
      const newD = new Date(val + "T00:00:00");
      if (!isNaN(newD.getTime())) {
        setViewDate(newD);
      }
    }
  };

  const isDisabled = !selectedDate;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-1">
            Choose a date
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-normal">
            Select an available date for your appointment or pick a date manually.
          </p>
        </div>

        {/* Manual Date Picker Trigger */}
        <div className="relative shrink-0">
          <label
            htmlFor="manual-date-picker"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D99722]/50 bg-accent/60 hover:bg-accent text-xs font-semibold text-foreground transition-all cursor-pointer shadow-xs"
          >
            <CalendarDays className="w-4 h-4 text-[#D99722]" />
            <span>Manual Date Picker</span>
          </label>
          <input
            id="manual-date-picker"
            type="date"
            min={minAvailableStr && minAvailableStr > todayStr ? minAvailableStr : todayStr}
            max={maxAvailableStr || undefined}
            value={selectedDate || ""}
            onChange={handleCustomDateChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
      </div>

      {/* Prominent Availability Period Banner */}
      {availableRangeText && (
        <div className="bg-[#D99722]/15 border-2 border-[#D99722]/40 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#D99722] text-white shrink-0 shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D99722]">
                  {professionalName}&apos;s Active Availability
                </span>
              </div>
              <p className="text-sm sm:text-base font-extrabold text-foreground mt-0.5">
                {availableRangeText}
              </p>
            </div>
          </div>
          <div className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl shrink-0 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Select a date in this window</span>
          </div>
        </div>
      )}

      {/* Calendar View */}
      <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border space-y-6 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-foreground pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#D99722]" />
            <span className="text-base sm:text-lg font-bold text-foreground">
              {monthNames[currentMonth]} {currentYear}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={currentYear === today.getFullYear() && currentMonth === today.getMonth()}
              className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Full Month Calendar Grid */}
        <div className="space-y-3">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
            {dayNames.map((d) => (
              <span key={d} className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">
                {d}
              </span>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {daysArray.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-10 sm:h-12" />;
              }

              const dateStr = formatFullDate(day);
              const isSelected = selectedDate === dateStr;
              const past = isPastDay(day);
              const outsideRange = isOutsideAvailableRange(day);
              const offDay = isOffDayFromDateStr(dateStr);
              const isDayDisabled = past || outsideRange || offDay;

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isDayDisabled}
                  onClick={() => setSelectedDate(dateStr)}
                  title={
                    offDay
                      ? "Closed / Off-Day"
                      : past
                      ? "Past date"
                      : outsideRange
                      ? "Outside available window"
                      : "Available"
                  }
                  className={`h-10 sm:h-12 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col items-center justify-center cursor-pointer border relative ${
                    isSelected
                      ? "bg-[#D99722] text-white border-[#D99722] shadow-md ring-2 ring-[#D99722]/40"
                      : offDay
                      ? "bg-rose-500/5 text-rose-500/40 border-rose-500/20 cursor-not-allowed opacity-40 line-through decoration-rose-500/30"
                      : past || outsideRange
                      ? "bg-muted/20 text-muted-foreground/30 border-transparent cursor-not-allowed opacity-30"
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-foreground"
                  }`}
                >
                  <span>{day}</span>
                  {offDay && !past && (
                    <span className="text-[8px] font-semibold text-rose-500/70 uppercase tracking-tighter leading-none">
                      Closed
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Weekly Operating Hours & Schedule Summary */}
        {availability && availability.length > 0 && (
          <div className="pt-4 border-t border-border/50 space-y-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#D99722]" />
              <span className="text-xs font-bold text-foreground">
                Operating Schedule
              </span>
              <span className="text-[11px] text-muted-foreground">
                (Closed/off-days are disabled)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {availability.map((av) => {
                const isOpen = av.isAvailable !== false && av.openTime !== av.closeTime && av.openTime !== "00:00";
                return (
                  <div
                    key={av.day}
                    className={`p-2 rounded-xl border text-center text-xs flex flex-col justify-center transition-colors ${
                      isOpen
                        ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 opacity-70"
                    }`}
                  >
                    <span className="font-extrabold uppercase text-[10px] tracking-wide block">
                      {av.day.slice(0, 3)}
                    </span>
                    <span className="text-[10px] font-semibold mt-0.5">
                      {isOpen ? `${av.openTime} - ${av.closeTime}` : "Closed"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedDate && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>✓ Selected Appointment Date:</span>
            <span className="font-bold text-foreground">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <span className="text-[11px] font-mono bg-emerald-500/20 px-2.5 py-0.5 rounded text-emerald-700 dark:text-emerald-300 font-bold">
            {selectedDate}
          </span>
        </div>
      )}

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
        {isDisabled ? "Please select a date to continue" : "Continue to Time Selection"}
      </button>
    </div>
  );
}
