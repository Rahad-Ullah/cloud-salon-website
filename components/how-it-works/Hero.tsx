"use client";

import { User, Scissors, Building2 } from "lucide-react";

export type RoleType = "customers" | "professionals" | "businesses";

interface HeroProps {
  activeRole: RoleType;
  setActiveRole: (role: RoleType) => void;
}

export default function Hero({ activeRole, setActiveRole }: HeroProps) {
  return (
    <section className="bg-[#181715] text-white py-10 sm:py-24 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <span className="text-[10px] sm:text-xs font-bold text-[#D99722] uppercase tracking-[0.25em] block">
          HOW IT WORKS
        </span>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.15] tracking-tight">
          <span className="block text-white">
            Simple for everyone.
          </span>
          <span className="block text-[#D99722] mt-1">
            Powerful where it counts.
          </span>
        </h1>

        {/* Role Filter Tabs (Full width stacked on mobile, segmented pill on desktop) */}
        <div className="pt-2 sm:pt-4 flex justify-center w-full">
          <div className="bg-[#242220] p-1.5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-1 w-full sm:w-auto shadow-inner">
            <button
              type="button"
              onClick={() => setActiveRole("customers")}
              className={`w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeRole === "customers"
                  ? "bg-[#D99722] text-white shadow-md font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>For Customers</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRole("professionals")}
              className={`w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeRole === "professionals"
                  ? "bg-[#D99722] text-white shadow-md font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Scissors className="w-4 h-4 shrink-0" />
              <span>For Professionals</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRole("businesses")}
              className={`w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeRole === "businesses"
                  ? "bg-[#D99722] text-white shadow-md font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>For Businesses</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
