"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ChairImage from "@/components/shared/ChairImage";
import {
  MapPin,
  Star,
  Building2,
  Calendar,
  Loader2,
  AlertCircle,
  Heart,
  X,
  CheckCircle2,
  Armchair,
  Clock,
  ShieldCheck,
  Eye,
  CreditCard,
  ExternalLink,
  Mail,
  Phone,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { useGetMyProfileQuery } from "@/features/profile/profileApi";
import { useGetAllChairsQuery } from "@/features/chair/chairApi";
import {
  useGetMyRentalsQuery,
  useGetSingleChairRentalQuery,
  useCreateChairRentalMutation,
  useUpdateChairRentalMutation,
} from "@/features/chairRental/chairRentalApi";
import BusinessWorkspacePage from "@/app/(business)/business/workspace/page";
import { CardGridSkeleton } from "@/components/ui/skeleton";
import { formatAppointmentStatus, getAppointmentStatusBadgeStyle } from "@/utils/appointment";

interface SalonInfo {
  _id?: string;
  name?: string;
  businessType?: string;
  logo?: string;
  photos?: string[];
  avgRating?: number;
  totalReviews?: number;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  email?: string;
  phone?: string | { countryCode?: string; number?: string };
}

interface ChairRentalItem {
  _id: string;
  name: string;
  description?: string;
  photo?: string;
  pricePerDayInUSD: number;
  location?: string;
  status?: string;
  salon?: SalonInfo | string;
  uid?: string;
}

interface BookingRecord {
  _id: string;
  chair?: ChairRentalItem | string;
  salon?: SalonInfo | string;
  startDate?: string;
  endDate?: string;
  durationInDays?: number;
  totalPrice?: number;
  pricePerDayInUSD?: number;
  paymentStatus?: string;
  transaction?: any;
  pricing?: {
    subtotal?: number;
    discount?: number;
    platformFee?: number;
    serviceFee?: number;
    total?: number;
    currency?: string;
  };
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  uid?: string;
}

function getPaymentBadgeStyle(paymentStatus?: string) {
  const p = (paymentStatus || "unpaid").toLowerCase();
  if (p === "paid") {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
  }
  if (p === "refunded") {
    return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
  }
  return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
}

function formatMoney(val: any): string {
  const num = Number(val);
  if (val === undefined || val === null || isNaN(num)) return "0.00";
  return num.toFixed(2);
}

function formatSalonAddress(address: any): string | null {
  if (!address) return null;
  if (typeof address === "string") return address.trim() || null;
  if (typeof address === "object") {
    const parts = [address.line1, address.line2, address.city, address.state, address.postalCode, address.country]
      .filter((p) => typeof p === "string" && p.trim().length > 0);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
}

function formatPhoneStr(phone: any): string | null {
  if (!phone) return null;
  if (typeof phone === "string") return phone.trim() || null;
  if (typeof phone === "object") {
    const code = phone.countryCode ? `${phone.countryCode} ` : "";
    const num = phone.number || "";
    return `${code}${num}`.trim() || null;
  }
  return null;
}

export default function ProfessionalWorkspacePage() {
  const user = useSelector((state: { auth?: { user?: any } }) => state.auth?.user);
  const { data: profileResponse, isLoading: isProfileLoading } = useGetMyProfileQuery(undefined, { skip: !user });
  const profileData = profileResponse?.data;
  const storedIsSalonOwner = typeof window !== "undefined" ? localStorage.getItem("isSalonOwner") === "true" : false;
  const isSalonOwner = Boolean(profileData?.isSalonOwner ?? user?.isSalonOwner ?? (storedIsSalonOwner && (user?.role === "professional" || user?.role === "business")));

  const [activeTab, setActiveTab] = useState<"browse" | "bookings">("browse");
  const [favorites, setFavorites] = useState<string[]>([]);

  // API Queries & Mutations
  const {
    data: allChairsRes,
    isLoading: isLoadingChairs,
    isError: isErrorChairs,
    error: errorChairs,
    refetch: refetchChairs,
  } = useGetAllChairsQuery({ status: "active" }, { skip: isSalonOwner });

  const {
    data: myRentalsRes,
    isLoading: isLoadingRentals,
    refetch: refetchMyRentals,
  } = useGetMyRentalsQuery({}, { skip: isSalonOwner });

  const [createChairRental, { isLoading: isBookingLoading }] = useCreateChairRentalMutation();
  const [updateChairRental] = useUpdateChairRentalMutation();

  // Modal State for Booking a Chair
  const [selectedChair, setSelectedChair] = useState<ChairRentalItem | null>(null);
  // Modal State for Viewing Rental Details
  const [selectedRental, setSelectedRental] = useState<BookingRecord | null>(null);
  const [isCancellingRental, setIsCancellingRental] = useState(false);

  const {
    data: singleRentalRes,
    isFetching: isSingleRentalFetching,
  } = useGetSingleChairRentalQuery(selectedRental?._id, {
    skip: !selectedRental?._id,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedRental) {
        setSelectedRental(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRental]);

  // Timezone-safe local client date strings (YYYY-MM-DD)
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getFutureString = (daysAhead = 2) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getFutureString(2));
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // If user is a salon owner, show the salon owner workspace management view
  if (isSalonOwner) {
    return <BusinessWorkspacePage />;
  }

  // Extract data lists from API responses
  const chairsList: ChairRentalItem[] = Array.isArray(allChairsRes?.data)
    ? allChairsRes.data
    : Array.isArray(allChairsRes)
      ? allChairsRes
      : [];

  const myBookingsList: BookingRecord[] = Array.isArray(myRentalsRes?.data)
    ? myRentalsRes.data
    : Array.isArray(myRentalsRes)
      ? myRentalsRes
      : [];

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const [sY, sM, sD] = start.split("-").map(Number);
    const [eY, eM, eD] = end.split("-").map(Number);
    if (!sY || !sM || !sD || !eY || !eM || !eD) return 1;

    const sUTC = Date.UTC(sY, sM - 1, sD);
    const eUTC = Date.UTC(eY, eM - 1, eD);
    const diffTime = eUTC - sUTC;
    if (diffTime < 0) return 1;

    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Inclusive: e.g. 31st to 31st = 1 day, 31st to 1st = 2 days
  };

  const rentalDays = calculateDays(startDate, endDate);
  const dailyRate = selectedChair?.pricePerDayInUSD || 0;
  const estimatedSubtotal = dailyRate * rentalDays;
  const platformFee = Math.round(estimatedSubtotal * 0.10 * 100) / 100;
  const estimatedTotal = Math.round((estimatedSubtotal + platformFee) * 100) / 100;

  const formatStartDateISO = (dateStr: string) => {
    try {
      if (dateStr.includes("T")) return new Date(dateStr).toISOString();
      return new Date(`${dateStr}T09:00:00.000Z`).toISOString();
    } catch (e) {
      return new Date().toISOString();
    }
  };

  const formatEndDateISO = (dateStr: string) => {
    try {
      if (dateStr.includes("T")) return new Date(dateStr).toISOString();
      return new Date(`${dateStr}T18:00:00.000Z`).toISOString();
    } catch (e) {
      return new Date().toISOString();
    }
  };

  const handleBookChairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChair) return;

    const today = getTodayString();
    if (startDate < today) {
      toast.error("Start date cannot be in the past");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("End date cannot be earlier than start date");
      return;
    }

    try {
      const payload = {
        chair: selectedChair._id,
        startDate: formatStartDateISO(startDate),
        endDate: formatEndDateISO(endDate),
      };

      const res = await createChairRental(payload).unwrap();
      const checkoutUrl = res?.data?.paymentData?.url || res?.data?.checkoutUrl || res?.data?.paymentUrl;

      if (checkoutUrl) {
        toast.success(res?.message || "Redirecting to payment checkout...");
        window.location.href = checkoutUrl;
        return;
      }

      toast.success(res?.message || "Workspace booking request sent successfully!");
      setBookingSuccess(true);
      refetchMyRentals();

      setTimeout(() => {
        setSelectedChair(null);
        setBookingSuccess(false);
        setActiveTab("bookings");
      }, 1500);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to submit booking request");
    }
  };

  if (isProfileLoading) {
    return (
      <div className="p-16 text-center bg-card border border-border rounded-lg flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#D99722]" />
        <p className="text-sm text-muted-foreground">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header Section */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Workspace
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-normal tracking-wide">
          Find a workspace when you need it
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border flex items-center gap-8 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab("browse")}
          className={`pb-2.5 font-medium transition-all cursor-pointer relative ${activeTab === "browse"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Browse Workspaces
          {activeTab === "browse" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bookings")}
          className={`pb-2.5 font-medium transition-all cursor-pointer relative ${activeTab === "bookings"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          My Bookings ({myBookingsList.length})
          {activeTab === "bookings" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* Tab 1: Browse Chairs */}
      {activeTab === "browse" && (
        <>
          {isLoadingChairs ? (
            <CardGridSkeleton count={3} />
          ) : isErrorChairs ? (
            <div className="p-8 text-center bg-destructive/10 border border-destructive/20 rounded-lg flex flex-col items-center justify-center space-y-3">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                {(errorChairs as any)?.data?.message || "Failed to load workspaces."}
              </p>
              <button
                type="button"
                onClick={() => refetchChairs()}
                className="px-4 py-2 bg-secondary text-foreground text-xs font-medium rounded-md hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : chairsList.length === 0 ? (
            <div className="p-16 text-center bg-card border border-border rounded-lg flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                <Armchair className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">
                  No workspaces available
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  There are no salon workspaces available for rental at the moment. Please check back later.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
              {chairsList.map((item) => {
                const isFav = favorites.includes(item._id);
                const salonObj = typeof item.salon === "object" ? item.salon : null;
                const imageSrc =
                  item.photo ||
                  salonObj?.photos?.[0] ||
                  salonObj?.logo ||
                  "";

                const salonName = salonObj?.name || "Salon Space";
                const category = salonObj?.businessType || "Hair & Beauty";
                const rating = salonObj?.avgRating || 5.0;
                const reviewCount = salonObj?.totalReviews || 0;

                const locationStr =
                  item.location ||
                  [salonObj?.address?.line1, salonObj?.address?.city, salonObj?.address?.country]
                    .filter(Boolean)
                    .join(", ") ||
                  "Main Location";

                return (
                  <div
                    key={item._id}
                    className="bg-card border border-border rounded-lg overflow-hidden shadow-xs flex flex-col justify-between transition-all hover:border-primary/50"
                  >
                    {/* Image Container */}
                    <div className="relative w-full h-56 bg-accent">
                      <Link
                        href={`/workspaces/${item._id}`}
                        className="block w-full h-full group"
                      >
                        <ChairImage
                          src={imageSrc}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          showLabel
                        />
                      </Link>

                      {/* Open / Status Badge */}
                      <span className="absolute top-3 left-3 bg-background/80 backdrop-blur-xs text-foreground text-[11px] font-medium px-3 py-1 rounded-full shadow-xs border border-border capitalize">
                        {item.status || "Available"}
                      </span>

                      {/* Heart Favorite Button */}
                      <button
                        type="button"
                        onClick={() => toggleFavorite(item._id)}
                        aria-label="Save workspace to favorites"
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur-xs flex items-center justify-center text-primary hover:bg-background transition-all cursor-pointer shadow-xs border border-border"
                      >
                        <Heart
                          className={`w-4 h-4 ${isFav ? "fill-primary text-primary" : "text-primary"
                            }`}
                        />
                      </button>
                    </div>

                    {/* Card Details */}
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        {/* Title & Price Row */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/workspaces/${item._id}`}>
                              <h3 className="font-bold text-lg sm:text-xl text-foreground leading-tight hover:text-primary transition-colors">
                                {item.name}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 font-medium">
                              <Building2 className="w-3 h-3 text-[#D99722]" />
                              <span>{salonName}</span>
                            </div>
                          </div>
                          <span className="font-bold text-lg sm:text-xl text-primary shrink-0">
                            ${item.pricePerDayInUSD}
                            <span className="text-xs text-muted-foreground font-normal">
                              /day
                            </span>
                          </span>
                        </div>

                        {/* Category */}
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {category}
                        </p>

                        {/* Description */}
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        {/* Star Rating Row */}
                        <div className="flex items-center gap-1 text-xs sm:text-sm">
                          <div className="flex items-center gap-0.5 text-primary">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className="w-3.5 h-3.5 fill-primary text-primary"
                              />
                            ))}
                          </div>
                          <span className="text-foreground font-medium ml-1">
                            {rating} ({reviewCount})
                          </span>
                        </div>

                        {/* Location Row */}
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                          <span className="line-clamp-1">{locationStr}</span>
                        </div>
                      </div>

                      {/* Book Action */}
                      <div className="pt-2">
                        <Link
                          href={`/workspaces/${item._id}`}
                          className="w-full block text-center bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground py-2.5 rounded-sm font-medium text-xs sm:text-sm transition-all cursor-pointer"
                        >
                          Book Workspace
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab 2: My Bookings */}
      {activeTab === "bookings" && (
        <div className="pt-2">
          {isLoadingRentals ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 h-44 animate-pulse"
                />
              ))}
            </div>
          ) : myBookingsList.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {myBookingsList.map((booking) => {
                const chairObj = typeof booking.chair === "object" ? booking.chair : null;
                const salonObj = typeof booking.salon === "object" ? booking.salon : null;

                const title = chairObj?.name || salonObj?.name || "Workspace";
                const salonName = salonObj?.name || "Salon Studio";
                const locationText =
                  chairObj?.location ||
                  formatSalonAddress(salonObj?.address) ||
                  "Salon Main Floor";

                const img =
                  chairObj?.photo ||
                  salonObj?.photos?.[0] ||
                  salonObj?.logo ||
                  "";

                const formattedStart = booking.startDate
                  ? new Date(booking.startDate).toLocaleDateString("en-US", {
                      timeZone: "UTC",
                      month: "short",
                      day: "numeric",
                    })
                  : "";
                const formattedEnd = booking.endDate
                  ? new Date(booking.endDate).toLocaleDateString("en-US", {
                      timeZone: "UTC",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "";
                const dateRangeStr =
                  formattedStart && formattedEnd
                    ? `${formattedStart} – ${formattedEnd}`
                    : "Workspace Booking";

                const daysCount =
                  booking.durationInDays ||
                  (booking.startDate && booking.endDate
                    ? Math.max(
                        1,
                        Math.round(
                          (new Date(booking.endDate).getTime() -
                            new Date(booking.startDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        ) + 1
                      )
                    : null);

                const rawTotal =
                  booking.pricing?.total ?? booking.totalPrice ?? booking.pricePerDayInUSD;
                const priceStr =
                  rawTotal !== undefined ? `$${formatMoney(rawTotal)}` : "N/A";
                const dailyRate = chairObj?.pricePerDayInUSD ?? booking.pricePerDayInUSD;

                const statusStr = booking.status || "pending";
                const paymentStr = booking.paymentStatus || "unpaid";

                return (
                  <div
                    key={booking._id}
                    className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-2xs hover:border-[#D99722]/60 hover:shadow-md transition-all group"
                  >
                    {/* Top Body: Thumbnail + Info */}
                    <div className="flex flex-col sm:flex-row gap-4 min-w-0">
                      <div className="relative w-full h-44 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-accent shrink-0 border border-border">
                        <ChairImage
                          src={img}
                          alt={title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-base sm:text-lg text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                              {title}
                            </h3>
                            <span className="text-[10px] font-mono bg-accent px-2 py-0.5 rounded border border-border text-muted-foreground shrink-0">
                              #{booking.uid || booking._id?.slice(-6)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Building2 className="w-3.5 h-3.5 text-[#D99722] shrink-0" />
                            <span className="font-medium text-foreground truncate">{salonName}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{locationText}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                            <Calendar className="w-3.5 h-3.5 text-[#D99722] shrink-0" />
                            <span>{dateRangeStr}</span>
                            {daysCount && (
                              <span className="text-[11px] text-muted-foreground">
                                ({daysCount} {daysCount === 1 ? "day" : "days"})
                              </span>
                            )}
                          </span>

                          <div className="text-right">
                            <span className="font-extrabold text-base sm:text-lg text-[#D99722]">
                              {priceStr}
                            </span>
                            {dailyRate !== undefined && (
                              <span className="text-[11px] text-muted-foreground ml-1">
                                (${formatMoney(dailyRate)}/day)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Status Badges + Actions */}
                    <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${getAppointmentStatusBadgeStyle(
                            statusStr
                          )}`}
                        >
                          {formatAppointmentStatus(statusStr)}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold capitalize ${getPaymentBadgeStyle(
                            paymentStr
                          )}`}
                        >
                          {paymentStr.toLowerCase() === "paid" ? (
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3 h-3 shrink-0" />
                          )}
                          {paymentStr}
                        </span>
                      </div>

                      <div className="flex items-center w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setSelectedRental(booking)}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-accent/60 border border-border rounded-2xl p-12 text-center text-muted-foreground space-y-3">
              <Armchair className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="font-bold text-lg text-foreground">No active workspace bookings found.</p>
              <p className="text-xs max-w-sm mx-auto">
                Browse available salon workspaces and select dates to book a station.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("browse")}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold cursor-pointer transition-colors"
              >
                Browse Workspaces
              </button>
            </div>
          )}
        </div>
      )}

      {/* Workspace Booking View Details Modal */}
      {selectedRental && (() => {
        const activeRental: BookingRecord = singleRentalRes?.data
          ? { ...selectedRental, ...singleRentalRes.data }
          : selectedRental;
        const chairObj = typeof activeRental.chair === "object" ? activeRental.chair : null;
        const salonObj = typeof activeRental.salon === "object" ? activeRental.salon : null;
        const chairName = chairObj?.name || salonObj?.name || "Workspace";
        const chairImg = chairObj?.photo || salonObj?.photos?.[0] || salonObj?.logo || "";
        const salonName = salonObj?.name || "Salon Studio";
        const salonAddress = formatSalonAddress(salonObj?.address);
        const salonPhone = formatPhoneStr(salonObj?.phone);
        const targetChairId =
          chairObj?._id ||
          (typeof activeRental.chair === "string" ? activeRental.chair : null) ||
          activeRental._id;

        const daysCount =
          activeRental.durationInDays ||
          (activeRental.startDate && activeRental.endDate
            ? Math.max(
                1,
                Math.round(
                  (new Date(activeRental.endDate).getTime() -
                    new Date(activeRental.startDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1
              )
            : 1);

        const dailyRate = chairObj?.pricePerDayInUSD ?? activeRental.pricePerDayInUSD ?? 0;
        const computedSubtotal = dailyRate * daysCount;
        const subtotal = activeRental.pricing?.subtotal ?? computedSubtotal;
        const fee = activeRental.pricing?.platformFee ?? activeRental.pricing?.serviceFee;
        const discount = activeRental.pricing?.discount ?? 0;
        const total = activeRental.pricing?.total ?? activeRental.totalPrice ?? subtotal;
        const transactionRef =
          typeof activeRental.transaction === "object"
            ? activeRental.transaction?.uid || activeRental.transaction?.transactionId || activeRental.transaction?._id
            : activeRental.transaction;

        const formatFullDate = (d?: string) => {
          if (!d) return "N/A";
          try {
            return new Date(d).toLocaleDateString("en-US", {
              timeZone: "UTC",
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          } catch {
            return d;
          }
        };

        const handleCancelRental = async () => {
          if (!confirm("Are you sure you want to cancel this workspace booking request?")) return;
          try {
            setIsCancellingRental(true);
            await updateChairRental({
              chairRentalId: activeRental._id,
              id: activeRental._id,
              data: { status: "cancelled" },
              status: "cancelled",
            }).unwrap();
            toast.success("Workspace booking cancelled successfully.");
            setSelectedRental(null);
            refetchMyRentals();
          } catch (err: any) {
            toast.error(err?.data?.message || "Failed to cancel workspace booking.");
          } finally {
            setIsCancellingRental(false);
          }
        };

        return (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedRental(null)}
          >
            <div
              className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] text-card-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sticky Header */}
              <div className="bg-accent/80 px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <Armchair className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base sm:text-lg text-foreground">
                        Workspace Booking Details
                      </h3>
                      {isSingleRentalFetching && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Ref: {activeRental.uid || activeRental._id}
                      {activeRental.createdAt ? ` · Booked ${formatFullDate(activeRental.createdAt)}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRental(null)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Status Strip */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-accent/50 border border-border flex-wrap gap-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Booking Status:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getAppointmentStatusBadgeStyle(
                          activeRental.status
                        )}`}
                      >
                        {formatAppointmentStatus(activeRental.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Payment:</span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${getPaymentBadgeStyle(
                          activeRental.paymentStatus
                        )}`}
                      >
                        {(activeRental.paymentStatus || "unpaid").toLowerCase() === "paid" ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        {activeRental.paymentStatus || "unpaid"}
                      </span>
                    </div>
                  </div>
                  {transactionRef && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                      <CreditCard className="w-3.5 h-3.5 text-primary" />
                      <span>Txn: {String(transactionRef)}</span>
                    </span>
                  )}
                </div>

                {/* Chair / Workspace Card */}
                <div className="p-4 rounded-xl bg-accent/30 border border-border/70 flex flex-col sm:flex-row gap-4">
                  <div className="relative w-full h-40 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-accent border border-border shrink-0">
                    <ChairImage src={chairImg} alt={chairName} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h4 className="font-bold text-base text-foreground">{chairName}</h4>
                        {chairObj?.uid && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            Chair ID: {chairObj.uid}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-extrabold text-[#D99722]">
                        ${formatMoney(dailyRate)}/day
                      </span>
                    </div>
                    {chairObj?.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{chairObj.location}</span>
                      </p>
                    )}
                    {chairObj?.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {chairObj.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Host Salon & Schedule Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Host Salon */}
                  <div className="p-4 rounded-xl bg-accent/30 border border-border/70 space-y-2.5">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Host Salon
                    </p>
                    <div className="flex items-start gap-3">
                      {salonObj?.logo ? (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-accent border border-border shrink-0">
                          <Image
                            src={salonObj.logo}
                            alt={salonName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0 space-y-1 text-xs">
                        <p className="font-bold text-sm text-foreground">{salonName}</p>
                        {salonObj?.businessType && (
                          <p className="text-muted-foreground">{salonObj.businessType}</p>
                        )}
                        {salonAddress && (
                          <p className="text-muted-foreground flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span>{salonAddress}</span>
                          </p>
                        )}
                        {salonObj?.email && (
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{salonObj.email}</span>
                          </p>
                        )}
                        {salonPhone && (
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{salonPhone}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="p-4 rounded-xl bg-accent/30 border border-border/70 space-y-2.5">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Rental Schedule
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div>
                          <span className="text-muted-foreground">Start Date: </span>
                          <span className="font-semibold text-foreground">
                            {formatFullDate(activeRental.startDate)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div>
                          <span className="text-muted-foreground">End Date: </span>
                          <span className="font-semibold text-foreground">
                            {formatFullDate(activeRental.endDate)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div>
                          <span className="text-muted-foreground">Duration: </span>
                          <span className="font-bold text-foreground">
                            {daysCount} {daysCount === 1 ? "Day" : "Days"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="p-4 rounded-xl bg-accent/40 border border-border/70 space-y-2 text-xs">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pb-1">
                    Payment Breakdown
                  </p>
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      Daily Rate (${formatMoney(dailyRate)} × {daysCount}{" "}
                      {daysCount === 1 ? "day" : "days"})
                    </span>
                    <span className="font-semibold text-foreground">${formatMoney(subtotal)}</span>
                  </div>
                  {Number(discount) > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Discount</span>
                      <span className="font-semibold">-${formatMoney(discount)}</span>
                    </div>
                  )}
                  {fee !== undefined && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Platform Fee</span>
                      <span className="font-semibold text-foreground">${formatMoney(fee)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-2 flex justify-between font-bold text-base text-foreground">
                    <span>Total Amount</span>
                    <span className="text-primary">${formatMoney(total)} USD</span>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="bg-accent/60 px-6 py-4 border-t border-border flex flex-wrap items-center justify-between gap-3 shrink-0">
                {(activeRental.status || "").toLowerCase() === "pending" && (
                  <button
                    type="button"
                    onClick={handleCancelRental}
                    disabled={isCancellingRental}
                    className="px-4 py-2 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isCancellingRental ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Ban className="w-3.5 h-3.5" />
                    )}
                    <span>Cancel Request</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <Link
                    href={`/workspaces/${targetChairId}`}
                    className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <span>View Workspace</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedRental(null)}
                    className="px-5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Book Workspace Dialog Modal */}
      {selectedChair && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 space-y-5 text-foreground">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="space-y-0.5">
                <h3 className="font-bold text-xl text-foreground">
                  Book {selectedChair.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {typeof selectedChair.salon === "object" ? selectedChair.salon?.name : "Salon"} · ${selectedChair.pricePerDayInUSD}/day
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedChair(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto animate-bounce" />
                <h4 className="font-bold text-lg text-foreground">
                  Booking Request Sent!
                </h4>
                <p className="text-xs text-muted-foreground">
                  Redirecting to your bookings...
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookChairSubmit} className="space-y-4 text-xs sm:text-sm">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Start Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      min={getTodayString()}
                      value={startDate}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        if (!newStart) return;
                        setStartDate(newStart);
                        if (newStart > endDate) {
                          setEndDate(newStart);
                        }
                      }}
                      className="w-full bg-accent border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
                      required
                    />
                    <Calendar className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    End Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      min={startDate || getTodayString()}
                      value={endDate}
                      onChange={(e) => {
                        const newEnd = e.target.value;
                        if (!newEnd) return;
                        if (newEnd < startDate) {
                          setEndDate(startDate);
                        } else {
                          setEndDate(newEnd);
                        }
                      }}
                      className="w-full bg-accent border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
                      required
                    />
                    <Calendar className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-accent/70 border border-border rounded-lg p-3 space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                      <span>Duration</span>
                    </span>
                    <span className="font-medium text-foreground">
                      {rentalDays} {rentalDays === 1 ? "Day" : "Days"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Rate (${selectedChair.pricePerDayInUSD} × {rentalDays} {rentalDays === 1 ? "day" : "days"})</span>
                    <span className="font-medium text-foreground">
                      ${estimatedSubtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      <span>Platform Fee (10%)</span>
                    </span>
                    <span className="font-semibold text-foreground">
                      ${platformFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-semibold text-foreground text-sm">
                    <span>Total Amount</span>
                    <span className="font-bold text-primary">
                      ${estimatedTotal.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedChair(null)}
                    disabled={isBookingLoading}
                    className="flex-1 bg-secondary border border-border text-secondary-foreground hover:bg-secondary/80 py-2.5 rounded-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBookingLoading}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isBookingLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Confirm Booking</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
