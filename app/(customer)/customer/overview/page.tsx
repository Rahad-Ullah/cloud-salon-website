"use client";

import Link from "next/link";
import { useGetCustomerOverviewQuery } from "@/features/analytics/analyticsApi";
import { useGetMyProfileQuery } from "@/features/profile/profileApi";
import { useGetMyAppointmentQuery } from "@/features/appointment/appointmentApi";
import {
  Calendar,
  CheckCircle2,
  Star,
  Heart,
  Clock,
  ArrowUpRight,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useSelector } from "react-redux";
import { StatsSkeletonGrid } from "@/components/ui/skeleton";
import { getUser } from "@/utils/storage";
import ChairImage from "@/components/shared/ChairImage";
import { formatAppointmentStatus, getAppointmentStatusBadgeStyle } from "@/utils/appointment";
import { AppointmentStatus } from "@/types";

export default function CustomerOverviewPage() {
  const user = useSelector((state: { auth?: { user?: any } }) => state.auth?.user);
  const { data: profileRes } = useGetMyProfileQuery(undefined);
  const { data: overviewRes, isLoading: isOverviewLoading } = useGetCustomerOverviewQuery(undefined);
  const { data: appointmentsRes, isLoading: isAppointmentsLoading } = useGetMyAppointmentQuery(undefined);
  const overview = overviewRes?.data || {};

  const storedUser = typeof window !== "undefined" ? getUser() : null;
  const storedDisplayName = typeof window !== "undefined" ? localStorage.getItem("userDisplayName") : null;
  const currentUser = profileRes?.data || user || storedUser;

  const firstName = currentUser?.firstName || "";
  const lastName = currentUser?.lastName || "";
  const customerFullName =
    `${firstName} ${lastName}`.trim() ||
    storedDisplayName ||
    currentUser?.name ||
    "Customer";

  const formatDateTime = (startsAtStr?: string) => {
    if (!startsAtStr) return "N/A";
    try {
      const date = new Date(startsAtStr);
      return date.toLocaleDateString("en-US", {
        timeZone: "UTC",
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return startsAtStr;
    }
  };

  const rawAppointments = Array.isArray(appointmentsRes?.data) ? appointmentsRes.data : [];

  const sortedAppointments = [...rawAppointments].sort((a: any, b: any) => {
    const dateA = new Date(a.startsAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.startsAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const recentBookings = sortedAppointments.slice(0, 4).map((item: any) => {
    const pro = item.professional || {};
    const salon = item.salon || {};
    const proFirstName = pro.firstName || pro.user?.firstName || "";
    const proLastName = pro.lastName || pro.user?.lastName || "";
    const proName = `${proFirstName} ${proLastName}`.trim() || salon.name || "Specialist";

    const serviceNames =
      Array.isArray(item.services) && item.services.length > 0
        ? item.services.map((s: any) => s.name).join(", ")
        : "Beauty Service";

    const rawPrice = item.pricing?.total ?? item.services?.[0]?.priceInUSD;
    const numericPrice = typeof rawPrice === "number" ? rawPrice : Number(rawPrice);
    const totalPrice =
      !isNaN(numericPrice) && rawPrice !== undefined && rawPrice !== null
        ? `$${numericPrice.toFixed(2)}`
        : rawPrice !== undefined
          ? `$${rawPrice}`
          : "$0";

    const imageUrl =
      (pro.image && pro.image.trim() !== "" ? pro.image : "") ||
      (pro.user?.image && pro.user?.image.trim() !== "" ? pro.user.image : "") ||
      (salon.logo && salon.logo.trim() !== "" ? salon.logo : "");

    const startsAtDate = item.startsAt ? new Date(item.startsAt) : new Date();
    const isPast =
      startsAtDate < new Date() ||
      item.status === AppointmentStatus.Completed ||
      item.status === AppointmentStatus.Cancelled ||
      item.status === AppointmentStatus.AutoCancelled ||
      item.status === AppointmentStatus.Rejected;

    return {
      id: item._id || item.uid,
      uid: item.uid,
      stylistName: proName,
      salonName: salon.name || "",
      service: serviceNames,
      dateTime: formatDateTime(item.startsAt),
      price: totalPrice,
      image: imageUrl,
      status: item.status || "pending",
      paymentStatus: item.paymentStatus || "unpaid",
      isPast,
    };
  });

  const stats = [
    {
      label: "Total Appointments",
      value: overview.totalAppointments ?? 0,
      icon: Calendar,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      href: "/customer/bookings",
    },
    {
      label: "Upcoming Appointments",
      value: overview.totalUpcomingAppointments ?? 0,
      icon: Clock,
      color: "text-[#D99722] bg-[#D99722]/10 border-[#D99722]/20",
      href: "/customer/bookings?tab=upcoming",
    },
    {
      label: "Completed Appointments",
      value: overview.totalCompletedAppointments ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      href: "/customer/bookings?tab=past",
    },
    {
      label: "Total Reviews",
      value: overview.totalReviews ?? 0,
      icon: Star,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      href: "/customer/reviews",
    },
    {
      label: "Saved Wishlists",
      value: overview.totalWishlists ?? 0,
      icon: Heart,
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
      href: "/customer/favorites",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="space-y-1">
        <p className="text-xs sm:text-sm text-muted-foreground font-normal tracking-wide">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h1 className="font-extrabold text-2xl sm:text-4xl text-foreground tracking-tight">
          Welcome back, <span className="notranslate" translate="no">{customerFullName}</span>
          {customerFullName.endsWith(".") ? "" : "."}
        </h1>
      </div>

      {/* Overview Stats Cards */}
      {isOverviewLoading ? (
        <StatsSkeletonGrid count={5} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Link
                key={idx}
                href={stat.href}
                className="bg-card border border-border/70 rounded-2xl p-5 transition-all shadow-2xs hover:border-[#D99722]/60 hover:shadow-md hover:-translate-y-0.5 group flex flex-col justify-between space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`p-2.5 rounded-xl border ${stat.color} transition-transform group-hover:scale-110`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight group-hover:text-[#D99722] transition-colors">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mt-1 leading-snug">
                    {stat.label}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Recent Bookings Section */}
      <div className="space-y-4 pt-4 border-t border-border/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              Recent Bookings
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your latest appointments and service history
            </p>
          </div>
          <Link
            href="/customer/bookings"
            className="text-xs font-semibold text-[#D99722] hover:underline flex items-center gap-1 group"
          >
            <span>View all bookings</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {isAppointmentsLoading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-card border border-border/70 rounded-2xl p-3.5 sm:p-4 flex items-center gap-4 animate-pulse h-28"
              />
            ))}
          </div>
        ) : recentBookings.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {recentBookings.map((booking: any) => (
              <Link
                key={booking.id}
                href={
                  booking.isPast
                    ? "/customer/bookings?tab=past"
                    : "/customer/bookings?tab=upcoming"
                }
                className="bg-card border border-border/70 rounded-2xl p-3 sm:p-3.5 lg:p-4 transition-all shadow-2xs hover:border-[#D99722]/60 hover:shadow-md hover:-translate-y-0.5 group cursor-pointer flex flex-col sm:flex-row sm:items-stretch justify-between gap-3 sm:gap-3.5"
              >
                {/* Thumbnail Image: Full-width banner on mobile, side-thumbnail on sm+ */}
                <div className="relative w-full h-40 sm:h-auto sm:self-stretch sm:w-24 lg:w-[104px] rounded-xl overflow-hidden shrink-0 bg-accent/80 border border-border/80 shadow-2xs">
                  <ChairImage
                    src={booking.image}
                    alt={booking.stylistName}
                    size="md"
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Stylist & Booking Details */}
                <div className="min-w-0 flex-1 flex flex-col justify-between gap-2 sm:gap-1 py-0.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug group-hover:text-[#D99722] transition-colors truncate">
                        {booking.stylistName}
                      </h3>
                      {booking.salonName && (
                        <span className="text-[10px] font-semibold bg-accent px-2 py-0.5 rounded-md text-muted-foreground truncate max-w-[140px] sm:max-w-[150px]">
                          {booking.salonName}
                        </span>
                      )}
                    </div>

                    <p className="text-[#D99722] font-semibold text-xs sm:text-sm truncate mt-0.5">
                      {booking.service}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-2.5 text-xs text-muted-foreground flex-wrap pt-0.5">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Clock className="w-3.5 h-3.5 text-[#D99722] shrink-0" />
                      <span className="truncate">{booking.dateTime}</span>
                    </span>
                    <span className="font-extrabold text-[#D99722] text-xs sm:text-sm">
                      {booking.price}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t sm:border-t-0 border-border/40">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${booking.paymentStatus === "paid"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                      >
                        {booking.paymentStatus === "paid" ? (
                          <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        ) : (
                          <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        )}
                        Payment: {booking.paymentStatus}
                      </span>

                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getAppointmentStatusBadgeStyle(
                          booking.status
                        )}`}
                      >
                        Status: {formatAppointmentStatus(booking.status)}
                      </span>
                    </div>

                    {/* Mobile inline button */}
                    <span className="sm:hidden px-2.5 py-1.5 rounded-lg bg-accent text-foreground group-hover:bg-[#D99722] group-hover:text-white transition-all text-xs font-semibold flex items-center gap-1 shadow-2xs whitespace-nowrap">
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>

                {/* Desktop/Tablet Right Action Button */}
                <div className="hidden sm:flex shrink-0 items-center justify-end self-center">
                  <span className="px-3 py-2 rounded-xl bg-accent text-foreground group-hover:bg-[#D99722] group-hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
                    <span>View Booking</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border/70 rounded-2xl p-8 text-center space-y-3">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="font-bold text-base text-foreground">No Recent Bookings</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              You haven't booked any appointments yet. Discover top-rated beauty and grooming
              specialists near you!
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D99722] hover:bg-[#C2841B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <span>Explore & Book</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

