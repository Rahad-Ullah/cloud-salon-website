"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import {
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle2,
  Star,
  Building2,
  Sparkles,
  BarChart2,
  ArrowUpRight,
  ArrowRight,
  AlertCircle,
  Scissors,
  Armchair,
  MessageSquare,
  PlusCircle,
  Settings,
  Image as ImageIcon,
  CalendarCheck,
} from "lucide-react";
import { useGetMyProfileQuery } from "@/features/profile/profileApi";
import { useGetProfessionalOverviewQuery } from "@/features/analytics/analyticsApi";
import { useGetMyAppointmentQuery } from "@/features/appointment/appointmentApi";
import { useGetMyServicesQuery } from "@/features/services/servicesApi";
import { useGetMyRentalsQuery } from "@/features/chairRental/chairRentalApi";
import { useGetMyChairsQuery } from "@/features/chair/chairApi";
import { useGetMySalonQuery } from "@/features/salon/salonApi";
import { useGetAllChatsQuery } from "@/features/chat/chatApi";
import { getUser } from "@/utils/storage";
import ChairImage from "@/components/shared/ChairImage";
import { formatAppointmentStatus, getAppointmentStatusBadgeStyle } from "@/utils/appointment";
import { StatsSkeletonGrid, Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DEFAULT_CHART_DATA = MONTHS.map((month) => ({
  month,
  count: 0,
}));

interface PartnerDashboardViewProps {
  mode: "professional" | "business";
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
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
    return dateStr;
  }
}

function formatShortDate(dateStr?: string) {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

export default function PartnerDashboardView({ mode }: PartnerDashboardViewProps) {
  const user = useSelector((state: { auth?: { token?: string | null; user?: any } }) => state.auth?.user);
  const { data: profileResponse, isLoading: isProfileLoading } = useGetMyProfileQuery(undefined);
  const { data: overviewRes, isLoading: isOverviewLoading } = useGetProfessionalOverviewQuery(undefined);
  const { data: appointmentsRes, isLoading: isAppointmentsLoading } = useGetMyAppointmentQuery(undefined);
  const { data: servicesRes } = useGetMyServicesQuery({});
  const { data: chatsRes } = useGetAllChatsQuery(undefined, { skip: !user });
  const { data: rentalsRes, isLoading: isRentalsLoading } = useGetMyRentalsQuery({});

  const profileData = profileResponse?.data || profileResponse;
  const storedUser = typeof window !== "undefined" ? getUser() : null;
  const currentUser = profileData || user || storedUser;
  const storedDisplayName =
    typeof window !== "undefined"
      ? localStorage.getItem("userDisplayName") ||
        (currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ""}`.trim() : null)
      : null;

  const isSalonOwnerFromApi =
    profileData?.isSalonOwner ??
    profileData?.user?.isSalonOwner ??
    profileResponse?.data?.isSalonOwner ??
    profileResponse?.isSalonOwner;
  const isSalonOwnerFromUser = currentUser?.isSalonOwner ?? currentUser?.user?.isSalonOwner;
  const storedIsSalonOwner = typeof window !== "undefined" ? localStorage.getItem("isSalonOwner") : null;
  const isSalonOwner =
    mode === "business" ||
    Boolean(
      isSalonOwnerFromApi !== undefined
        ? isSalonOwnerFromApi
        : isSalonOwnerFromUser !== undefined
          ? isSalonOwnerFromUser
          : storedIsSalonOwner !== null
            ? storedIsSalonOwner === "true"
            : false
    );

  const { data: chairsRes } = useGetMyChairsQuery({}, { skip: !isSalonOwner });
  const { data: salonRes } = useGetMySalonQuery(undefined, { skip: !isSalonOwner });

  const overview = overviewRes?.data || {};
  const mySalon = salonRes?.data || (Array.isArray(salonRes) ? salonRes[0] : salonRes);

  useEffect(() => {
    if (profileData && typeof window !== "undefined") {
      const fullName = profileData.firstName
        ? `${profileData.firstName} ${profileData.lastName || ""}`.trim()
        : profileData.name;
      if (fullName) {
        localStorage.setItem("userDisplayName", fullName);
      }
    }
  }, [profileData]);

  const personalName = currentUser?.firstName
    ? `${currentUser.firstName} ${currentUser.lastName || ""}`.trim()
    : storedDisplayName || currentUser?.name || user?.name || (isSalonOwner ? "Salon Owner" : "Business Professional");

  const displayName = mode === "business" && mySalon?.name ? mySalon.name : personalName;

  const routes =
    mode === "business"
      ? {
          bookings: "/business/bookings",
          upcomingBookings: "/business/bookings",
          pendingBookings: "/business/bookings",
          reviews: "/business/reviews",
          services: "/business/services",
          workspaces: "/business/chairs-space",
          workspaceBookings: "/business/workspace",
          messages: "/business/messages",
          calendar: "/business/calendar",
          businessProfile: "/business/business-profile",
          portfolio: "/business/business-profile",
          settings: "/business/settings",
        }
      : {
          bookings: "/professional/service-bookings",
          upcomingBookings: "/professional/service-bookings?tab=Confirmed",
          pendingBookings: "/professional/service-bookings?tab=Pending",
          reviews: "/professional/reviews",
          services: "/professional/services",
          workspaces: "/professional/workspaces",
          workspaceBookings: isSalonOwner ? "/professional/booking" : "/professional/workspace",
          messages: "/professional/messages",
          calendar: "/professional/calendar",
          businessProfile: "/professional/business-profile",
          portfolio: "/professional/portfolio",
          settings: "/professional/settings",
        };

  const rawAppointments = Array.isArray(appointmentsRes?.data) ? appointmentsRes.data : [];

  const pendingAppointmentsCount = rawAppointments.filter(
    (item: any) => (item.status || "").toLowerCase() === "pending"
  ).length;

  const servicesList = Array.isArray(servicesRes?.data)
    ? servicesRes.data
    : Array.isArray(servicesRes)
      ? servicesRes
      : [];

  const chatsCount = Array.isArray(chatsRes?.data)
    ? chatsRes.data.length
    : chatsRes?.pagination?.total ?? (Array.isArray(chatsRes) ? chatsRes.length : 0);

  const rentalsList = Array.isArray(rentalsRes?.data)
    ? rentalsRes.data
    : Array.isArray(rentalsRes)
      ? rentalsRes
      : [];

  const chairsList = Array.isArray(chairsRes?.data)
    ? chairsRes.data
    : Array.isArray(chairsRes)
      ? chairsRes
      : [];

  const sortedAppointments = [...rawAppointments].sort((a: any, b: any) => {
    const dateA = new Date(a.startsAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.startsAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const recentBookings = sortedAppointments.slice(0, 4).map((item: any) => {
    const customer = item.customer || {};
    const salon = item.salon || {};
    const custFirstName = customer.firstName || "";
    const custLastName = customer.lastName || "";
    const customerName =
      `${custFirstName} ${custLastName}`.trim() || customer.email || "Client";

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
      (customer.image && customer.image.trim() !== "" ? customer.image : "") ||
      (salon.logo && salon.logo.trim() !== "" ? salon.logo : "");

    return {
      id: item._id || item.uid,
      customerName,
      salonName: salon.name || "",
      service: serviceNames,
      dateTime: formatDateTime(item.startsAt || item.scheduledAt),
      price: totalPrice,
      image: imageUrl,
      status: item.status || "pending",
      paymentStatus: item.paymentStatus || "unpaid",
    };
  });

  const sortedRentals = [...rentalsList].sort((a: any, b: any) => {
    const dateA = new Date(a.startDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.startDate || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const recentWorkspaceBookings = sortedRentals.slice(0, 4).map((item: any) => {
    const chair = typeof item.chair === "object" ? item.chair : {};
    const pro = typeof item.professional === "object" ? item.professional : {};
    const proName =
      pro.firstName || pro.lastName
        ? `${pro.firstName || ""} ${pro.lastName || ""}`.trim()
        : pro.name || pro.email || "Stylist";

    const rawPrice = item.pricing?.total ?? item.totalPrice ?? item.pricePerDayInUSD;
    const numericPrice = typeof rawPrice === "number" ? rawPrice : Number(rawPrice);
    const totalPrice =
      !isNaN(numericPrice) && rawPrice !== undefined && rawPrice !== null
        ? `$${numericPrice.toFixed(2)}`
        : "$0";

    const imageUrl =
      (chair.photo && chair.photo.trim() !== "" ? chair.photo : "") ||
      (pro.image && pro.image.trim() !== "" ? pro.image : "");

    return {
      id: item._id || item.uid,
      chairName: chair.name || "Salon Workspace",
      stylistName: proName,
      dateRange: `${formatShortDate(item.startDate)} – ${formatShortDate(item.endDate)}`,
      price: totalPrice,
      image: imageUrl,
      status: item.status || "pending",
      paymentStatus: item.paymentStatus || "unpaid",
    };
  });

  const statCards = isSalonOwner
    ? [
        {
          label: "Total Appointments",
          value: overview.totalAppointments ?? 0,
          icon: Calendar,
          color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
          href: routes.bookings,
        },
        {
          label: "Upcoming Appointments",
          value: overview.totalUpcomingAppointments ?? 0,
          icon: Clock,
          color: "text-[#D99722] bg-[#D99722]/10 border-[#D99722]/20",
          href: routes.upcomingBookings,
        },
        {
          label: "Pending Requests",
          value: pendingAppointmentsCount,
          icon: AlertCircle,
          color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
          href: routes.pendingBookings,
        },
        {
          label: "Completed Appointments",
          value: overview.totalCompletedAppointments ?? 0,
          icon: CheckCircle2,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          href: routes.bookings,
        },
        {
          label: "My Workspaces",
          value: chairsList.length,
          icon: Armchair,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          href: routes.workspaces,
        },
        {
          label: "Workspace Bookings",
          value: rentalsList.length,
          icon: CalendarCheck,
          color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
          href: routes.workspaceBookings,
        },
        {
          label: "Active Services",
          value: servicesList.length,
          icon: Scissors,
          color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
          href: routes.services,
        },
        {
          label: "Total Reviews",
          value: overview.totalReviews ?? 0,
          icon: Star,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          href: routes.reviews,
        },
      ]
    : [
        {
          label: "Total Appointments",
          value: overview.totalAppointments ?? 0,
          icon: Calendar,
          color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
          href: routes.bookings,
        },
        {
          label: "Upcoming Appointments",
          value: overview.totalUpcomingAppointments ?? 0,
          icon: Clock,
          color: "text-[#D99722] bg-[#D99722]/10 border-[#D99722]/20",
          href: routes.upcomingBookings,
        },
        {
          label: "Completed Appointments",
          value: overview.totalCompletedAppointments ?? 0,
          icon: CheckCircle2,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          href: routes.bookings,
        },
        {
          label: "Total Reviews",
          value: overview.totalReviews ?? 0,
          icon: Star,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          href: routes.reviews,
        },
        {
          label: "Pending Requests",
          value: pendingAppointmentsCount,
          icon: AlertCircle,
          color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
          href: routes.pendingBookings,
        },
        {
          label: "Active Services",
          value: servicesList.length,
          icon: Scissors,
          color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
          href: routes.services,
        },
        {
          label: "Chair Rentals",
          value: rentalsList.length,
          icon: Armchair,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          href: routes.workspaceBookings,
        },
        {
          label: "Messages",
          value: chatsCount,
          icon: MessageSquare,
          color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
          href: routes.messages,
        },
      ];

  const quickActions = [
    {
      title: "Calendar & Schedule",
      subtitle: "Manage booking slots",
      icon: CalendarDays,
      href: routes.calendar,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    isSalonOwner
      ? {
          title: "Messages",
          subtitle: `${chatsCount} ${chatsCount === 1 ? "conversation" : "conversations"}`,
          icon: MessageSquare,
          href: routes.messages,
          color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
        }
      : {
          title: "Manage Services",
          subtitle: "Add or edit pricing",
          icon: PlusCircle,
          href: routes.services,
          color: "text-[#D99722] bg-[#D99722]/10 border-[#D99722]/20",
        },
    isSalonOwner
      ? {
          title: "Business Profile",
          subtitle: "Salon storefront details",
          icon: Building2,
          href: routes.businessProfile,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        }
      : {
          title: "My Portfolio",
          subtitle: "Showcase your work",
          icon: ImageIcon,
          href: routes.portfolio,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        },
    {
      title: "Account Settings",
      subtitle: "Profile & preferences",
      icon: Settings,
      href: routes.settings,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
  ];

  const chartData =
    Array.isArray(overview.monthlyAppointmentsGrowth) && overview.monthlyAppointmentsGrowth.length > 0
      ? overview.monthlyAppointmentsGrowth.map((item: any) => ({
          month: item.month,
          count: item.count || 0,
        }))
      : DEFAULT_CHART_DATA;

  return (
    <div className="space-y-8 pb-16">
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
          Welcome back, <span className="notranslate" translate="no">{displayName}</span>
          {displayName.endsWith(".") ? "" : "."}
        </h1>
      </div>

      {/* Create Business Banner CTA (only shown if not already a salon owner) */}
      {!isSalonOwner && !isProfileLoading && mode === "professional" && (
        <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-card border border-primary/30 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg text-foreground">Create &amp; Manage Your Salon Business</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Setup your salon page, list services, configure chair spaces, and start accepting client bookings directly.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create Business</span>
          </Link>
        </div>
      )}

      {/* Overview Stats Cards (Clickable) */}
      {isOverviewLoading ? (
        <StatsSkeletonGrid count={8} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map((stat, idx) => {
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

      {/* Quick Access Shortcuts */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link
                key={idx}
                href={action.href}
                className="bg-card border border-border/70 rounded-2xl p-4 transition-all shadow-2xs hover:border-[#D99722]/60 hover:shadow-sm hover:-translate-y-0.5 group flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl border ${action.color} shrink-0 transition-transform group-hover:scale-105`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground group-hover:text-[#D99722] transition-colors truncate">
                      {action.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {action.subtitle}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#D99722] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Client Bookings Section */}
      <div className="space-y-4 pt-4 border-t border-border/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              Recent Client Bookings
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your latest client appointments and booking requests
            </p>
          </div>
          <Link
            href={routes.bookings}
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
                  booking.status?.toLowerCase() === "pending"
                    ? routes.pendingBookings
                    : routes.bookings
                }
                className="bg-card border border-border/70 rounded-2xl p-3 sm:p-3.5 lg:p-4 transition-all shadow-2xs hover:border-[#D99722]/60 hover:shadow-md hover:-translate-y-0.5 group cursor-pointer flex flex-col sm:flex-row sm:items-stretch justify-between gap-3 sm:gap-3.5"
              >
                <div className="relative w-full h-40 sm:h-auto sm:self-stretch sm:w-24 lg:w-[104px] rounded-xl overflow-hidden shrink-0 bg-accent/80 border border-border/80 shadow-2xs">
                  <ChairImage
                    src={booking.image}
                    alt={booking.customerName}
                    size="md"
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="min-w-0 flex-1 flex flex-col justify-between gap-2 sm:gap-1 py-0.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug group-hover:text-[#D99722] transition-colors truncate">
                        {booking.customerName}
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
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                          booking.paymentStatus === "paid"
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

                    <span className="sm:hidden px-2.5 py-1.5 rounded-lg bg-accent text-foreground group-hover:bg-[#D99722] group-hover:text-white transition-all text-xs font-semibold flex items-center gap-1 shadow-2xs whitespace-nowrap">
                      <span>Manage</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex shrink-0 items-center justify-end self-center">
                  <span className="px-3 py-2 rounded-xl bg-accent text-foreground group-hover:bg-[#D99722] group-hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
                    <span>Manage Booking</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border/70 rounded-2xl p-8 text-center space-y-3">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="font-bold text-base text-foreground">No Client Bookings Yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              You don&apos;t have any client appointments yet. Ensure your service menu and availability are up to date so customers can book you!
            </p>
            <Link
              href={routes.services}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D99722] hover:bg-[#C2841B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <span>Manage Services</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Recent Workspace Bookings Section (for Salon Owners / Business) */}
      {isSalonOwner && (
        <div className="space-y-4 pt-4 border-t border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                Recent Workspace Bookings
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chair rental requests and bookings from independent specialists
              </p>
            </div>
            <Link
              href={routes.workspaceBookings}
              className="text-xs font-semibold text-[#D99722] hover:underline flex items-center gap-1 group"
            >
              <span>View all rentals</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {isRentalsLoading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="bg-card border border-border/70 rounded-2xl p-3.5 sm:p-4 flex items-center gap-4 animate-pulse h-28"
                />
              ))}
            </div>
          ) : recentWorkspaceBookings.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {recentWorkspaceBookings.map((rental: any) => (
                <Link
                  key={rental.id}
                  href={routes.workspaceBookings}
                  className="bg-card border border-border/70 rounded-2xl p-3 sm:p-3.5 lg:p-4 transition-all shadow-2xs hover:border-[#D99722]/60 hover:shadow-md hover:-translate-y-0.5 group cursor-pointer flex flex-col sm:flex-row sm:items-stretch justify-between gap-3 sm:gap-3.5"
                >
                  <div className="relative w-full h-36 sm:h-auto sm:self-stretch sm:w-24 lg:w-[104px] rounded-xl overflow-hidden shrink-0 bg-accent/80 border border-border/80 shadow-2xs">
                    <ChairImage
                      src={rental.image}
                      alt={rental.chairName}
                      size="md"
                      iconType="chair"
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="min-w-0 flex-1 flex flex-col justify-between gap-2 sm:gap-1 py-0.5">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug group-hover:text-[#D99722] transition-colors truncate">
                        {rental.chairName}
                      </h3>
                      <p className="text-[#D99722] font-semibold text-xs sm:text-sm truncate mt-0.5">
                        Stylist: {rental.stylistName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-2.5 text-xs text-muted-foreground flex-wrap pt-0.5">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-[#D99722] shrink-0" />
                        <span className="truncate">{rental.dateRange}</span>
                      </span>
                      <span className="font-extrabold text-[#D99722] text-xs sm:text-sm">
                        {rental.price}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t sm:border-t-0 border-border/40">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                            rental.paymentStatus === "paid"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {rental.paymentStatus === "paid" ? (
                            <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          ) : (
                            <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          )}
                          Payment: {rental.paymentStatus}
                        </span>

                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getAppointmentStatusBadgeStyle(
                            rental.status
                          )}`}
                        >
                          Status: {formatAppointmentStatus(rental.status)}
                        </span>
                      </div>

                      <span className="sm:hidden px-2.5 py-1.5 rounded-lg bg-accent text-foreground group-hover:bg-[#D99722] group-hover:text-white transition-all text-xs font-semibold flex items-center gap-1 shadow-2xs whitespace-nowrap">
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>

                  <div className="hidden sm:flex shrink-0 items-center justify-end self-center">
                    <span className="px-3 py-2 rounded-xl bg-accent text-foreground group-hover:bg-[#D99722] group-hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
                      <span>View Rental</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border/70 rounded-2xl p-8 text-center space-y-3">
              <Armchair className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="font-bold text-base text-foreground">No Workspace Bookings Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                List your available styling chairs or booths so freelance professionals can discover and rent your salon workspaces.
              </p>
              <Link
                href={routes.workspaces}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D99722] hover:bg-[#C2841B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <span>Manage Workspaces</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Monthly Appointments Growth Chart */}
      <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#D99722]" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Monthly Appointments Growth
              </h2>
            </div>
            <p className="text-xs text-muted-foreground font-normal">
              Overview of your appointment trends throughout the year
            </p>
          </div>
        </div>

        {isOverviewLoading ? (
          <div className="h-64 w-full pt-4">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        ) : (
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 28, right: 10, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#A1A1AA", fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#A1A1AA", fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#27272A] text-white border border-zinc-700 text-xs px-3 py-2 rounded-xl shadow-xl space-y-0.5 z-50">
                          <p className="font-bold text-white">{data.month}</p>
                          <p className="text-[#D99722] font-semibold">
                            {data.count} {data.count === 1 ? "appointment" : "appointments"}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  <LabelList
                    dataKey="count"
                    position="top"
                    formatter={(val: any) => (Number(val) > 0 ? val : "")}
                    style={{
                      fill: "#D99722",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  />
                  {chartData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.count > 0 ? "#D99722" : "rgba(161, 161, 170, 0.16)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
