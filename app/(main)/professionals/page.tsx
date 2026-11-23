"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { GooglePlacesInput, GooglePlaceResult } from "@/components/ui/google-places-input";
import { fastGeocode, fastReverseGeocode } from "@/lib/geocode";
import { useGetAllProfessionalQuery } from "@/features/profesional/profesionalApi";
import { useGetAllCategoryQuery } from "@/features/category/category";
import {
  X,
  User,
  Building2,
  Star,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import ChairImage from "@/components/shared/ChairImage";

const GOOGLE_PLACES_GEOCODE_TYPES = ["geocode"];

function ProfessionalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const urlServiceCategory = searchParams.get("serviceCategory") || searchParams.get("category") || searchParams.get("categoryId") || "";
  const urlLatitude = searchParams.get("latitude") || "";
  const urlLongitude = searchParams.get("longitude") || "";

  const [locationAddress, setLocationAddress] = useState("");
  const [latitude, setLatitude] = useState<number | string | null>(urlLatitude || null);
  const [longitude, setLongitude] = useState<number | string | null>(urlLongitude || null);

  const { data: categoriesRes } = useGetAllCategoryQuery({});
  const categoriesList = Array.isArray(categoriesRes?.data) ? categoriesRes.data : [];
  const selectedCatObj = categoriesList.find((c: any) => String(c._id || c.id) === String(urlServiceCategory));
  const categoryDisplayName = selectedCatObj?.name || selectedCatObj?.title || urlServiceCategory;

  useEffect(() => {
    if (!urlLatitude && !urlLongitude) {
      setLocationAddress("");
      setLatitude(null);
      setLongitude(null);
      try {
        sessionStorage.removeItem("professionals_search_address");
      } catch {}
    } else {
      setLatitude(urlLatitude);
      setLongitude(urlLongitude);
      try {
        const saved = sessionStorage.getItem("professionals_search_address");
        if (saved) {
          setLocationAddress(saved);
        } else {
          fastReverseGeocode(urlLatitude, urlLongitude).then((addr) => {
            if (addr) setLocationAddress(addr);
          });
        }
      } catch {}
    }
  }, [urlLatitude, urlLongitude]);

  useEffect(() => {
    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      setLatitude(sp.get("latitude") || null);
      setLongitude(sp.get("longitude") || null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Compute active coordinates immediately from state for 0ms query dispatch
  const activeLat = latitude !== null && latitude !== "" ? String(latitude) : urlLatitude;
  const activeLng = longitude !== null && longitude !== "" ? String(longitude) : urlLongitude;

  // Send ONLY latitude and longitude (and serviceCategory if selected) to the backend
  const queryParams: Record<string, string> = {};
  if (activeLat) queryParams.latitude = activeLat;
  if (activeLng) queryParams.longitude = activeLng;
  if (urlServiceCategory) queryParams.serviceCategory = urlServiceCategory;

  // API Query
  const { data: professionalsRes, isLoading, isFetching } = useGetAllProfessionalQuery(queryParams);

  const handlePlaceSelect = (place: GooglePlaceResult) => {
    setLocationAddress(place.address);
    setLatitude(place.lat);
    setLongitude(place.lng);

    try {
      sessionStorage.setItem("professionals_search_address", place.address);
    } catch {}

    const params = new URLSearchParams();
    if (place.lat != null) params.set("latitude", String(place.lat));
    if (place.lng != null) params.set("longitude", String(place.lng));
    if (urlServiceCategory) params.set("serviceCategory", urlServiceCategory);

    const queryStr = params.toString();
    const targetUrl = queryStr ? `/professionals?${queryStr}` : "/professionals";
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", targetUrl);
    }
    router.replace(targetUrl, { scroll: false });
  };

  const handleSearch = async () => {
    let currentLat = latitude;
    let currentLng = longitude;

    // Fast geocode using Google Maps JS SDK (in-memory) instead of slow Nominatim
    if ((!currentLat || !currentLng) && locationAddress.trim()) {
      const geo = await fastGeocode(locationAddress.trim());
      if (geo) {
        currentLat = geo.lat;
        currentLng = geo.lng;
        setLatitude(currentLat);
        setLongitude(currentLng);
      }
    }

    if (locationAddress.trim()) {
      try {
        sessionStorage.setItem("professionals_search_address", locationAddress.trim());
      } catch {}
    }

    const params = new URLSearchParams();
    if (currentLat != null) params.set("latitude", String(currentLat));
    if (currentLng != null) params.set("longitude", String(currentLng));
    if (urlServiceCategory) params.set("serviceCategory", urlServiceCategory);

    const queryStr = params.toString();
    const targetUrl = queryStr ? `/professionals?${queryStr}` : "/professionals";
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", targetUrl);
    }
    router.replace(targetUrl, { scroll: false });
  };

  const handleSelectCategory = (catId: string) => {
    const params = new URLSearchParams();
    if (activeLat) params.set("latitude", activeLat);
    if (activeLng) params.set("longitude", activeLng);
    if (catId) params.set("serviceCategory", catId);

    const queryStr = params.toString();
    router.push(queryStr ? `/professionals?${queryStr}` : "/professionals", { scroll: false });
  };

  const handleScrollNext = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 20) {
        categoryScrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        categoryScrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
      }
    }
  };

  const handleScrollPrev = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setLocationAddress("");
    setLatitude(null);
    setLongitude(null);
    try {
      sessionStorage.removeItem("professionals_search_address");
    } catch {}
    const params = new URLSearchParams();
    if (urlServiceCategory) params.set("serviceCategory", urlServiceCategory);
    const queryStr = params.toString();
    const targetUrl = queryStr ? `/professionals?${queryStr}` : "/professionals";
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", targetUrl);
    }
    router.replace(targetUrl, { scroll: false });
  };

  const clearAllFilters = () => {
    setLocationAddress("");
    setLatitude(null);
    setLongitude(null);
    try {
      sessionStorage.removeItem("professionals_search_address");
    } catch {}
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/professionals");
    }
    router.push("/professionals");
  };

  const rawData = Array.isArray(professionalsRes?.data) ? professionalsRes.data : [];

  const isValidImage = (url: any) =>
    typeof url === "string" &&
    url.trim().length > 0 &&
    !url.includes("example.com");

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground select-none transition-colors duration-200">
      {/* =========================================================================
          FIGMA HERO SECTION (Matching Home & Services Page Arched Frame)
      ========================================================================= */}
      <section className="w-full relative bg-white dark:bg-[#121214] border-b border-border/40 overflow-hidden transition-colors duration-200">
        {/* Subtle Animated Ambient Glow in Background */}
        <div className="absolute top-1/4 left-[-5%] w-96 h-96 bg-[#D99722]/8 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />

        {/* Hero Content Wrapper with Max Width for Large Displays */}
        <div className="w-full max-w-[1920px] mx-auto relative">
          {/* Desktop Golden Arc Frame Pinned to Viewport Right-0 */}
          <div className="hidden lg:flex absolute top-0 lg:h-[380px] 2xl:h-[542px] -mt-1 right-0 w-[calc(52vw)] xl:w-[calc(55vw)] 2xl:w-[55%] max-w-[1056px] rounded-l-full border-l-[25px] border-t-[3.5px] border-b-[3.5px] border-[#D99722] shadow-2xl overflow-hidden bg-[#121110] items-stretch z-0">
            <div className="w-full relative overflow-hidden h-full">
              <motion.div
                animate={{ scale: [1, 1.035, 1] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-full relative"
              >
                <Image
                  src="/images/cards/professionals.jpg"
                  alt="The Cloud Salon Top Professionals & Specialists"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent pointer-events-none" />
              </motion.div>
            </div>
          </div>

          {/* Main Grid Container for Left Content */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center min-h-0 sm:min-h-[440px] lg:min-h-[370px] 2xl:min-h-[535px] py-6 sm:py-8 lg:py-0">
              <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-5 space-y-2.5 lg:space-y-2 2xl:space-y-3.5 text-left relative z-20">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Link
                    href="/"
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Home</span>
                  </Link>
                  <span>/</span>
                  <span className="text-foreground font-semibold">Professionals</span>
                </div>

                {/* Tagline Ribbon */}
                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-[#D99722] uppercase tracking-[0.18em]">
                  <span className="w-6 h-[2px] bg-[#D99722] inline-block" />
                  <span>VERIFIED BEAUTY &amp; GROOMING SPECIALISTS</span>
                </div>

                {/* Headline */}
                <div className="space-y-1">
                  <h1 className="font-extrabold text-2xl sm:text-3xl lg:text-3xl xl:text-4xl 2xl:text-5xl leading-[1.15] tracking-tight text-[#1C1C1E] dark:text-white">
                    Discover top talent. <br />
                    <span className="text-[#D99722]">Book your specialist.</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground font-normal max-w-lg leading-relaxed">
                    Connect with vetted hairstylists, estheticians, barbers, and nail artists with transparent starting rates.
                  </p>
                </div>

                {/* Search Bar (Area / Location Autocomplete) */}
                <div className="pt-1.5 w-full max-w-152">
                  <div className="bg-card border border-border shadow-xl rounded-2xl p-1.5 sm:p-2 flex items-center gap-2 w-full">
                    <div className="flex-1 min-w-0">
                      <GooglePlacesInput
                        placeholder="Search by city, town, or street..."
                        value={locationAddress}
                        types={GOOGLE_PLACES_GEOCODE_TYPES}
                        onPlaceSelectAction={handlePlaceSelect}
                        onTextChange={(val) => {
                          setLocationAddress(val);
                          if (!val.trim()) {
                            setLatitude(null);
                            setLongitude(null);
                            try {
                              sessionStorage.removeItem("professionals_search_address");
                            } catch {}
                            if (urlLatitude || urlLongitude || latitude || longitude) {
                              const params = new URLSearchParams();
                              if (urlServiceCategory) params.set("serviceCategory", urlServiceCategory);
                              const q = params.toString();
                              const targetUrl = q ? `/professionals?${q}` : "/professionals";
                              if (typeof window !== "undefined") {
                                window.history.replaceState(null, "", targetUrl);
                              }
                              router.replace(targetUrl, { scroll: false });
                            }
                          }
                        }}
                        onKeyDown={handleKeyDown}
                        className="!h-10 !rounded-xl !bg-accent/40 !border-border/50 focus:!border-[#D99722] focus:!bg-background text-xs sm:text-sm"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSearch}
                      className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#D99722] hover:bg-[#C2841B] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                    >
                      <span className="sm:hidden">Search</span>
                      <span className="hidden sm:inline">Find Specialists</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Spacer for Right Column on Desktop Grid */}
              <div className="hidden lg:block lg:col-span-7 xl:col-span-7 2xl:col-span-7" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-12 space-y-5 sm:space-y-8">
        {/* Category Carousel Pills Bar */}
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={handleScrollPrev}
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent shrink-0 transition-all cursor-pointer shadow-xs"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={categoryScrollRef}
            className="flex-1 flex items-center gap-2.5 overflow-x-auto scrollbar-none scroll-smooth py-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <button
              type="button"
              onClick={() => handleSelectCategory("")}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all border cursor-pointer ${!urlServiceCategory
                ? "bg-[#D99722] text-white border-[#D99722] shadow-md shadow-[#D99722]/20 scale-102"
                : "bg-card hover:bg-accent text-foreground border-border/80"
                }`}
            >
              All Categories
            </button>

            {categoriesList.map((cat: any) => {
              const catId = String(cat._id || cat.id);
              const catName = cat.name || cat.title || "Category";
              const isActive = String(urlServiceCategory) === catId;

              return (
                <button
                  key={catId}
                  type="button"
                  onClick={() => handleSelectCategory(catId)}
                  className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all border cursor-pointer ${isActive
                    ? "bg-[#D99722] text-white border-[#D99722] shadow-md shadow-[#D99722]/20 scale-102"
                    : "bg-card hover:bg-accent text-foreground border-border/80"
                    }`}
                >
                  {catName}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleScrollNext}
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent shrink-0 transition-all cursor-pointer shadow-xs"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">Verified Beauty &amp; Grooming Specialists</h3>
              {isFetching && (
                <span className="text-[11px] text-[#D99722] font-semibold animate-pulse">Updating...</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{rawData.length} active professionals ready for booking</p>
            {(urlServiceCategory || (activeLat && activeLng)) && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {urlServiceCategory && (
                  <span className="bg-[#D99722]/10 text-[#D99722] border border-[#D99722]/20 text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                    Category: {categoryDisplayName}
                    <button
                      type="button"
                      onClick={() => handleSelectCategory("")}
                      className="hover:text-foreground ml-1 cursor-pointer"
                      title="Clear category filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {activeLat && activeLng && (
                  <span className="bg-[#D99722]/10 text-[#D99722] border border-[#D99722]/20 text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                    Location: {locationAddress || `${activeLat}, ${activeLng}`}
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="hover:text-foreground ml-1 cursor-pointer"
                      title="Clear location filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1 ml-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-card rounded-2xl h-96 border border-border animate-pulse" />
            ))}
          </div>
        ) : rawData.length === 0 ? (
          <div className="bg-card rounded-3xl p-8 sm:p-16 text-center border border-border space-y-4 max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#D99722]/15 text-[#D99722] flex items-center justify-center mx-auto">
              <User className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-foreground">No Specialists Found</h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              We couldn&apos;t find any beauty professionals matching your criteria. Try adjusting your location or clearing filters.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-6 py-2.5 bg-[#D99722] hover:bg-[#C2841B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <span>Clear All Filters</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {rawData.map((item: any, idx: number) => {
              const pro = item.professional || {};
              const roleRef = pro.roleRef || {};
              const salon = item.salon || {};

              const proId = pro._id || item._id;
              const cardKey = item._id || `${proId}-${idx}`;
              const fullName =
                `${pro.firstName || ""} ${pro.lastName || ""}`.trim() ||
                "Beauty Specialist";

              const salonMainImg =
                [salon.photos?.[0], salon.photos?.[1], salon.logo].find(isValidImage) ||
                "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80";

              const proAvatarImg =
                [pro.image, roleRef.photos?.[0]].find(isValidImage) ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";

              const locationText =
                salon.address?.city || pro.address?.city
                  ? `${salon.address?.city || pro.address?.city}${salon.address?.state || pro.address?.state
                    ? ", " + (salon.address?.state || pro.address?.state)
                    : ""
                  }`
                  : "New York, USA";

              const badgeText = pro.isSalonOwner
                ? "Salon Owner & Pro"
                : roleRef.isVerified
                  ? "Verified Specialist"
                  : "Professional";

              const startingPrice = roleRef.startingPriceInUSD || 35;
              const rating = roleRef.avgRating || salon.avgRating || 5.0;
              const reviewsCount = roleRef.totalReviews || salon.totalReviews || 0;

              const startDateStr = formatDate(item.startDate);
              const endDateStr = formatDate(item.endDate);
              const dateRangeText = startDateStr && endDateStr ? `${startDateStr} – ${endDateStr}` : null;

              return (
                <div
                  key={cardKey}
                  className="bg-card rounded-2xl overflow-hidden border border-border/80 shadow-xs hover:shadow-2xl hover:border-[#D99722]/40 transition-all duration-300 group flex flex-col justify-between text-card-foreground hover:-translate-y-1.5"
                >
                  {/* Salon Cover Header */}
                  <div className="relative h-48 overflow-hidden bg-muted">
                    <Link href={`/professionals/${proId || ''}`} className="block w-full h-full">
                      <ChairImage
                        src={salonMainImg}
                        alt={salon.name || "Salon Workspace"}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30" />
                    </Link>

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                      <span className="bg-black/70 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <ShieldCheck className="w-3 h-3 text-[#D99722]" />
                        <span>{badgeText}</span>
                      </span>

                      <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                        <Star className="w-3 h-3 fill-[#D99722] text-[#D99722]" />
                        <span>{rating}</span>
                        {reviewsCount > 0 && <span className="text-zinc-400 font-normal">({reviewsCount})</span>}
                      </div>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Pro Avatar + Info */}
                      <div className="flex items-start gap-3">
                        <Link href={`/professionals/${proId}`} className="shrink-0 block mt-0.5">
                          <div className="w-12 h-12 rounded-2xl border-2 border-[#D99722] overflow-hidden bg-muted shadow-sm transition-transform group-hover:scale-105">
                            <ChairImage
                              src={proAvatarImg}
                              alt={fullName}
                              className="w-full h-full object-cover"
                              size="sm"
                              fallbackIcon={<User className="w-4 h-4 text-[#D99722]" />}
                            />
                          </div>
                        </Link>

                        <div className="flex-1 min-w-0 space-y-1">
                          <Link
                            href={`/professionals/${proId}`}
                            className="text-base font-bold text-foreground hover:text-[#D99722] transition-colors block truncate"
                          >
                            {fullName}
                          </Link>

                          {salon.name && (
                            <Link
                              href={`/salons/${salon._id || ''}`}
                              className="inline-flex items-center gap-1.5 text-xs text-[#D99722] hover:underline font-semibold max-w-full"
                            >
                              <Building2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{salon.name}</span>
                            </Link>
                          )}

                          {/* Location */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{locationText}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing Tag */}
                      <div className="flex items-center justify-between text-xs pt-1 px-3 py-2 rounded-xl bg-accent/40 border border-border/50">
                        <span className="text-muted-foreground font-medium">Starting Rate</span>
                        <span className="text-sm font-extrabold text-[#D99722]">
                          ${startingPrice}
                        </span>
                      </div>

                      {/* Full Width Available Date */}
                      {/* {dateRangeText && (
                        <div className="w-full flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl font-medium">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Available: {dateRangeText}</span>
                        </div>
                      )} */}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2.5">
                      <Link
                        href={`/professionals/${proId}`}
                        className="flex-1 text-center py-2.5 bg-accent hover:bg-accent/80 text-foreground text-xs font-bold rounded-xl border border-border transition-colors block"
                      >
                        View Profile
                      </Link>

                      <Link
                        href={`/book/1?proId=${proId}`}
                        className="flex-1 text-center py-2.5 bg-[#D99722] hover:bg-[#C2841B] text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 block"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function ProfessionalsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Loading verified professionals...</div>}>
      <ProfessionalsContent />
    </Suspense>
  );
}
