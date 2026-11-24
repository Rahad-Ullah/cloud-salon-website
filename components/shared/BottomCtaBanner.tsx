"use client";

import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";

interface BottomCtaBannerProps {
  icon: LucideIcon;
  badgeText?: string;
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
}

export default function BottomCtaBanner({
  icon: Icon,
  badgeText,
  title,
  description,
  buttonText,
  buttonHref,
}: BottomCtaBannerProps) {
  return (
    <div className="mt-12 sm:mt-20">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#121214] text-white p-5 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        {/* Ambient Lighting */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#D99722]/15 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4 sm:gap-5 text-left w-full sm:w-auto">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#D99722]/20 text-[#D99722] flex items-center justify-center shrink-0 border border-[#D99722]/40 shadow-inner">
            <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="space-y-1">
            {badgeText && (
              <span className="text-[10px] sm:text-xs font-bold text-[#D99722] uppercase tracking-[0.2em] block">
                {badgeText}
              </span>
            )}
            <h3 className="text-base sm:text-2xl font-extrabold text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl">
              {description}
            </p>
          </div>
        </div>

        <Link
          href={buttonHref}
          className="relative z-10 w-full sm:w-auto justify-center px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-[#D99722] hover:bg-[#C2841B] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#D99722]/25 transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
        >
          <span>{buttonText}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
