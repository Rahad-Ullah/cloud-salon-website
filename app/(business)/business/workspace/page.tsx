"use client";

import { useState } from "react";
import Image from "next/image";
import ChairImage from "@/components/shared/ChairImage";
import {
  Loader2,
  AlertCircle,
  Armchair,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  User,
  Phone,
  Mail,
  CreditCard,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetMyRentalsQuery,
  useUpdateChairRentalMutation,
} from "@/features/chairRental/chairRentalApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatAppointmentStatus, getAppointmentStatusBadgeStyle } from "@/utils/appointment";

interface ProfessionalInfo {
  _id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  image?: string;
  phone?: {
    countryCode?: string;
    number?: string;
  } | string;
}

interface SalonInfo {
  _id?: string;
  name?: string;
  logo?: string;
  email?: string;
  phone?: string;
}

interface ChairInfo {
  _id?: string;
  name?: string;
  description?: string;
  photo?: string;
  location?: string;
  pricePerDayInUSD?: number;
  status?: string;
  uid?: string;
}

interface MyRentalItem {
  _id: string;
  chair?: ChairInfo;
  salon?: SalonInfo | string;
  professional?: ProfessionalInfo | string;
  startDate?: string;
  endDate?: string;
  durationInDays?: number;
  pricing?: {
    subtotal?: number;
    discount?: number;
    platformFee?: number;
    serviceFee?: number;
    total?: number;
    currency?: string;
  };
  totalPrice?: number;
  pricePerDayInUSD?: number;
  paymentStatus?: string;
  transaction?: string;
  cancelReason?: string;
  status?: string;
  uid?: string;
  createdAt?: string;
  updatedAt?: string;
}

type RentalTabType = "All" | "Pending" | "Confirmed" | "Completed" | "Cancelled";

const RENTAL_TABS: RentalTabType[] = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

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

export default function BusinessWorkspacePage() {
  const { data: rentalsData, isLoading: isRentalsLoading, isError, error, refetch } =
    useGetMyRentalsQuery({});
  const [updateChairRental, { isLoading: isUpdating }] = useUpdateChairRentalMutation();
  const [activeTab, setActiveTab] = useState<RentalTabType>("All");

  const [modalState, setModalState] = useState<{
    open: boolean;
    rentalId: string | null;
    action: "confirmed" | "cancelled" | null;
    chairName: string;
  }>({
    open: false,
    rentalId: null,
    action: null,
    chairName: "",
  });

  // Selected rental for viewing professional details modal
  const [selectedRentalDetails, setSelectedRentalDetails] = useState<MyRentalItem | null>(null);

  const rentalsList: MyRentalItem[] = Array.isArray(rentalsData?.data)
    ? rentalsData.data
    : Array.isArray(rentalsData)
      ? rentalsData
      : [];

  const handleStatusUpdate = async (rentalId: string, status: "confirmed" | "cancelled") => {
    try {
      await updateChairRental({
        chairRentalId: rentalId,
        id: rentalId,
        data: { status },
        status,
      }).unwrap();
      toast.success(
        status === "confirmed"
          ? "Workspace rental approved successfully"
          : "Workspace rental rejected successfully"
      );
      if (selectedRentalDetails && selectedRentalDetails._id === rentalId) {
        setSelectedRentalDetails((prev) => (prev ? { ...prev, status } : null));
      }
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to update status");
    }
  };

  const openConfirmation = (
    rentalId: string,
    action: "confirmed" | "cancelled",
    chairName: string
  ) => {
    setModalState({
      open: true,
      rentalId,
      action,
      chairName,
    });
  };

  const handleConfirmAction = async () => {
    if (!modalState.rentalId || !modalState.action) return;
    await handleStatusUpdate(modalState.rentalId, modalState.action);
    setModalState((prev) => ({ ...prev, open: false }));
  };

  const matchesRentalTab = (rental: MyRentalItem, tab: RentalTabType) => {
    if (tab === "All") return true;
    const st = (rental.status || "pending").toLowerCase();
    if (tab === "Cancelled") {
      return st === "cancelled" || st === "rejected" || st === "auto_cancelled";
    }
    return st === tab.toLowerCase();
  };

  const filteredRentals = rentalsList.filter((r) => matchesRentalTab(r, activeTab));

  return (
    <div className="space-y-6 pb-16">
      {/* Header Section */}
      <div className="space-y-1">
        <h1 className="font-extrabold text-3xl sm:text-4xl text-foreground tracking-tight">
          Workspace Bookings
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-normal tracking-wide">
          Review and manage workspace chair rental requests from beauty specialists
        </p>
      </div>

      {/* Status Filter Tabs */}
      {!isRentalsLoading && !isError && rentalsList.length > 0 && (
        <div className="border-b border-border flex items-center gap-6 sm:gap-8 text-sm overflow-x-auto">
          {RENTAL_TABS.map((tab) => {
            const isActive = activeTab === tab;
            const isNeg = tab === "Cancelled";
            const count = rentalsList.filter((r) => matchesRentalTab(r, tab)).length;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-2.5 font-medium transition-all cursor-pointer whitespace-nowrap relative flex items-center gap-2 ${
                  isActive
                    ? isNeg
                      ? "text-destructive"
                      : "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? isNeg
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
                      isNeg ? "bg-destructive" : "bg-primary"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      {isRentalsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-card border border-border/70 rounded-2xl p-5 h-48 animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center bg-destructive/10 border border-destructive/20 rounded-lg flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm font-medium text-destructive">
            {(error as any)?.data?.message || "Failed to load your workspaces."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-secondary text-foreground text-xs font-medium rounded-md hover:bg-secondary/80 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : filteredRentals.length === 0 ? (
        <div className="p-16 text-center bg-card border border-border rounded-2xl flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <Armchair className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">
              {activeTab === "All"
                ? "No workspace rentals requested"
                : `No ${activeTab.toLowerCase()} workspace rentals`}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {activeTab === "All"
                ? "No beauty specialists have requested chair rentals at your salon yet."
                : `You don't have any ${activeTab.toLowerCase()} chair rental bookings at the moment.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {filteredRentals.map((rental) => {
            const chairObj = rental.chair;
            const salonObj = typeof rental.salon === "object" ? rental.salon : null;
            const prof = typeof rental.professional === "object" ? rental.professional : null;

            const chairName = chairObj?.name || "Work Station";
            const salonName = salonObj?.name || "Salon Space";
            const img =
              chairObj?.photo ||
              salonObj?.logo ||
              "";

            const profFullName = prof
              ? `${prof.firstName || ""} ${prof.lastName || ""}`.trim() || prof.name || prof.email || "Specialist"
              : "Specialist";
            const profEmail = prof?.email || "";
            const profInitials = prof?.firstName
              ? (prof.firstName[0] + (prof.lastName ? prof.lastName[0] : "")).toUpperCase()
              : profFullName.slice(0, 2).toUpperCase();

            const formattedStart = rental.startDate
              ? new Date(rental.startDate).toLocaleDateString("en-US", {
                  timeZone: "UTC",
                  month: "short",
                  day: "numeric",
                })
              : "N/A";
            const formattedEnd = rental.endDate
              ? new Date(rental.endDate).toLocaleDateString("en-US", {
                  timeZone: "UTC",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "N/A";

            const daysCount = rental.durationInDays || 1;
            const dailyRate = chairObj?.pricePerDayInUSD ?? rental.pricePerDayInUSD;
            const rawPrice = rental.pricing?.total ?? rental.totalPrice ?? (chairObj?.pricePerDayInUSD || 0);
            const status = (rental.status || "pending").toLowerCase();
            const paymentStatus = rental.paymentStatus || "unpaid";

            return (
              <div
                key={rental._id}
                className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-2xs hover:border-[#D99722]/60 hover:shadow-md transition-all group"
              >
                {/* Top Body: Chair Thumbnail + Detailed Info */}
                <div className="flex flex-col sm:flex-row gap-4 min-w-0">
                  <div className="relative w-full h-44 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-accent shrink-0 border border-border">
                    <ChairImage
                      src={img}
                      alt={chairName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base sm:text-lg text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                          {chairName}
                        </h3>
                        <span className="text-[10px] font-mono bg-accent px-2 py-0.5 rounded border border-border text-muted-foreground shrink-0">
                          #{rental.uid || rental._id?.slice(-6)}
                        </span>
                      </div>

                      {/* Renting Specialist Row */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="relative w-5 h-5 rounded-full overflow-hidden bg-primary/15 text-primary border border-primary/30 flex items-center justify-center text-[9px] font-bold shrink-0">
                          {prof?.image ? (
                            <Image
                              src={prof.image}
                              alt={profFullName}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            profInitials
                          )}
                        </div>
                        <span className="text-xs font-semibold text-foreground truncate">
                          {profFullName}
                        </span>
                        {profEmail && (
                          <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
                            · {profEmail}
                          </span>
                        )}
                      </div>

                      {/* Chair Location / Salon */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 text-[#D99722] shrink-0" />
                        <span className="truncate">
                          {chairObj?.location || salonName}
                        </span>
                      </div>
                    </div>

                    {/* Schedule & Price Row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-[#D99722] shrink-0" />
                        <span>
                          {formattedStart} – {formattedEnd}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          ({daysCount} {daysCount === 1 ? "day" : "days"})
                        </span>
                      </span>

                      <div className="text-right">
                        <span className="font-extrabold text-base sm:text-lg text-[#D99722]">
                          ${formatMoney(rawPrice)}
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

                {/* Footer: Statuses & Action Buttons */}
                <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${getAppointmentStatusBadgeStyle(
                        rental.status
                      )}`}
                    >
                      {formatAppointmentStatus(rental.status)}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold capitalize ${getPaymentBadgeStyle(
                        paymentStatus
                      )}`}
                    >
                      {paymentStatus.toLowerCase() === "paid" ? (
                        <CheckCircle className="w-3 h-3 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 shrink-0" />
                      )}
                      {paymentStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => openConfirmation(rental._id, "confirmed", chairName)}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs disabled:opacity-50"
                          title="Approve Request"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => openConfirmation(rental._id, "cancelled", chairName)}
                          className="px-3 py-2 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          title="Reject Request"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedRentalDetails(rental)}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
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
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={modalState.open}
        onOpenChange={(val) => setModalState((prev) => ({ ...prev, open: val }))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {modalState.action === "confirmed" ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              <span>
                {modalState.action === "confirmed"
                  ? "Approve Workspace Request"
                  : "Reject Workspace Request"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              {modalState.action === "confirmed"
                ? `Are you sure you want to approve the rental request for "${modalState.chairName}"?`
                : `Are you sure you want to reject the rental request for "${modalState.chairName}"?`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-4">
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => setModalState((prev) => ({ ...prev, open: false }))}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-accent text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={handleConfirmAction}
              className={`px-5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 ${modalState.action === "confirmed"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                }`}
            >
              {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isUpdating
                ? "Processing..."
                : modalState.action === "confirmed"
                  ? "Confirm Approval"
                  : "Confirm Rejection"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* PROFESSIONAL & RENTAL DETAILS MODAL                               */}
      {/* ----------------------------------------------------------------- */}
      <Dialog
        open={!!selectedRentalDetails}
        onOpenChange={(val) => !val && setSelectedRentalDetails(null)}
      >
        <DialogContent className="sm:max-w-2xl bg-card border border-border p-6 sm:p-8 rounded-2xl shadow-xl text-card-foreground max-h-[90vh] overflow-y-auto">
          {selectedRentalDetails && (() => {
            const rental = selectedRentalDetails;
            const prof = typeof rental.professional === "object" ? rental.professional : null;
            const chairObj = rental.chair;
            const salonObj = typeof rental.salon === "object" ? rental.salon : null;

            const profFullName = prof
              ? `${prof.firstName || ""} ${prof.lastName || ""}`.trim() || prof.name || prof.email || "Professional Stylist"
              : "Professional Stylist";
            const profEmail = prof?.email || "Not provided";
            const profPhone = typeof prof?.phone === "object" ? prof.phone?.number : prof?.phone || "Not provided";
            const profInitials = prof?.firstName
              ? (prof.firstName[0] + (prof.lastName ? prof.lastName[0] : "")).toUpperCase()
              : profFullName.slice(0, 2).toUpperCase();

            const chairName = chairObj?.name || "Work Station";
            const chairImg = chairObj?.photo || salonObj?.logo || "";
            const chairPrice =
              rental.pricing?.total ??
              rental.totalPrice ??
              (chairObj?.pricePerDayInUSD || 0) * (rental.durationInDays || 1);
            const status = (rental.status || "pending").toLowerCase();

            const formattedStart = rental.startDate
              ? new Date(rental.startDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })
              : "N/A";
            const formattedEnd = rental.endDate
              ? new Date(rental.endDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })
              : "N/A";

            return (
              <div className="space-y-6">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-border pb-4 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <DialogTitle className="font-bold text-xl sm:text-2xl text-foreground">
                        Rental Details
                      </DialogTitle>
                      {rental.uid && (
                        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-secondary text-foreground font-semibold border border-border">
                          {rental.uid}
                        </span>
                      )}
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Complete information for this workspace chair reservation
                    </DialogDescription>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold shrink-0 ${getAppointmentStatusBadgeStyle(
                      rental.status
                    )}`}
                  >
                    {formatAppointmentStatus(rental.status)}
                  </span>
                </div>

                {/* Section 1: Professional Information (Highlighted for Salon Owner) */}
                <div className="bg-accent/40 border border-border/80 rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-[#D99722]" />
                      <span>Renting Professional</span>
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20">
                      Renter
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar */}
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-primary/10 border-2 border-primary/30 text-primary flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
                      {prof?.image ? (
                        <Image
                          src={prof.image}
                          alt={profFullName}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        profInitials
                      )}
                    </div>

                    {/* Name & Contact */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <h3 className="font-bold text-lg text-foreground truncate">
                        {profFullName}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {/* Email */}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-3.5 h-3.5 text-[#D99722] shrink-0" />
                          {profEmail !== "Not provided" ? (
                            <a
                              href={`mailto:${profEmail}`}
                              className="text-foreground hover:text-[#D99722] hover:underline truncate"
                            >
                              {profEmail}
                            </a>
                          ) : (
                            <span className="italic">{profEmail}</span>
                          )}
                        </div>

                        {/* Phone */}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5 text-[#D99722] shrink-0" />
                          {profPhone !== "Not provided" && profPhone !== "" ? (
                            <a
                              href={`tel:${profPhone}`}
                              className="text-foreground hover:text-[#D99722] hover:underline"
                            >
                              {profPhone}
                            </a>
                          ) : (
                            <span className="italic">Phone not provided</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Reserved Chair & Salon Workspace */}
                <div className="border border-border rounded-xl p-4 sm:p-5 space-y-3 bg-card shadow-2xs">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Armchair className="w-4 h-4 text-[#D99722]" />
                    <span>Reserved Work Station</span>
                  </h4>

                  <div className="flex items-start gap-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-accent shrink-0 border border-border">
                      <ChairImage src={chairImg} alt={chairName} fill className="object-cover" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base text-foreground">
                          {chairName}
                        </span>
                        {chairObj?.uid && (
                          <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded border border-border font-mono">
                            {chairObj.uid}
                          </span>
                        )}
                      </div>

                      {chairObj?.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-[#D99722]" />
                          <span>{chairObj.location}</span>
                        </p>
                      )}

                      {chairObj?.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 pt-0.5">
                          {chairObj.description}
                        </p>
                      )}

                      <p className="text-xs font-semibold text-foreground pt-1">
                        Rate:{" "}
                        <span className="text-[#D99722] font-bold">
                          ${chairObj?.pricePerDayInUSD || 0}
                        </span>{" "}
                        <span className="text-muted-foreground font-normal">/ day</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Schedule, Duration & Financial Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Schedule Card */}
                  <div className="border border-border rounded-xl p-4 space-y-2 bg-muted/30">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#D99722]" />
                      <span>Rental Schedule</span>
                    </span>
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start Date:</span>
                        <span className="font-semibold text-foreground">{formattedStart}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End Date:</span>
                        <span className="font-semibold text-foreground">{formattedEnd}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-border">
                        <span className="text-muted-foreground">Total Duration:</span>
                        <span className="font-bold text-foreground">
                          {rental.durationInDays || 1} day(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Card */}
                  <div className="border border-border rounded-xl p-4 space-y-2 bg-muted/30">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#D99722]" />
                      <span>Financial &amp; Payment</span>
                    </span>
                    <div className="space-y-1.5 pt-1">
                      {rental.pricing?.subtotal !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span className="font-medium text-foreground">
                            ${formatMoney(rental.pricing.subtotal)}
                          </span>
                        </div>
                      )}
                      {Number(rental.pricing?.discount) > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                          <span>Discount:</span>
                          <span className="font-medium">-${formatMoney(rental.pricing?.discount)}</span>
                        </div>
                      )}
                      {(rental.pricing?.platformFee !== undefined ||
                        rental.pricing?.serviceFee !== undefined) && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platform Fee:</span>
                          <span className="font-medium text-foreground">
                            ${formatMoney(rental.pricing?.platformFee ?? rental.pricing?.serviceFee)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-border">
                        <span className="text-muted-foreground font-semibold">Total Billed:</span>
                        <span className="font-bold text-[#D99722] text-sm">
                          ${formatMoney(chairPrice)} USD
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-muted-foreground">Payment Status:</span>
                        <span
                          className={`font-bold capitalize px-2 py-0.5 rounded-full text-[11px] ${getPaymentBadgeStyle(
                            rental.paymentStatus
                          )}`}
                        >
                          {rental.paymentStatus || "unpaid"}
                        </span>
                      </div>
                      {rental.transaction && (
                        <div className="flex justify-between pt-1 border-t border-border items-center">
                          <span className="text-muted-foreground">Transaction:</span>
                          <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[140px]">
                            {rental.transaction}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {rental.cancelReason && (
                  <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/20 text-xs space-y-1">
                    <span className="font-bold text-destructive uppercase tracking-wider text-[10px]">
                      Cancellation Reason
                    </span>
                    <p className="text-foreground">{rental.cancelReason}</p>
                  </div>
                )}

                {/* Modal Footer / Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    {rental.createdAt && (
                      <span>
                        Requested on {new Date(rental.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    {/* Approve / Reject buttons if pending */}
                    {status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => {
                            const id = rental._id;
                            setSelectedRentalDetails(null);
                            openConfirmation(id, "cancelled", chairName);
                          }}
                          className="px-4 py-2 rounded-lg border border-destructive/30 hover:bg-destructive/10 text-destructive text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => {
                            const id = rental._id;
                            setSelectedRentalDetails(null);
                            openConfirmation(id, "confirmed", chairName);
                          }}
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve Request</span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedRentalDetails(null)}
                      className="px-4 py-2 rounded-lg bg-secondary border border-border text-foreground hover:bg-accent text-xs font-medium transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
