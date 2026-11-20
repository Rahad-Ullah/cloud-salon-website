import {
  Calendar,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  Globe,
  Instagram,
  Mail,
  Phone,
  Award,
  Sparkles,
  DollarSign,
  Star,
  ShieldCheck,
  MessageSquare,
  Clock,
} from "lucide-react";

interface AboutTabProps {
  proData?: any;
}

function formatTimeWithAMPM(timeStr?: string): string {
  if (!timeStr) return "";
  const trimmed = timeStr.trim();
  if (!trimmed) return "";
  if (trimmed.toLowerCase().includes("am") || trimmed.toLowerCase().includes("pm")) {
    return trimmed;
  }
  const parts = trimmed.split(":");
  if (parts.length < 2) return trimmed;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];

  if (isNaN(hours)) return trimmed;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  return `${formattedHours}:${minutes} ${ampm}`;
}

export default function AboutTab({ proData }: AboutTabProps) {
  const quote = proData?.quote?.trim() || "";
  const bio = proData?.bio?.trim() || "";
  const experienceYears = Number(proData?.experienceYears) || 0;
  const startingPrice = Number(proData?.startingPrice) || 0;
  const reviewsCount = Number(proData?.reviewsCount) || 0;
  const ratingNum = Number(proData?.rating) || 0;

  const specialtiesList: string[] = Array.isArray(proData?.specialties)
    ? proData.specialties.filter((s: any) => typeof s === "string" && s.trim().length > 0)
    : [];

  const rawAvailability = Array.isArray(proData?.availability) ? proData.availability : [];

  const fullAddress = proData?.address
    ? [
        proData.address.line1,
        proData.address.line2,
        proData.address.city,
        proData.address.state,
        proData.address.postalCode,
        proData.address.country,
      ]
        .filter((part: any) => typeof part === "string" && part.trim().length > 0)
        .join(", ")
    : proData?.location || "";

  const contactPhone = typeof proData?.phone === "object"
    ? `${proData.phone.countryCode || ""} ${proData.phone.number || ""}`.trim()
    : typeof proData?.phone === "string"
    ? proData.phone.trim()
    : "";

  return (
    <div className="animate-in fade-in duration-150 space-y-8">
      {/* 1. Specialist Quote */}
      {quote && (
        <blockquote className="text-base sm:text-lg text-foreground font-medium border-l-4 border-[#D99722] pl-6 py-3 leading-relaxed bg-[#D99722]/10 rounded-r-2xl italic">
          &ldquo;{quote}&rdquo;
        </blockquote>
      )}

      {/* 2. Professional Bio */}
      {bio && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D99722]" />
            <span>About Specialist</span>
          </h4>
          <p className="text-xs sm:text-sm text-foreground/90 font-normal leading-relaxed whitespace-pre-line bg-card p-5 sm:p-6 rounded-2xl border border-border">
            {bio}
          </p>
        </div>
      )}

      {/* 3. Four Modern Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Experience */}
        <div className="relative overflow-hidden bg-card/80 hover:bg-card border border-border/80 hover:border-[#D99722]/40 rounded-2xl p-5 transition-all shadow-xs group">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-accent/80 border border-border/50 px-2.5 py-1 rounded-full">
              Experience
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {experienceYears > 0 ? `${experienceYears}+ Years` : "Experienced"}
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-normal">
            Professional industry practice
          </p>
        </div>

        {/* Card 2: Starting Price */}
        <div className="relative overflow-hidden bg-card/80 hover:bg-card border border-border/80 hover:border-[#D99722]/40 rounded-2xl p-5 transition-all shadow-xs group">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-accent/80 border border-border/50 px-2.5 py-1 rounded-full">
              Starting From
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            ${startingPrice}{" "}
            <span className="text-xs font-normal text-muted-foreground">USD</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-normal">
            Transparent service base rate
          </p>
        </div>

        {/* Card 3: Rating */}
        <div className="relative overflow-hidden bg-card/80 hover:bg-card border border-border/80 hover:border-[#D99722]/40 rounded-2xl p-5 transition-all shadow-xs group">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#D99722]/10 border border-[#D99722]/20 flex items-center justify-center text-[#D99722] group-hover:scale-105 transition-transform">
              <Star className="w-5 h-5 fill-[#D99722]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-accent/80 border border-border/50 px-2.5 py-1 rounded-full">
              Rating
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-baseline gap-1.5 flex-wrap">
            <span>{ratingNum > 0 ? `${ratingNum.toFixed(1)}` : "0.0"}</span>
            <span className="text-amber-500 text-lg">★</span>
            <span className="text-xs font-semibold text-muted-foreground">
              ({reviewsCount} {reviewsCount === 1 ? "review" : "reviews"})
            </span>
            {ratingNum === 0 && (
              <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                New
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-normal">
            {reviewsCount > 0
              ? `Based on ${reviewsCount} verified client reviews`
              : "0 reviews · Fresh verified specialist"}
          </p>
        </div>

        {/* Card 4: Trust & Verification */}
        <div className="relative overflow-hidden bg-card/80 hover:bg-card border border-border/80 hover:border-[#D99722]/40 rounded-2xl p-5 transition-all shadow-xs group">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-accent/80 border border-border/50 px-2.5 py-1 rounded-full">
              Trust & Safety
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-1.5">
            <span>Verified</span>
            <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-normal">
            Identity & professional credential
          </p>
        </div>
      </div>

      {/* 4. Specialities & Skills (Real API Data) */}
      {specialtiesList.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] block">
            SPECIALITIES & SERVICES OFFERED
          </h4>
          <div className="flex flex-wrap gap-2 sm:gap-2.5">
            {specialtiesList.map((tag, idx) => (
              <span
                key={idx}
                className="bg-card hover:bg-accent text-foreground text-xs font-semibold px-4 py-2 rounded-xl border border-border transition-colors shadow-2xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 5. Affiliated Salon / Workspace Details */}
      {proData?.salonName && (
        <div className="p-6 sm:p-7 rounded-2xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <span className="text-[10px] font-bold text-[#D99722] uppercase tracking-wider block mb-0.5">
                {proData.isSalonOwner ? "Salon Owner & Base Location" : "Studio Location"}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#D99722] shrink-0" />
                <span>{proData.salonName}</span>
              </h3>
            </div>
            {proData.businessType && (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-accent text-foreground border border-border/70 self-start sm:self-auto">
                {proData.businessType}
              </span>
            )}
          </div>

          {proData.salonDescription && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {proData.salonDescription}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            {fullAddress && (
              <div className="flex items-start gap-2.5 text-muted-foreground">
                <MapPin className="w-4 h-4 text-[#D99722] shrink-0 mt-0.5" />
                <span className="text-foreground font-medium">{fullAddress}</span>
              </div>
            )}

            {contactPhone && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Phone className="w-4 h-4 text-[#D99722] shrink-0" />
                <a href={`tel:${contactPhone}`} className="hover:text-foreground transition-colors font-medium">
                  {contactPhone}
                </a>
              </div>
            )}

            {proData.email && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Mail className="w-4 h-4 text-[#D99722] shrink-0" />
                <a href={`mailto:${proData.email}`} className="hover:text-foreground transition-colors font-medium">
                  {proData.email}
                </a>
              </div>
            )}

            {proData.website && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Globe className="w-4 h-4 text-[#D99722] shrink-0" />
                <a
                  href={proData.website.startsWith("http") ? proData.website : `https://${proData.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D99722] transition-colors truncate font-medium underline"
                >
                  {proData.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}

            {proData.instagram && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Instagram className="w-4 h-4 text-[#D99722] shrink-0" />
                <span className="font-medium text-foreground">{proData.instagram}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Weekly Working Hours Schedule */}
      {rawAvailability.length > 0 && (
        <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#D99722]" />
                <span>Weekly Availability Schedule</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Official operating hours and open days
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {rawAvailability.map((item: any, idx: number) => (
              <div
                key={idx}
                className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between transition-all ${
                  item.isAvailable
                    ? "bg-accent/30 border-border hover:border-[#D99722]/30"
                    : "bg-muted/20 border-border/40 opacity-55"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.isAvailable ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-foreground">{item.day}</span>
                </div>

                <span className="text-xs font-semibold text-muted-foreground">
                  {item.isAvailable
                    ? `${formatTimeWithAMPM(item.openTime || "09:00")} – ${formatTimeWithAMPM(item.closeTime || "19:00")}`
                    : "Closed"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
