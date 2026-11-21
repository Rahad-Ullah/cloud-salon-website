"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useGetMyReviewsQuery } from "@/features/review/reviewApi";
import { ListSkeleton } from "@/components/ui/skeleton";
import ChairImage from "@/components/shared/ChairImage";

export default function CustomerReviewsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: reviewsResponse, isLoading } = useGetMyReviewsQuery({
    page: currentPage,
    limit: 10,
  });

  const reviewsList: any[] = Array.isArray(reviewsResponse?.data?.data)
    ? reviewsResponse.data.data
    : Array.isArray(reviewsResponse?.data?.reviews)
    ? reviewsResponse.data.reviews
    : Array.isArray(reviewsResponse?.data)
    ? reviewsResponse.data
    : Array.isArray(reviewsResponse)
    ? reviewsResponse
    : [];

  const pagination =
    reviewsResponse?.pagination ||
    reviewsResponse?.data?.pagination ||
    reviewsResponse?.meta ||
    null;

  const totalReviews =
    typeof pagination?.total === "number"
      ? pagination.total
      : reviewsList.length;

  const totalPages =
    typeof pagination?.totalPages === "number"
      ? pagination.totalPages
      : typeof pagination?.pages === "number"
      ? pagination.pages
      : 1;

  return (
    <div className="space-y-6 pb-16 font-sans text-foreground">
      {/* Header Section */}
      <div className="space-y-1">
        <h1 className="font-extrabold text-3xl sm:text-4xl text-foreground tracking-tight">
          My Reviews
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-normal tracking-wide">
          Manage and view all the feedback you have submitted for your appointments
        </p>
      </div>

      {/* Reviews Stacked List */}
      <div className="space-y-4 pt-2">
        {isLoading ? (
          <div className="bg-card border border-border rounded-2xl p-4">
            <ListSkeleton count={3} />
          </div>
        ) : reviewsList.length === 0 ? (
          <div className="bg-card border border-border/70 rounded-2xl p-12 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#D99722]/10 text-[#D99722] flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              No Reviews Written Yet
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              When you complete appointments with beauty and grooming specialists, your ratings and feedback will be collected here.
            </p>
            <div className="pt-2">
              <Link
                href="/customer/bookings?tab=past"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D99722] hover:bg-[#C2841B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <span>View Past Bookings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {reviewsList.map((review: any, idx: number) => {
              const pro = review.professional || {};
              const salon = review.salon || {};
              const entity = review.entity || {};
              const recipientUser = pro.user || review.recipient || {};

              const proFirstName =
                pro.firstName || recipientUser.firstName || "";
              const proLastName =
                pro.lastName || recipientUser.lastName || "";
              const specialistName =
                `${proFirstName} ${proLastName}`.trim() ||
                pro.name ||
                recipientUser.name ||
                salon.name ||
                entity.name ||
                "Specialist";

              const salonName =
                salon.name ||
                pro.salon?.name ||
                entity.salonName ||
                "";

              let serviceName =
                (typeof review.service === "string"
                  ? review.service
                  : review.service?.name) ||
                review.serviceName ||
                entity.name ||
                "Beauty & Grooming Service";

              const numericRating = Math.min(
                5,
                Math.max(1, Math.round(Number(review.rating) || 5))
              );

              const dateStr = review.createdAt
                ? new Date(review.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "";

              const avatarUrl =
                pro.image ||
                pro.user?.image ||
                salon.logo ||
                salon.image ||
                entity.image ||
                "";

              return (
                <div
                  key={review._id || `rev-${idx}`}
                  className="bg-card border border-border/70 rounded-2xl p-5 sm:p-6 space-y-3.5 shadow-2xs hover:border-[#D99722]/50 transition-colors"
                >
                  {/* Header: Specialist info & Rating & Date */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* Thumbnail */}
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-accent shrink-0 border border-border flex items-center justify-center">
                        <ChairImage
                          src={avatarUrl}
                          alt={specialistName}
                          size="md"
                          className="object-cover"
                        />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm sm:text-base text-foreground">
                            {specialistName}
                          </h3>
                          {salonName && (
                            <span className="text-[10px] font-semibold bg-accent px-2 py-0.5 rounded-md text-muted-foreground truncate max-w-[140px]">
                              {salonName}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            VERIFIED
                          </span>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-1 text-amber-500">
                          {[...Array(numericRating)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-3.5 h-3.5 fill-amber-500 text-amber-500"
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Date & Service */}
                    <div className="text-right shrink-0">
                      {dateStr && (
                        <span className="text-xs text-muted-foreground block font-normal">
                          {dateStr}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-[#D99722] block mt-0.5 truncate max-w-[150px] sm:max-w-[220px]">
                        {serviceName}
                      </span>
                    </div>
                  </div>

                  {/* Review Comment Text */}
                  {review.comment && (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1 border-t border-border/40">
                      {review.comment}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Pagination Controls (when paginated) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs">
                <span className="text-muted-foreground">
                  Page {currentPage} of {totalPages} ({totalReviews} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-2 rounded-lg border border-border bg-card hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-2 rounded-lg border border-border bg-card hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
