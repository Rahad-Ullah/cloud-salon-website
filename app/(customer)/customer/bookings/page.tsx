"use client";

import { useState, useEffect, Suspense } from "react";
import ChairImage from "@/components/shared/ChairImage";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Loader2,
  Eye,
  X,
  MapPin,
  Calendar,
  Ban,
  ExternalLink,
} from "lucide-react";
import {
  useGetMyAppointmentQuery,
  useGetSingleAppointmentQuery,
  useUpdateStatusMutation,
} from "@/features/appointment/appointmentApi";
import { useCreateChatMutation } from "@/features/chat/chatApi";
import { formatAppointmentStatus, getAppointmentStatusBadgeStyle } from "@/utils/appointment";
import { AppointmentStatus } from "@/types";

function CustomerBookingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">(
    tabParam === "past" ? "past" : "upcoming"
  );
  const [messagingProId, setMessagingProId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const { data: appointmentsRes, isLoading } = useGetMyAppointmentQuery(undefined);
  const [createChat] = useCreateChatMutation();
  const [updateStatus] = useUpdateStatusMutation();

  const {
    data: singleAppointmentRes,
    isLoading: isSingleLoading,
  } = useGetSingleAppointmentQuery(selectedBookingId, {
    skip: !selectedBookingId,
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "past" || tab === "upcoming") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment") || searchParams.get("status");
    const sessionId = searchParams.get("session_id");
    if (paymentStatus === "success" || sessionId || searchParams.get("success") === "true") {
      toast.success("Payment completed successfully! Your booking is confirmed.");
    }
  }, [searchParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedBookingId) {
        setSelectedBookingId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBookingId]);

  const rawAppointments = Array.isArray(appointmentsRes?.data) ? appointmentsRes.data : [];

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

  const formattedBookings = rawAppointments.map((item: any) => {
    const pro = item.professional || {};
    const salon = item.salon || {};
    const firstName = pro.firstName || pro.user?.firstName || "";
    const lastName = pro.lastName || pro.user?.lastName || "";
    const proName = `${firstName} ${lastName}`.trim() || salon.name || "Professional Specialist";

    const serviceNames = Array.isArray(item.services) && item.services.length > 0
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

    const proUserId =
      pro.user?._id ||
      pro.userId ||
      (typeof pro.user === "string" ? pro.user : null) ||
      (typeof pro === "object" ? pro._id : null) ||
      (typeof item.professional === "string" ? item.professional : null);

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
      proId: pro._id || (typeof item.professional === "string" ? item.professional : null),
      proUserId,
      rawItem: item,
      startsAtDate,
    };
  });

  const handleMessageProfessional = async (booking: any) => {
    const targetUserId = booking.proUserId || booking.proId;
    if (!targetUserId) {
      toast.error("Specialist contact information is unavailable for messaging.");
      return;
    }

    try {
      setMessagingProId(booking.id || targetUserId);
      const res = await createChat({
        participants: [targetUserId],
      }).unwrap();

      const createdChatId = res?.data?._id || res?._id || targetUserId;
      router.push(`/customer/messages?chatId=${createdChatId}`);
    } catch (err: any) {
      console.error("Failed to create chat:", err);
      router.push(`/customer/messages?chatId=${targetUserId}`);
    } finally {
      setMessagingProId(null);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      setIsCancelling(true);
      await updateStatus({
        id: appointmentId,
        data: { status: "cancelled" },
      }).unwrap();
      toast.success("Appointment cancelled successfully.");
      setSelectedBookingId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to cancel appointment.");
    } finally {
      setIsCancelling(false);
    }
  };

  const fallbackAppointment = rawAppointments.find(
    (item: any) => (item._id || item.uid) === selectedBookingId
  );
  const activeDetail = singleAppointmentRes?.data || fallbackAppointment;

  const modalPro = activeDetail?.professional || {};
  const modalProUser = typeof modalPro.user === "object" ? modalPro.user : {};
  const modalFirstName = modalPro.firstName || modalProUser.firstName || "";
  const modalLastName = modalPro.lastName || modalProUser.lastName || "";
  const modalProName =
    `${modalFirstName} ${modalLastName}`.trim() ||
    activeDetail?.salon?.name ||
    "Professional Specialist";
  const modalProImage =
    modalPro.image ||
    modalProUser.image ||
    activeDetail?.salon?.logo ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";
  const modalProId =
    modalPro._id ||
    (typeof activeDetail?.professional === "string" ? activeDetail.professional : null);
  const modalProUserId =
    modalProUser._id ||
    modalPro.userId ||
    (typeof modalPro.user === "string" ? modalPro.user : null) ||
    modalProId;
  const modalSalon = activeDetail?.salon || {};
  const modalSalonName = modalSalon.name || "";
  const modalSalonAddress = modalSalon.address?.line1
    ? `${modalSalon.address.line1}, ${modalSalon.address.city || ""}`
    : modalSalon.location || modalSalon.address?.city || "";

  const modalServices = Array.isArray(activeDetail?.services) && activeDetail.services.length > 0
    ? activeDetail.services
    : [];

  const modalCalculatedSubtotal = modalServices.reduce(
    (sum: number, s: any) => sum + (Number(s.priceInUSD || s.price) || 0),
    0
  );

  const upcomingBookings = formattedBookings.filter((b: any) => !b.isPast);
  const pastBookings = formattedBookings.filter((b: any) => b.isPast);

  const currentBookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-1">
        <h1 className="font-extrabold text-3xl sm:text-4xl text-foreground tracking-tight">
          My Bookings
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-normal tracking-wide">
          Manage your upcoming appointments and booking history
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-border flex items-center gap-8 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab("upcoming")}
          className={`pb-2.5 font-medium transition-all cursor-pointer relative ${activeTab === "upcoming"
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Upcoming ({upcomingBookings.length})
          {activeTab === "upcoming" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("past")}
          className={`pb-2.5 font-medium transition-all cursor-pointer relative ${activeTab === "past"
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Past ({pastBookings.length})
          {activeTab === "past" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pt-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 animate-pulse h-36"
            />
          ))}
        </div>
      ) : currentBookings.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pt-2">
          {currentBookings.map((booking: any) => (
            <div
              key={booking.id}
              className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-stretch justify-between gap-4 transition-all shadow-2xs hover:border-primary/50"
            >
              <div className="flex flex-col sm:flex-row sm:items-stretch gap-4 flex-1 min-w-0">
                {/* Thumbnail Image: Full-width banner on mobile, side-thumbnail on sm+ */}
                <div className="relative w-full h-44 sm:h-auto sm:self-stretch sm:w-24 lg:w-[104px] rounded-xl overflow-hidden shrink-0 bg-accent border border-border shadow-2xs">
                  <ChairImage
                    src={booking.image}
                    alt={booking.stylistName}
                    size="md"
                    className="object-cover w-full h-full"
                  />
                </div>

                {/* Booking Info */}
                <div className="space-y-1.5 min-w-0 flex-1 flex flex-col justify-between py-0.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base sm:text-lg text-foreground leading-tight truncate">
                        {booking.stylistName}
                      </h3>
                      {booking.salonName && (
                        <span className="text-[10px] font-semibold bg-accent px-2 py-0.5 rounded-md text-muted-foreground truncate max-w-[150px]">
                          {booking.salonName}
                        </span>
                      )}
                    </div>

                    <p className="text-primary font-semibold text-xs sm:text-sm truncate">
                      {booking.service}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{booking.dateTime}</span>
                    </span>

                    <span className="font-bold text-primary text-sm">
                      {booking.price}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize shrink-0 ${
                        booking.paymentStatus === "paid"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {booking.paymentStatus === "paid" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      Payment: {booking.paymentStatus}
                    </span>

                    <span
                      className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${getAppointmentStatusBadgeStyle(
                        booking.status
                      )}`}
                    >
                      Status: {formatAppointmentStatus(booking.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Vertical stack on mobile and xl, row on sm and 2xl */}
              <div className="sm:self-center shrink-0 flex flex-col sm:flex-row xl:flex-col 2xl:flex-row items-stretch sm:items-center xl:items-stretch 2xl:items-center gap-2 w-full sm:w-auto xl:w-36 2xl:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                {/* View Details Button */}
                <button
                  type="button"
                  onClick={() => setSelectedBookingId(booking.id)}
                  title="View full booking details"
                  className="w-full sm:w-auto xl:w-full 2xl:w-auto px-4 py-2.5 rounded-xl bg-accent hover:bg-accent/80 border border-border text-foreground transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold shadow-2xs active:scale-95 group"
                >
                  <Eye className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  <span>View Details</span>
                </button>

                {/* Message Professional Button (Only when payment is paid) */}
                {booking.paymentStatus?.toLowerCase() === "paid" && (
                  <button
                    type="button"
                    onClick={() => handleMessageProfessional(booking)}
                    disabled={
                      messagingProId ===
                      (booking.id || booking.proUserId || booking.proId)
                    }
                    title={`Message ${booking.stylistName}`}
                    className="w-full sm:w-auto xl:w-full 2xl:w-auto px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold shadow-xs disabled:opacity-50 active:scale-95 group"
                  >
                    {messagingProId ===
                    (booking.id || booking.proUserId || booking.proId) ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                    )}
                    <span>Message</span>
                  </button>
                )}

                <Link
                  href={
                    booking.proId
                      ? `/professionals/${booking.proId}`
                      : "/discover"
                  }
                  className="w-full sm:w-auto xl:w-full 2xl:w-auto text-center px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors shadow-xs whitespace-nowrap"
                >
                  {activeTab === "upcoming"
                    ? "View Specialist"
                    : "Re-Book Service"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-accent/60 border border-border rounded-2xl p-12 text-center text-muted-foreground space-y-3">
          <p className="text-lg font-bold text-foreground">No {activeTab} bookings found</p>
          <p className="text-xs max-w-sm mx-auto">
            You don't have any {activeTab} appointment bookings at the moment. Browse top rated specialists to book your next service.
          </p>
          <Link
            href="/professionals"
            className="inline-block px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs transition-colors"
          >
            Explore & Book Now
          </Link>
        </div>
      )}

      {/* =========================================================================
          BOOKING VIEW DETAILS MODAL
      ========================================================================= */}
      {selectedBookingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] text-card-foreground">
            {/* Modal Header */}
            <div className="bg-accent/80 px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground leading-tight">
                    Booking Details
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Ref: {activeDetail?.uid || activeDetail?._id || selectedBookingId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingId(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {isSingleLoading && !activeDetail ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  <p className="text-xs">Loading booking information...</p>
                </div>
              ) : (
                <>
                  {/* Status & Payment Row */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-accent/40 border border-border/70 flex-wrap gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground font-medium">Status:</span>
                      <span
                        className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${getAppointmentStatusBadgeStyle(
                          activeDetail?.status
                        )}`}
                      >
                        {formatAppointmentStatus(activeDetail?.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground font-medium">Payment:</span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          activeDetail?.paymentStatus?.toLowerCase() === "paid"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {activeDetail?.paymentStatus?.toLowerCase() === "paid" ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        {activeDetail?.paymentStatus || "Unpaid"}
                      </span>
                    </div>
                  </div>

                  {/* Specialist & Salon Section */}
                  <div className="space-y-2 border-b border-border/70 pb-4">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Specialist &amp; Salon
                    </p>
                    <div className="flex items-center gap-3.5 p-3 rounded-xl bg-accent/30 border border-border/50">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-accent border border-border shrink-0">
                        <ChairImage
                          src={modalProImage}
                          alt={modalProName}
                          size="md"
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base text-foreground truncate">
                            {modalProName}
                          </h4>
                          {modalSalonName && (
                            <span className="text-[10px] font-semibold bg-accent px-2 py-0.5 rounded-md text-muted-foreground">
                              {modalSalonName}
                            </span>
                          )}
                        </div>

                        {modalSalonAddress && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{modalSalonAddress}</span>
                          </p>
                        )}
                      </div>

                      {modalProId && (
                        <Link
                          href={`/professionals/${modalProId}`}
                          className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-xs font-semibold text-foreground transition-colors shrink-0 hidden sm:inline-flex items-center gap-1"
                        >
                          <span>Profile</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Date, Time & Schedule */}
                  <div className="space-y-2 border-b border-border/70 pb-4">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Appointment Schedule
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-accent/40 border border-border/50">
                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-muted-foreground text-[10px] uppercase font-semibold">Date &amp; Time</p>
                          <p className="font-bold text-foreground">
                            {formatDateTime(activeDetail?.startsAt || activeDetail?.scheduledAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-accent/40 border border-border/50">
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-muted-foreground text-[10px] uppercase font-semibold">Duration</p>
                          <p className="font-bold text-foreground">
                            {activeDetail?.totalDurationInMinutes
                              ? `${activeDetail.totalDurationInMinutes} minutes`
                              : "Flexible Duration"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booked Services */}
                  <div className="space-y-2 border-b border-border/70 pb-4">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Selected Services ({modalServices.length})
                    </p>
                    <div className="space-y-2">
                      {modalServices.length > 0 ? (
                        modalServices.map((service: any, idx: number) => (
                          <div
                            key={service._id || idx}
                            className="flex items-center justify-between p-3 rounded-xl bg-accent/30 border border-border/50 text-xs"
                          >
                            <div className="space-y-0.5 min-w-0 pr-3">
                              <p className="font-bold text-foreground truncate">
                                {service.name || "Service Item"}
                              </p>
                              {service.durationInMinutes && (
                                <p className="text-muted-foreground text-[11px]">
                                  {service.durationInMinutes} mins
                                </p>
                              )}
                            </div>
                            <span className="font-extrabold text-foreground shrink-0 text-sm">
                              ${service.priceInUSD ?? service.price ?? 0}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No service item breakdown available.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Customer Notes (if present) */}
                  {activeDetail?.notes && (
                    <div className="space-y-1.5 border-b border-border/70 pb-4">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Special Notes
                      </p>
                      <p className="text-xs text-muted-foreground italic bg-accent/30 p-3 rounded-xl border border-border/50 leading-relaxed">
                        &quot;{activeDetail.notes}&quot;
                      </p>
                    </div>
                  )}

                  {/* Pricing Breakdown */}
                  <div className="space-y-2 pt-1 text-xs">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Payment Breakdown
                    </p>
                    <div className="p-3.5 rounded-xl bg-accent/40 border border-border/60 space-y-2">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-medium text-foreground">
                          ${activeDetail?.pricing?.subtotal ?? modalCalculatedSubtotal}
                        </span>
                      </div>

                      {Number(activeDetail?.pricing?.discount) > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                          <span>Discount</span>
                          <span className="font-medium">-${activeDetail.pricing.discount}</span>
                        </div>
                      )}

                      {(activeDetail?.pricing?.platformFee !== undefined ||
                        activeDetail?.pricing?.serviceFee !== undefined) && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Platform Fee (10%)</span>
                          <span className="font-medium text-foreground">
                            ${activeDetail?.pricing?.platformFee ?? activeDetail?.pricing?.serviceFee ?? 0}
                          </span>
                        </div>
                      )}

                      <div className="border-t border-border pt-2 flex justify-between font-bold text-sm text-foreground">
                        <span>Total Amount</span>
                        <span className="text-primary text-base">
                          ${activeDetail?.pricing?.total ?? activeDetail?.pricing?.subtotal ?? modalCalculatedSubtotal} USD
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-accent/60 px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {/* Left Side: Cancel Appointment Button if Pending/Confirmed */}
              {(activeDetail?.status === "pending" || activeDetail?.status === "confirmed") && (
                <button
                  type="button"
                  onClick={() => handleCancelAppointment(activeDetail._id || selectedBookingId)}
                  disabled={isCancelling}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isCancelling ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Ban className="w-3.5 h-3.5" />
                  )}
                  <span>Cancel Appointment</span>
                </button>
              )}

              {/* Right Side: Message & Close Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end ml-auto">
                {activeDetail?.paymentStatus?.toLowerCase() === "paid" && (
                  <button
                    type="button"
                    onClick={() => {
                      const bookingForMsg = formattedBookings.find((b: any) => b.id === selectedBookingId) || {
                        id: selectedBookingId,
                        proUserId: modalProUserId,
                        proId: modalProId,
                        stylistName: modalProName,
                      };
                      handleMessageProfessional(bookingForMsg);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message Specialist</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedBookingId(null)}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-muted-foreground">
          Loading bookings...
        </div>
      }
    >
      <CustomerBookingsContent />
    </Suspense>
  );
}
