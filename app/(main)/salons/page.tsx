"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, Search, MapPin, Star, X, ChevronLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import ChairImage from "@/components/shared/ChairImage";
import Link from "next/link";
import { GooglePlacesInput, GooglePlaceResult } from "@/components/ui/google-places-input";
import { fastGeocode, fastReverseGeocode } from "@/lib/geocode";
import { useGetAllSalonsQuery } from "@/features/salon/salonApi";
import BottomCtaBanner from "@/components/shared/BottomCtaBanner";

const GOOGLE_PLACES_GEOCODE_TYPES = ["geocode"];

function SalonsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlLatitude = searchParams.get("latitude") || "";
  const urlLongitude = searchParams.get("longitude") || "";

  const [locationAddress, setLocationAddress] = useState("");
  const [latitude, setLatitude] = useState<number | string | null>(urlLatitude || null);
  const [longitude, setLongitude] = useState<number | string | null>(urlLongitude || null);

  useEffect(() => {
    if (!urlLatitude && !urlLongitude) {
      setLocationAddress("");
      setLatitude(null);
      setLongitude(null);
      try {
        sessionStorage.removeItem("salons_search_address");
      } catch {}
    } else {
      setLatitude(urlLatitude);
      setLongitude(urlLongitude);
      try {
        const saved = sessionStorage.getItem("salons_search_address");
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

  // Compute active coordinates immediately from local state for 0ms query dispatch
  const activeLat = latitude !== null && latitude !== "" ? String(latitude) : urlLatitude;
  const activeLng = longitude !== null && longitude !== "" ? String(longitude) : urlLongitude;

  const queryParams: Record<string, string> = {};
  if (activeLat) queryParams.latitude = activeLat;
  if (activeLng) queryParams.longitude = activeLng;

  // API Queries
  const { data: salonsRes, isLoading: isSalonsLoading, isFetching } = useGetAllSalonsQuery(queryParams);

  const handlePlaceSelect = (place: GooglePlaceResult) => {
    setLocationAddress(place.address);
    setLatitude(place.lat);
    setLongitude(place.lng);

    try {
      sessionStorage.setItem("salons_search_address", place.address);
    } catch {}

    const params = new URLSearchParams();
    if (place.lat != null) params.set("latitude", String(place.lat));
    if (place.lng != null) params.set("longitude", String(place.lng));

    const queryStr = params.toString();
    const targetUrl = queryStr ? `/salons?${queryStr}` : "/salons";
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", targetUrl);
    }
    router.replace(targetUrl, { scroll: false });
  };

  const handleSearch = async () => {
    let currentLat = latitude;
    let currentLng = longitude;

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
        sessionStorage.setItem("salons_search_address", locationAddress.trim());
      } catch {}
    }

    const params = new URLSearchParams();
    if (currentLat != null) params.set("latitude", String(currentLat));
    if (currentLng != null) params.set("longitude", String(currentLng));

    const queryStr = params.toString();
    const targetUrl = queryStr ? `/salons?${queryStr}` : "/salons";
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", targetUrl);
    }
    router.replace(targetUrl, { scroll: false });
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
      sessionStorage.removeItem("salons_search_address");
    } catch {}
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/salons");
    }
    router.replace("/salons", { scroll: false });
  };

  const isValidImage = (url: any) =>
    typeof url === "string" &&
    url.trim().length > 0 &&
    !url.includes("example.com");

  // Map Salons Data
  const rawApiSalons = Array.isArray(salonsRes?.data) ? salonsRes.data : [];
  const mappedSalons = rawApiSalons.map((item: any) => {
    const coverImg =
      [item.photos?.[0], item.photos?.[1], item.logo].find(isValidImage) || "";

    const logoImg =
      [item.logo, item.createdBy?.image].find(isValidImage) || "";

    const ownerName = item.createdBy
      ? `${item.createdBy.firstName || ""} ${item.createdBy.lastName || ""}`.trim()
      : null;

    const locationStr = item.address
      ? `${item.address.city || ""}${item.address.state ? ", " + item.address.state : ""}`.trim() || item.address.line1 || "Dhaka, Bangladesh"
      : "Dhaka, Bangladesh";

    return {
      id: item._id,
      name: item.name || "Beauty Salon",
      salonType: item.businessType || "Hair & Beauty Salon",
      category: item.businessType || "Beauty & Spa",
      rating: item.avgRating || 5.0,
      reviews: item.totalReviews || 0,
      location: locationStr,
      badge: item.status === "active" ? "Open Today" : "Verified",
      coverImg,
      logoImg,
      ownerName,
      description: item.description || "Full-service salon providing premium beauty, grooming, and styling services.",
      tags: [item.businessType || "Beauty", item.address?.city || "Salon"],
    };
  });

  const filteredSalons = mappedSalons;

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
                src="/images/cards/businesses.jpg"
                alt="The Cloud Salon Luxury Salons & Studios"
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
                <span className="text-foreground font-semibold">Salons</span>
              </div>

              {/* Tagline Ribbon */}
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-[#D99722] uppercase tracking-[0.18em]">
                <span className="w-6 h-[2px] bg-[#D99722] inline-block" />
                <span>VERIFIED SALONS &amp; BOUTIQUES</span>
              </div>

              {/* Headline */}
              <div className="space-y-1">
                <h1 className="font-extrabold text-2xl sm:text-3xl lg:text-3xl xl:text-4xl 2xl:text-5xl leading-[1.15] tracking-tight text-[#1C1C1E] dark:text-white">
                  Discover top salons. <br />
                  <span className="text-[#D99722]">Elevate your experience.</span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-normal max-w-lg leading-relaxed">
                  Explore luxury salons, hair studios, and grooming spaces near you with instant booking.
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
                            sessionStorage.removeItem("salons_search_address");
                          } catch {}
                          if (urlLatitude || urlLongitude || latitude || longitude) {
                            if (typeof window !== "undefined") {
                              window.history.replaceState(null, "", "/salons");
                            }
                            router.replace("/salons", { scroll: false });
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
                    <span className="hidden sm:inline">Find Salons</span>
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
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-12 space-y-4 sm:space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#D99722] text-white shadow-sm flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>Salons ({mappedSalons.length})</span>
              </div>
              {isFetching && (
                <span className="text-[11px] text-[#D99722] font-semibold animate-pulse">Updating...</span>
              )}
            </div>

            {activeLat && activeLng && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#D99722]/10 text-[#D99722] border border-[#D99722]/20 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
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
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-[11px] font-bold text-red-500 hover:underline flex items-center gap-0.5 ml-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SALONS LIST VIEW */}
        <div className="space-y-4">
          {isSalonsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-card rounded-2xl h-80 border border-border animate-pulse" />
              ))}
            </div>
          ) : filteredSalons.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 sm:p-12 text-center border border-border space-y-3">
              <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
              <h4 className="text-base font-bold text-foreground">No Salons Found</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No active salons were found matching your query. Try clearing your search parameters.
              </p>
              {urlLatitude && urlLongitude && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="px-5 py-2 rounded-xl bg-[#D99722] hover:bg-[#C2841B] text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredSalons?.reverse()?.map((salon: any) => (
                <div
                  key={salon.id}
                  className="bg-card rounded-2xl overflow-hidden border border-border/70 shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col justify-between text-card-foreground hover:-translate-y-1"
                >
                  {/* Salon Cover Header */}
                  <div className="relative h-44 sm:h-48 overflow-hidden bg-muted">
                    <Link href={`/salons/${salon.id}`} className="block w-full h-full relative">
                      <ChairImage
                        src={salon.coverImg}
                        alt={salon.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        size="lg"
                        iconType="scissors"
                        label="Salon"
                        showLabel
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30 pointer-events-none" />
                    </Link>

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                      <span className="bg-black/60 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-[#D99722]" />
                        <span>{salon.salonType}</span>
                      </span>

                      <span className="bg-[#D99722] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                        {salon.badge}
                      </span>
                    </div>

                  </div>

                  {/* Card Content Body */}
                  <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Salon Logo + Info Column (Name -> Location -> Rating) */}
                      <div className="flex items-start gap-3">
                        <Link href={`/salons/${salon.id}`} className="shrink-0 block mt-0.5">
                          <div className="w-12 h-12 rounded-xl border-2 border-[#D99722]/60 overflow-hidden bg-muted shadow-sm">
                            <ChairImage
                              src={salon.logoImg}
                              alt={salon.name}
                              className="w-full h-full object-cover"
                              size="sm"
                              iconType="scissors"
                            />
                          </div>
                        </Link>

                        <div className="flex-1 min-w-0 space-y-1">
                          {/* 1. Name */}
                          <Link
                            href={`/salons/${salon.id}`}
                            className="text-sm sm:text-base font-bold text-foreground hover:text-[#D99722] transition-colors block truncate"
                          >
                            {salon.name}
                          </Link>
                          {/* 2. Location */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-[#D99722] shrink-0" />
                            <span className="truncate">{salon.location}</span>
                          </div>

                          {/* 3. Rating (after location) */}
                          <div className="flex items-center gap-1 text-xs pt-0.5">
                            <Star className="w-3.5 h-3.5 fill-[#D99722] text-[#D99722] shrink-0" />
                            <span className="font-bold text-foreground">{salon.rating}</span>
                            <span className="text-muted-foreground text-[11px]">({salon.reviews})</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-border/50">
                      <Link
                        href={`/salons/${salon.id}`}
                        className="w-full text-center py-2.5 bg-[#D99722] hover:bg-[#C2841B] text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 block"
                      >
                        Explore Salon & Book
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <BottomCtaBanner
          icon={Building2}
          badgeText="FOR SALON BUSINESSES"
          title="Do you own or manage a beauty salon?"
          description="Discover how easy it is to list your salon storefront, rent out vacant styling chairs, organize staff schedules, and attract new local clients."
          buttonText="See How It Works"
          buttonHref="/how-it-works?role=businesses"
        />
      </section>
    </div>
  );
}

export default function SalonsPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading Salons...</div>}>
      <SalonsContent />
    </Suspense>
  );
}
