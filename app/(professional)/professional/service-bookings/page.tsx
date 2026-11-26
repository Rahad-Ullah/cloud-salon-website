"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Eye,
  MessageSquare,
  X,
  Clock,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building2,
  CreditCard,
  FileText,
  Scissors,
  Armchair,
} from "lucide-react";
import {
  useGetMyAppointmentQuery,
  useGetSingleAppointmentQuery,
  useUpdateStatusMutation,
} from "@/features/appointment/appointmentApi";
import { useCreateChatMutation } from "@/features/chat/chatApi";
import { formatAppointmentStatus, getAppointmentStatusBadgeStyle } from "@/utils/appointment";

type TabType =
  | "All"
  | "Pending"
  | "Confirmed"
  | "Active"
  | "Completed"
  | "Cancelled"
  | "Auto Cancelled"
  | "Rejected";

const BOOKING_TABS: TabType[] = [
  "All",
  "Pending",
  "Confirmed",
  "Active",
  "Completed",
  "Cancelled",
  "Auto Cancelled",
  "Rejected",
];

function parseTabParam(raw: string | null): TabType {
  if (!raw) return "All";
  const normalized = raw.toLowerCase().replace(/[_-]/g, " ").trim();
  if (normalized === "pending") return "Pending";
  if (normalized === "confirmed") return "Confirmed";
  if (normalized === "active" || normalized === "in progress") return "Active";
  if (normalized === "completed") return "Completed";
  if (normalized === "cancelled") return "Cancelled";
  if (normalized === "auto cancelled" || normalized === "autocancelled") return "Auto Cancelled";
  if (normalized === "rejected") return "Rejected";
  return "All";
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

function formatPhone(phone: any): string | null {
  if (!phone) return null;
  if (typeof phone === "string") return phone.trim() || null;
  if (typeof phone === "object") {
    const code = phone.countryCode ? `${phone.countryCode} ` : "";
    const num = phone.number || "";
    const combined = `${code}${num}`.trim();
    return combined || null;
  }
  return null;
}

function formatAddress(address: any): string | null {
  if (!address) return null;
  if (typeof address === "string") return address.trim() || null;
  if (typeof address === "object") {
    const parts = [address.line1, address.line2, address.city, address.state, address.postalCode, address.country]
      .filter((p) => typeof p === "string" && p.trim().length > 0);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
}

function ProfessionalBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(() => parseTabParam(searchParams.get("tab")));

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(parseTabParam(tabParam));
    }
  }, [searchParams]);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [messagingCustomerId, setMessagingCustomerId] = useState<string | null>(null);
  const [confirmActionModal, setConfirmActionModal] = useState<{
    isOpen: boolean;
    appointmentId: string | null;
    appointmentUid?: string;
    customerName?: string;
    serviceName?: string;
    newStatus: "confirmed" | "cancelled" | null;
  }>({
    isOpen: false,
    appointmentId: null,
    newStatus: null,
  });

  const { data: response, isLoading, isError, refetch, isFetching } = useGetMyAppointmentQuery(undefined);
  const {
    data: singleAppointmentRes,
    isFetching: isSingleFetching,
  } = useGetSingleAppointmentQuery(selectedAppointment?._id, {
    skip: !selectedAppointment?._id,
  });
  const [updateStatus] = useUpdateStatusMutation();
  const [createChat] = useCreateChatMutation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedAppointment) {
        setSelectedAppointment(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAppointment]);

  const appointments = response?.data || [];
  const activeDetail = singleAppointmentRes?.data
    ? { ...selectedAppointment, ...singleAppointmentRes.data }
    : selectedAppointment;

  const matchesTab = (booking: any, tab: TabType) => {
    if (tab === "All") return true;
    const st = (booking.status || "pending").toLowerCase().trim();
    if (tab === "Active") {
      return st === "active" || st === "in_progress";
    }
    if (tab === "Auto Cancelled") {
      return st === "auto_cancelled" || st === "autocancelled" || st === "auto cancelled";
    }
    return st === tab.toLowerCase();
  };

  const isNegativeTab = (tab: TabType) =>
    tab === "Cancelled" || tab === "Auto Cancelled" || tab === "Rejected";

  // Filter bookings based on activeTab
  const filteredBookings = appointments.filter((booking: any) => matchesTab(booking, activeTab));

  const handleStatusChange = async (id: string, newStatus: "confirmed" | "cancelled") => {
    try {
      setUpdatingId(id);
      await updateStatus({
        id,
        data: { status: newStatus },
      }).unwrap();
      toast.success(`Appointment status updated to ${newStatus}!`);
      if (selectedAppointment && selectedAppointment._id === id) {
        setSelectedAppointment((prev: any) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      console.error("Failed to update status:", err);
      const errMsg = err?.data?.message || err?.message || "Failed to update appointment status.";
      toast.error(errMsg);
    } finally {
      setUpdatingId(null);
    }
  };

  const openConfirmModal = (booking: any, targetStatus: "confirmed" | "cancelled") => {
    const customerName = booking.customer
      ? `${booking.customer.firstName || ""} ${booking.customer.lastName || ""}`.trim() || booking.customer.email
      : "Customer";
    const serviceName = Array.isArray(booking.services) && booking.services.length > 0
      ? booking.services.map((s: any) => s.name).join(", ")
      : "Service";

    setConfirmActionModal({
      isOpen: true,
      appointmentId: booking._id,
      appointmentUid: booking.uid || booking._id?.slice(-6),
      customerName,
      serviceName,
      newStatus: targetStatus,
    });
  };

  const executeConfirmedStatusChange = async () => {
    if (!confirmActionModal.appointmentId || !confirmActionModal.newStatus) return;
    const { appointmentId, newStatus } = confirmActionModal;
    await handleStatusChange(appointmentId, newStatus);
    setConfirmActionModal({
      isOpen: false,
      appointmentId: null,
      newStatus: null,
    });
  };

  const handleMessageCustomer = async (customer: any) => {
    const customerId = typeof customer === "object" ? customer?._id : customer;
    if (!customerId) {
      toast.error("Customer information is unavailable for messaging.");
      return;
    }

    try {
      setMessagingCustomerId(customerId);
      toast.info("Connecting with customer...");
      const res = await createChat({
        participants: [customerId],
      }).unwrap();

      const createdChatId = res?.data?._id || res?._id || customerId;
      toast.success("Chat ready! Redirecting to messages...");
      router.push(`/professional/messages?chatId=${createdChatId}`);
    } catch (err: any) {
      console.error("Failed to create chat:", err);
      // Fallback redirect with customerId so the messages page can open the conversation
      router.push(`/professional/messages?chatId=${customerId}`);
    } finally {
      setMessagingCustomerId(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        timeZone: "UTC",
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-extrabold text-3xl sm:text-4xl text-foreground tracking-tight">
            Bookings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-normal tracking-wide">
            Manage client appointments and update booking statuses
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-border flex items-center gap-6 sm:gap-7 text-sm overflow-x-auto">
        {BOOKING_TABS.map((tab) => {
          const isActive = activeTab === tab;
          const isNegative = isNegativeTab(tab);
          const count = appointments.filter((b: any) => matchesTab(b, tab)).length;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`pb-2.5 font-medium transition-all cursor-pointer whitespace-nowrap relative flex items-center gap-2 ${
                isActive
                  ? isNegative
                    ? "text-destructive"
                    : "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{tab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive
                    ? isNegative
                      ? "bg-destructive/15 text-destructive"
                      : "bg-primary/15 text-primary"
                    : "bg-accent text-muted-foreground"
                }`}
              >
                {count}
              </span>
              {isActive && (
                <span
                  className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
                    isNegative ? "bg-destructive" : "bg-primary"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Bookings Table Card Container */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div className="lg:min-w-[960px]">
            {/* Table Header (Desktop) */}
            <div className="bg-accent/60 px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border hidden lg:grid lg:grid-cols-[1.7fr_1.4fr_1.6fr_0.8fr_0.7fr_1.2fr_1fr_1.5fr] items-center gap-3">
              <div>CLIENT</div>
              <div>SERVICE</div>
              <div>DATE &amp; TIME</div>
              <div>DURATION</div>
              <div>PRICE</div>
              <div>BOOKING STATUS</div>
              <div>PAYMENT</div>
              <div className="text-right">ACTIONS</div>
            </div>

            {/* Loading Skeleton Rows inside Table */}
            {isLoading ? (
              <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="p-4 sm:p-5 flex flex-col lg:grid lg:grid-cols-[1.7fr_1.4fr_1.6fr_0.8fr_0.7fr_1.2fr_1fr_1.5fr] items-start lg:items-center gap-3 animate-pulse"
                  >
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                      <div className="w-9 h-9 rounded-full bg-muted/70 dark:bg-zinc-800/70 shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 bg-muted/70 dark:bg-zinc-800/70 rounded w-24" />
                        <div className="h-2.5 bg-muted/50 dark:bg-zinc-800/50 rounded w-14" />
                      </div>
                    </div>
                    <div>
                      <div className="h-3.5 bg-muted/70 dark:bg-zinc-800/70 rounded w-24" />
                    </div>
                    <div>
                      <div className="h-3.5 bg-muted/70 dark:bg-zinc-800/70 rounded w-28" />
                    </div>
                    <div>
                      <div className="h-3.5 bg-muted/70 dark:bg-zinc-800/70 rounded w-12" />
                    </div>
                    <div>
                      <div className="h-3.5 bg-muted/70 dark:bg-zinc-800/70 rounded w-14" />
                    </div>
                    <div>
                      <div className="h-6 bg-muted/70 dark:bg-zinc-800/70 rounded-full w-24" />
                    </div>
                    <div>
                      <div className="h-6 bg-muted/70 dark:bg-zinc-800/70 rounded-full w-16" />
                    </div>
                    <div className="flex items-center justify-end gap-2 w-full lg:w-auto">
                      <div className="h-8 bg-muted/70 dark:bg-zinc-800/70 rounded-lg w-8" />
                      <div className="h-8 bg-muted/70 dark:bg-zinc-800/70 rounded-lg w-8" />
                      <div className="h-8 bg-muted/70 dark:bg-zinc-800/70 rounded-lg w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="p-12 text-center text-muted-foreground text-sm space-y-3">
                <p className="text-destructive font-semibold">Failed to load appointments.</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            ) : (
              /* Table Rows List */
              <div className="divide-y divide-border">
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking: any) => {
                    const customerName = booking.customer
                      ? `${booking.customer.firstName || ""} ${booking.customer.lastName || ""}`.trim() || booking.customer.email
                      : "Customer";
                    const customerAvatar = booking.customer?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
                    const serviceName = Array.isArray(booking.services) && booking.services.length > 0
                      ? booking.services.map((s: any) => s.name).join(", ")
                      : "General Service";
                    const statusNormalized = (booking.status || "pending").toLowerCase();
                    const isItemUpdating = updatingId === booking._id;
                    const customerId = booking.customer?._id || booking.customer;
                    const isMessagingThis = messagingCustomerId === customerId;

                    return (
                      <div
                        key={booking._id}
                        className="px-6 py-4 grid grid-cols-1 lg:grid-cols-[1.7fr_1.4fr_1.6fr_0.8fr_0.7fr_1.2fr_1fr_1.5fr] items-center gap-3 text-sm hover:bg-accent/40 transition-colors"
                      >
                        {/* Client Info */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-accent shrink-0 border border-border">
                            <Image
                              src={customerAvatar}
                              alt={customerName}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground text-sm truncate">
                              {customerName}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono truncate">
                              {booking.uid || booking._id?.slice(-6)}
                            </span>
                          </div>
                        </div>

                        {/* Service */}
                        <div className="text-foreground font-medium text-xs sm:text-sm min-w-0">
                          <span className="lg:hidden text-xs text-muted-foreground block font-normal">
                            Service:
                          </span>
                          <span className="line-clamp-2">{serviceName}</span>
                        </div>

                        {/* Date & Time */}
                        <div className="text-muted-foreground text-xs sm:text-sm">
                          <span className="lg:hidden text-xs text-muted-foreground block font-normal">
                            Date &amp; Time:
                          </span>
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{formatDate(booking.startsAt || booking.scheduledAt)}</span>
                          </span>
                        </div>

                        {/* Duration */}
                        <div className="text-muted-foreground text-xs sm:text-sm">
                          <span className="lg:hidden text-xs text-muted-foreground block font-normal">
                            Duration:
                          </span>
                          {booking.totalDurationInMinutes || 30} min
                        </div>

                        {/* Price */}
                        <div className="font-bold text-foreground text-sm sm:text-base">
                          <span className="lg:hidden text-xs text-muted-foreground block font-sans font-normal">
                            Price:
                          </span>
                          ${booking.pricing?.total ?? booking.pricing?.subtotal ?? 0}
                        </div>

                        {/* Booking Status Column */}
                        <div>
                          <span className="lg:hidden text-xs text-muted-foreground block font-normal mb-1">
                            Booking Status:
                          </span>
                          <span
                            className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${getAppointmentStatusBadgeStyle(
                              booking.status
                            )}`}
                          >
                            {formatAppointmentStatus(booking.status)}
                          </span>
                        </div>

                        {/* Payment Status Column */}
                        <div>
                          <span className="lg:hidden text-xs text-muted-foreground block font-normal mb-1">
                            Payment:
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize whitespace-nowrap ${getPaymentBadgeStyle(
                              booking.paymentStatus
                            )}`}
                          >
                            {(booking.paymentStatus || "unpaid").toLowerCase() === "paid" ? (
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                            ) : (
                              <AlertCircle className="w-3 h-3 shrink-0" />
                            )}
                            {booking.paymentStatus || "unpaid"}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="lg:text-right flex flex-wrap lg:justify-end items-center gap-1.5 pt-1 lg:pt-0">
                          {/* Eye Details Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedAppointment(booking)}
                            title="View Details"
                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-accent text-foreground transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Message Customer Icon Button */}
                          <button
                            type="button"
                            onClick={() => handleMessageCustomer(booking.customer)}
                            disabled={isMessagingThis}
                            title="Message Customer"
                            className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isMessagingThis ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MessageSquare className="w-4 h-4" />
                            )}
                          </button>

                          {/* Action Buttons */}
                          {statusNormalized === "pending" && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openConfirmModal(booking, "confirmed")}
                                disabled={isItemUpdating}
                                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                {isItemUpdating ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                <span>Confirm</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openConfirmModal(booking, "cancelled")}
                                disabled={isItemUpdating}
                                className="px-2 py-1 rounded-md text-xs font-semibold border border-destructive/30 text-destructive hover:bg-destructive/10 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                              </button>
                            </div>
                          )}

                          {statusNormalized === "confirmed" && (
                            <button
                              type="button"
                              onClick={() => openConfirmModal(booking, "cancelled")}
                              disabled={isItemUpdating}
                              className="px-2 py-1 rounded-md text-xs font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isItemUpdating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-16 text-center text-muted-foreground text-sm italic">
                    {activeTab === "All"
                      ? "No bookings found."
                      : `No ${activeTab.toLowerCase()} bookings found.`}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {selectedAppointment && activeDetail && (() => {
        const customer = activeDetail.customer || {};
        const customerName = customer
          ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.email || "Customer"
          : "Customer";
        const customerPhone = formatPhone(customer.phone);
        const customerAddress = formatAddress(customer.address);

        const salon = typeof activeDetail.salon === "object" ? activeDetail.salon : null;
        const salonAddress = formatAddress(salon?.address) || salon?.location || null;
        const salonPhone = formatPhone(salon?.phone);

        const chair = typeof activeDetail.chair === "object" ? activeDetail.chair : null;
        const servicesList = Array.isArray(activeDetail.services) ? activeDetail.services : [];
        const calculatedSubtotal = servicesList.reduce(
          (sum: number, s: any) => sum + (Number(s.priceInUSD ?? s.price) || 0),
          0
        );
        const totalDuration =
          activeDetail.totalDurationInMinutes ||
          servicesList.reduce((sum: number, s: any) => sum + (Number(s.durationInMinutes) || 0), 0) ||
          30;
        const startTimeStr = activeDetail.startsAt || activeDetail.scheduledAt;
        const endTimeStr =
          activeDetail.endsAt ||
          (startTimeStr
            ? new Date(new Date(startTimeStr).getTime() + totalDuration * 60 * 1000).toISOString()
            : undefined);
        const transactionRef =
          typeof activeDetail.transaction === "object"
            ? activeDetail.transaction?.uid || activeDetail.transaction?.transactionId || activeDetail.transaction?._id
            : activeDetail.transaction || activeDetail.paymentIntentId || activeDetail.stripeSessionId;
        const cancellationReason = activeDetail.cancellationReason || activeDetail.cancelReason || activeDetail.rejectionReason;
        const statusLower = (activeDetail.status || "pending").toLowerCase();

        return (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setSelectedAppointment(null)}
          >
            <div
              className="bg-card border border-border rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sticky Modal Header */}
              <div className="bg-accent/80 px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base sm:text-lg text-foreground">
                        Appointment Details
                      </h3>
                      {isSingleFetching && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Ref: {activeDetail.uid || activeDetail._id}
                      {activeDetail.createdAt ? ` · Booked ${formatDate(activeDetail.createdAt)}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="p-6 sm:p-7 space-y-6 overflow-y-auto flex-1">
                {/* Status, Payment & Transaction Strip */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-accent/50 border border-border flex-wrap gap-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Booking Status:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getAppointmentStatusBadgeStyle(
                          activeDetail.status
                        )}`}
                      >
                        {formatAppointmentStatus(activeDetail.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Payment Status:</span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${getPaymentBadgeStyle(
                          activeDetail.paymentStatus
                        )}`}
                      >
                        {(activeDetail.paymentStatus || "unpaid").toLowerCase() === "paid" ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        {activeDetail.paymentStatus || "unpaid"}
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

                {/* Two-Column Info Grid: Client Info + Schedule & Salon */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left: Client Info */}
                  <div className="p-4 rounded-xl bg-accent/30 border border-border/70 space-y-3">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Client Information
                    </p>
                    <div className="flex items-start gap-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-accent border border-border shrink-0">
                        <Image
                          src={
                            customer.image ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                          }
                          alt={customerName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-bold text-sm text-foreground truncate">{customerName}</p>
                        {customer.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{customer.email}</span>
                          </p>
                        )}
                        {customerPhone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{customerPhone}</span>
                          </p>
                        )}
                        {customerAddress && (
                          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span>{customerAddress}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Schedule & Location */}
                  <div className="p-4 rounded-xl bg-accent/30 border border-border/70 space-y-3">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Schedule &amp; Timing
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">Start: </span>
                          <span className="font-semibold text-foreground">{formatDate(startTimeStr)}</span>
                        </div>
                      </div>
                      {endTimeStr && (
                        <div className="flex items-start gap-2">
                          <Clock className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <span className="text-muted-foreground">End: </span>
                            <span className="font-semibold text-foreground">{formatDate(endTimeStr)}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div>
                          <span className="text-muted-foreground">Total Duration: </span>
                          <span className="font-bold text-foreground">{totalDuration} minutes</span>
                        </div>
                      </div>
                      {chair?.name && (
                        <div className="flex items-center gap-2">
                          <Armchair className="w-3.5 h-3.5 text-primary shrink-0" />
                          <div>
                            <span className="text-muted-foreground">Workspace: </span>
                            <span className="font-semibold text-foreground">{chair.name}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Salon Info (when available) */}
                {salon && (
                  <div className="p-4 rounded-xl bg-accent/30 border border-border/70 space-y-2.5">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Salon Location
                    </p>
                    <div className="flex items-start gap-3">
                      {salon.logo ? (
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-accent border border-border shrink-0">
                          <Image
                            src={salon.logo}
                            alt={salon.name || "Salon"}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-foreground">{salon.name || "Salon"}</p>
                          {salon.businessType && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-accent text-muted-foreground">
                              {salon.businessType}
                            </span>
                          )}
                        </div>
                        {salonAddress && (
                          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span>{salonAddress}</span>
                          </p>
                        )}
                        {salonPhone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{salonPhone}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Booked Services Breakdown */}
                <div className="space-y-2.5">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-primary" />
                    <span>Booked Services ({servicesList.length})</span>
                  </p>
                  {servicesList.length > 0 ? (
                    <div className="space-y-2">
                      {servicesList.map((s: any, idx: number) => (
                        <div
                          key={s._id || idx}
                          className="text-xs flex items-start justify-between gap-4 p-3.5 rounded-xl bg-accent/40 border border-border/60"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-foreground">{s.name || "Service"}</span>
                              {s.durationInMinutes && (
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-accent text-muted-foreground font-medium">
                                  {s.durationInMinutes} min
                                </span>
                              )}
                              {typeof s.category === "object" && s.category?.name && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold">
                                  {s.category.name}
                                </span>
                              )}
                            </div>
                            {s.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                            )}
                          </div>
                          <span className="font-extrabold text-sm text-foreground shrink-0">
                            ${s.priceInUSD ?? s.price ?? 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No service details attached.</p>
                  )}
                </div>

                {/* Client Notes & Cancellation Reason */}
                {(activeDetail.notes || cancellationReason) && (
                  <div className="grid grid-cols-1 gap-3">
                    {activeDetail.notes && (
                      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                        <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Client Notes</span>
                        </p>
                        <p className="text-xs text-foreground leading-relaxed italic">
                          &quot;{activeDetail.notes}&quot;
                        </p>
                      </div>
                    )}
                    {cancellationReason && (
                      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-1">
                        <p className="text-[11px] font-bold text-destructive uppercase tracking-wider">
                          Cancellation / Status Reason
                        </p>
                        <p className="text-xs text-foreground leading-relaxed">
                          {cancellationReason}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pricing & Payment Summary */}
                <div className="p-4 rounded-xl bg-accent/40 border border-border/70 space-y-2 text-xs">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pb-1">
                    Payment &amp; Pricing Summary
                  </p>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-semibold text-foreground">
                      ${activeDetail.pricing?.subtotal ?? calculatedSubtotal}
                    </span>
                  </div>
                  {Number(activeDetail.pricing?.discount) > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Discount</span>
                      <span className="font-semibold">-${activeDetail.pricing.discount}</span>
                    </div>
                  )}
                  {(activeDetail.pricing?.platformFee !== undefined ||
                    activeDetail.pricing?.serviceFee !== undefined) && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Platform Fee</span>
                      <span className="font-semibold text-foreground">
                        ${activeDetail.pricing?.platformFee ?? activeDetail.pricing?.serviceFee}
                      </span>
                    </div>
                  )}
                  {activeDetail.pricing?.tax !== undefined && Number(activeDetail.pricing.tax) > 0 && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Tax</span>
                      <span className="font-semibold text-foreground">${activeDetail.pricing.tax}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between font-bold text-base text-foreground pt-2 border-t border-border">
                    <span>Total Amount</span>
                    <span className="text-primary">
                      ${activeDetail.pricing?.total ?? activeDetail.pricing?.subtotal ?? calculatedSubtotal} USD
                    </span>
                  </div>
                  {activeDetail.updatedAt && (
                    <p className="text-[11px] text-muted-foreground pt-1 text-right">
                      Last updated: {formatDate(activeDetail.updatedAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Sticky Modal Footer Actions */}
              <div className="bg-accent/60 px-6 py-4 border-t border-border flex flex-wrap items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleMessageCustomer(activeDetail.customer)}
                  disabled={messagingCustomerId === (activeDetail.customer?._id || activeDetail.customer)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {messagingCustomerId === (activeDetail.customer?._id || activeDetail.customer) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  <span>Message Customer</span>
                </button>

                <div className="flex items-center gap-2">
                  {statusLower === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => openConfirmModal(activeDetail, "confirmed")}
                        disabled={updatingId === activeDetail._id}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {updatingId === activeDetail._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>Confirm</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openConfirmModal(activeDetail, "cancelled")}
                        disabled={updatingId === activeDetail._id}
                        className="px-3 py-2 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </>
                  )}

                  {statusLower === "confirmed" && (
                    <button
                      type="button"
                      onClick={() => openConfirmModal(activeDetail, "cancelled")}
                      disabled={updatingId === activeDetail._id}
                      className="px-3.5 py-2 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {updatingId === activeDetail._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span>Cancel</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedAppointment(null)}
                    className="px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CONFIRMATION ACTION MODAL */}
      {confirmActionModal.isOpen && (
        <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4 text-center">
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center border ${
                confirmActionModal.newStatus === "confirmed"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }`}>
                {confirmActionModal.newStatus === "confirmed" ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-xl text-foreground">
                  {confirmActionModal.newStatus === "confirmed"
                    ? "Confirm Appointment?"
                    : "Cancel Appointment?"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {confirmActionModal.newStatus === "confirmed"
                    ? "Are you sure you want to confirm the appointment for "
                    : "Are you sure you want to cancel the appointment for "}
                  <span className="font-semibold text-foreground">{confirmActionModal.customerName}</span>?
                </p>
              </div>

              <div className="bg-accent/60 border border-border rounded-xl p-3 text-left space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Booking ID:</span>
                  <span className="font-mono font-bold text-foreground">{confirmActionModal.appointmentUid}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Service:</span>
                  <span className="font-medium text-foreground truncate max-w-[200px]">{confirmActionModal.serviceName}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmActionModal({ isOpen: false, appointmentId: null, newStatus: null })}
                  disabled={updatingId === confirmActionModal.appointmentId}
                  className="flex-1 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-xs font-semibold text-foreground transition-colors cursor-pointer disabled:opacity-50"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={executeConfirmedStatusChange}
                  disabled={updatingId === confirmActionModal.appointmentId}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50 ${
                    confirmActionModal.newStatus === "confirmed"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-destructive hover:bg-destructive/90"
                  }`}
                >
                  {updatingId === confirmActionModal.appointmentId ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>
                      Yes, {confirmActionModal.newStatus === "confirmed" ? "Confirm" : "Cancel"}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      {response?.pagination && response.pagination.totalPage > 1 && (
        <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-muted-foreground font-medium">
            Page {currentPage} of {response.pagination.totalPage}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, response.pagination.totalPage))}
            disabled={currentPage === response.pagination.totalPage}
            className="px-3 py-1.5 text-primary hover:underline font-medium transition-colors cursor-pointer disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProfessionalBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-muted-foreground">
          Loading bookings...
        </div>
      }
    >
      <ProfessionalBookingsContent />
    </Suspense>
  );
}


