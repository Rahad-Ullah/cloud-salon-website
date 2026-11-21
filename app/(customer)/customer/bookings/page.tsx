"use client";

import { useState, useEffect, Suspense } from "react";
import ChairImage from "@/components/shared/ChairImage";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Clock, CheckCircle2, AlertCircle, MessageSquare, Loader2 } from "lucide-react";
import { useGetMyAppointmentQuery } from "@/features/appointment/appointmentApi";
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

  const { data: appointmentsRes, isLoading } = useGetMyAppointmentQuery(undefined);
  const [createChat] = useCreateChatMutation();

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

    // Extract target professional user ID for chat creation
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
      // Fallback redirect with targetUserId so customer messages page can find or open conversation
      router.push(`/customer/messages?chatId=${targetUserId}`);
    } finally {
      setMessagingProId(null);
    }
  };

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

              {/* Action Buttons: 2 lines vertical on mobile, horizontal on sm+, stacked on xl, side-by-side on 2xl */}
              <div className="sm:self-center shrink-0 flex flex-col sm:flex-row xl:flex-col 2xl:flex-row items-stretch sm:items-center xl:items-stretch 2xl:items-center gap-2 w-full sm:w-auto xl:w-36 2xl:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
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