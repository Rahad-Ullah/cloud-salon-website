"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  Star,
  MapPin,
  Building2,
  User,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetMyWishListQuery,
  useAddAndRemoveWishListMutation,
} from "@/features/wishlist/wishlistApi";
import ChairImage from "@/components/shared/ChairImage";

export default function CustomerFavoritesPage() {
  const [activeTab, setActiveTab] = useState<"professionals" | "salons">("professionals");

  const { data: wishlistRes, isLoading } = useGetMyWishListQuery({});
  const [addAndRemoveWishList] = useAddAndRemoveWishListMutation();

  const rawList = Array.isArray(wishlistRes?.data) ? wishlistRes.data : [];

  const wishlistItems = rawList.map((wItem: any) => {
    const entity = wItem.entity || {};
    const roleRef = entity.roleRef || {};
    const firstName = entity.firstName || "";
    const lastName = entity.lastName || "";
    const name = `${firstName} ${lastName}`.trim() || entity.name || "Specialist";

    const isSalon =
      wItem.entityType === "salon" ||
      entity.role === "business" ||
      (!entity.role && entity.name && !entity.firstName);
    const itemType: "professional" | "salon" = isSalon ? "salon" : "professional";

    // Salon specifics
    const salonType = entity.businessType || roleRef.title || "Hair & Beauty Salon";
    const salonBadge = entity.status === "active" ? "Open Today" : "Verified";
    const coverImg =
      (Array.isArray(entity.photos) && entity.photos[0]) ||
      (Array.isArray(roleRef.photos) && roleRef.photos[0]) ||
      entity.image ||
      entity.coverImage ||
      roleRef.salon?.photos?.[0] ||
      "";
    const logoImg = entity.logo || entity.image || "";

    // Professional specifics
    const proAvatar = entity.image || "";
    const salonObj = roleRef.salon || entity.salon || {};
    const salonName = salonObj.name || "";
    const salonId = salonObj._id || salonObj.id || "";
    const badgeText = entity.isSalonOwner
      ? "Salon Owner & Pro"
      : roleRef.isVerified || entity.isVerified
      ? "Verified Pro"
      : "Specialist";
    const startingPrice = roleRef.startingPriceInUSD || entity.startingPriceInUSD || 35;

    const rating =
      roleRef.avgRating !== undefined
        ? roleRef.avgRating
        : entity.avgRating !== undefined
        ? entity.avgRating
        : 5.0;
    const reviewCount =
      roleRef.totalReviews !== undefined
        ? roleRef.totalReviews
        : entity.totalReviews !== undefined
        ? entity.totalReviews
        : 0;

    const location = entity.address?.city
      ? `${entity.address.city}${entity.address.state ? ", " + entity.address.state : ""}`
      : "Location N/A";

    return {
      raw: wItem,
      id: wItem._id,
      entityId: entity._id || entity.id,
      entityType: wItem.entityType || (isSalon ? "salon" : "user"),
      name,
      type: itemType,
      salonType,
      salonBadge,
      coverImg,
      logoImg,
      proAvatar,
      salonName,
      salonId,
      badgeText,
      startingPrice,
      rating,
      reviewCount,
      location,
    };
  });

  const toggleFavorite = async (item: any) => {
    try {
      await addAndRemoveWishList({
        entityType: item.entityType,
        entity: item.entityId,
      }).unwrap();
      toast.success("Removed from favorites");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update favorites");
    }
  };

  const displayedItems = wishlistItems.filter((item: any) =>
    activeTab === "professionals" ? item.type === "professional" : item.type === "salon"
  );

  return (
    <div className="space-y-6 pb-12 font-sans text-foreground">
      {/* Header Section */}
      <div className="space-y-1">
        <h1 className="font-extrabold text-3xl sm:text-4xl text-foreground tracking-tight">
          Favorites
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-normal tracking-wide">
          Professionals and salons you have saved to your favorites
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-border flex items-center gap-8 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab("professionals")}
          className={`pb-2.5 font-medium transition-all cursor-pointer relative ${
            activeTab === "professionals"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Professionals ({wishlistItems.filter((i: any) => i.type === "professional").length})
          {activeTab === "professionals" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("salons")}
          className={`pb-2.5 font-medium transition-all cursor-pointer relative ${
            activeTab === "salons"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Salons ({wishlistItems.filter((i: any) => i.type === "salon").length})
          {activeTab === "salons" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* Favorites Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 pt-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-card border border-border rounded-2xl h-80 animate-pulse" />
          ))}
        </div>
      ) : displayedItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 pt-2">
          {displayedItems.map((item: any) => {
            // ========================================================
            // 1. SALON FAVORITE CARD (Matching SalonsNearYou & SalonsTab)
            // ========================================================
            if (item.type === "salon") {
              return (
                <div
                  key={item.id}
                  className="bg-card rounded-2xl overflow-hidden border border-border/70 shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col justify-between text-card-foreground hover:-translate-y-1"
                >
                  {/* Salon Cover Header */}
                  <div className="relative h-44 sm:h-48 overflow-hidden bg-muted">
                    <Link href={`/salons/${item.entityId}`} className="block w-full h-full relative">
                      <ChairImage
                        src={item.coverImg}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        size="lg"
                        iconType="scissors"
                        label="Salon"
                        showLabel
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30 pointer-events-none" />
                    </Link>

                    {/* Top Badges & Heart Action */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-auto">
                      <span className="bg-black/60 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-[#D99722]" />
                        <span>{item.salonType}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="bg-[#D99722] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                          {item.salonBadge}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(item);
                          }}
                          aria-label="Remove from favorites"
                          title="Remove from favorites"
                          className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-rose-500 hover:text-rose-400 hover:scale-110 transition-all cursor-pointer border border-white/20 shadow-xs"
                        >
                          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Salon Logo + Info Column (Name -> Location -> Rating) */}
                      <div className="flex items-start gap-3">
                        <Link href={`/salons/${item.entityId}`} className="shrink-0 block mt-0.5">
                          <div className="w-12 h-12 rounded-xl border-2 border-[#D99722]/60 overflow-hidden bg-muted shadow-sm">
                            <ChairImage
                              src={item.logoImg}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              size="sm"
                              iconType="scissors"
                            />
                          </div>
                        </Link>

                        <div className="flex-1 min-w-0 space-y-1">
                          {/* 1. Name */}
                          <Link
                            href={`/salons/${item.entityId}`}
                            className="text-sm sm:text-base font-bold text-foreground hover:text-[#D99722] transition-colors block truncate"
                          >
                            {item.name}
                          </Link>

                          {/* 2. Location */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-[#D99722] shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>

                          {/* 3. Rating */}
                          <div className="flex items-center gap-1 text-xs pt-0.5">
                            <Star className="w-3.5 h-3.5 fill-[#D99722] text-[#D99722] shrink-0" />
                            <span className="font-bold text-foreground">{item.rating}</span>
                            <span className="text-muted-foreground text-[11px]">({item.reviewCount})</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-border/50">
                      <Link
                        href={`/salons/${item.entityId}`}
                        className="w-full text-center py-2.5 bg-[#D99722] hover:bg-[#C2841B] text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 block"
                      >
                        Explore Salon & Book
                      </Link>
                    </div>
                  </div>
                </div>
              );
            }

            // ========================================================
            // 2. PROFESSIONAL FAVORITE CARD (Matching ProfessionalsTab)
            // ========================================================
            return (
              <div
                key={item.id}
                className="bg-card rounded-2xl overflow-hidden border border-border/70 shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col justify-between text-card-foreground hover:-translate-y-1"
              >
                {/* Salon Cover Header */}
                <div className="relative h-44 sm:h-48 overflow-hidden bg-muted">
                  <Link
                    href={`/professionals/${item.entityId}`}
                    className="block w-full h-full relative"
                  >
                    <ChairImage
                      src={item.coverImg}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      iconType="scissors"
                      label="Salon"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30 pointer-events-none" />
                  </Link>

                  {/* Top Badges & Heart Action */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-auto">
                    <span className="bg-black/60 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                      {item.badgeText}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(item);
                      }}
                      aria-label="Remove from favorites"
                      title="Remove from favorites"
                      className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-rose-500 hover:text-rose-400 hover:scale-110 transition-all cursor-pointer border border-white/20 shadow-xs"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    </button>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Pro Avatar + Info Column (Title -> Role -> Salon Name -> Price -> Location -> Rating) */}
                    <div className="flex items-start gap-3">
                      <Link href={`/professionals/${item.entityId}`} className="shrink-0 block mt-0.5">
                        <div className="w-12 h-12 rounded-xl border-2 border-[#D99722]/60 overflow-hidden bg-muted shadow-sm">
                          <ChairImage
                            src={item.proAvatar}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            size="sm"
                            fallbackIcon={<User className="w-4 h-4 text-[#D99722]" />}
                          />
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0 space-y-1">
                        {/* 1. Title (Name) */}
                        <Link
                          href={`/professionals/${item.entityId}`}
                          className="text-sm sm:text-base font-bold text-foreground hover:text-[#D99722] transition-colors block truncate"
                        >
                          {item.name}
                        </Link>

                        {/* 2. Salon Name (if available) */}
                        {item.salonName && (
                          <Link
                            href={item.salonId ? `/salons/${item.salonId}` : "#"}
                            className="inline-flex items-center gap-1.5 text-xs text-[#D99722] hover:underline font-semibold max-w-full"
                          >
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{item.salonName}</span>
                          </Link>
                        )}

                        {/* 3. Starting Price */}
                        <div className="text-xs font-semibold text-foreground">
                          <span className="text-muted-foreground font-normal">Starting from </span>
                          <span className="text-[#D99722] font-bold">${item.startingPrice}</span>
                        </div>

                        {/* 4. Location */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 text-[#D99722] shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>

                        {/* 5. Rating */}
                        <div className="flex items-center gap-1 text-xs pt-0.5">
                          <Star className="w-3.5 h-3.5 fill-[#D99722] text-[#D99722] shrink-0" />
                          <span className="font-bold text-foreground">{item.rating}</span>
                          <span className="text-muted-foreground text-[11px]">({item.reviewCount})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                    <Link
                      href={`/professionals/${item.entityId}`}
                      className="flex-1 text-center py-2 bg-accent hover:bg-accent/80 text-foreground text-xs font-semibold rounded-xl border border-border/60 transition-colors block"
                    >
                      View Profile
                    </Link>

                    <Link
                      href={`/book/1?proId=${item.entityId}`}
                      className="flex-1 text-center py-2 bg-[#D99722] hover:bg-[#C2841B] text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 block"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-accent/60 border border-border rounded-2xl p-12 text-center text-muted-foreground space-y-2">
          <p className="text-lg font-bold text-foreground">No saved {activeTab} yet.</p>
          <p className="text-xs">
            Browse {activeTab} and click the heart icon to save them to your favorites.
          </p>
        </div>
      )}
    </div>
  );
}
