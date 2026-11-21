"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { Menu, Bell } from "lucide-react";
import { DashboardConfig } from "./nav-config";
import ThemeToggle from "@/components/shared/theme-toggle";
import { Combobox } from "@/components/ui/combobox";
import { useGetMyProfileQuery } from "@/features/profile/profileApi";
import { useGetAllNotificationQuery } from "@/features/notification/notificationApi";
import { getUser } from "@/utils/storage";

const languageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

interface DashboardHeaderProps {
  config: DashboardConfig;
  onOpenMobileMenu: () => void;
  isSalonOwner?: boolean;
}

export default function DashboardHeader({
  config,
  onOpenMobileMenu,
  isSalonOwner: propIsSalonOwner,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const token = useSelector((state: { auth?: { token?: string | null; user?: any } }) => state.auth?.token);
  const user = useSelector((state: { auth?: { token?: string | null; user?: any } }) => state.auth?.user);

  const [currentLangCode, setCurrentLangCode] = useState(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return "en";
  });

  const changeLanguage = (code: string) => {
    if (typeof window !== "undefined" && (window as any).__applyTranslate) {
      (window as any).__applyTranslate(code);
      setCurrentLangCode(code);
    }
  };

  const { data: profileResponse } = useGetMyProfileQuery(undefined);
  const profileData = profileResponse?.data;
  const storedUser = typeof window !== "undefined" ? getUser() : null;
  const storedDisplayName = typeof window !== "undefined" ? localStorage.getItem("userDisplayName") : null;
  const currentUser = profileData || user || storedUser;

  const isSalonOwnerFromApi =
    profileData?.isSalonOwner ??
    profileData?.user?.isSalonOwner ??
    profileResponse?.data?.isSalonOwner ??
    profileResponse?.data?.user?.isSalonOwner ??
    profileResponse?.isSalonOwner;
  const isSalonOwnerFromUser = currentUser?.isSalonOwner ?? currentUser?.user?.isSalonOwner;
  const storedIsSalonOwner = typeof window !== "undefined" ? localStorage.getItem("isSalonOwner") : null;

  const isSalonOwner = Boolean(
    propIsSalonOwner !== undefined
      ? propIsSalonOwner
      : isSalonOwnerFromApi !== undefined
      ? isSalonOwnerFromApi
      : isSalonOwnerFromUser !== undefined
      ? isSalonOwnerFromUser
      : storedIsSalonOwner !== null
      ? storedIsSalonOwner === "true"
      : false
  );

  const displayRole = isSalonOwner
    ? "Salon Owner"
    : currentUser?.role || config.role;

  const roleBadgeText = isSalonOwner
    ? "SALON OWNER"
    : config.role.toUpperCase();

  const roleBadgeColor = isSalonOwner
    ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
    : config.roleBadgeColor;

  const { data: notificationRes } = useGetAllNotificationQuery(undefined, {
    pollingInterval: 60000,
  });

  const notificationsList = Array.isArray(notificationRes?.data?.data)
    ? notificationRes.data.data
    : Array.isArray(notificationRes?.data)
    ? notificationRes.data
    : [];

  const unreadCount =
    typeof notificationRes?.data?.unreadCount === "number"
      ? notificationRes.data.unreadCount
      : notificationsList.filter((n: any) => !n.isRead).length;

  const userImage = typeof currentUser?.image === "string" && currentUser.image.trim().length > 0 ? currentUser.image : null;

  // Derive section title from pathname
  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0 || segments[segments.length - 1] === "dashboard") {
      return "Dashboard";
    }

    let targetSegment = segments[segments.length - 1];

    // Check if the last segment is an ID (MongoDB 24-hex ObjectId, UUID, numeric or mixed hash)
    const isId =
      /^[a-f0-9]{24}$/i.test(targetSegment) ||
      /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(targetSegment) ||
      /^\d+$/.test(targetSegment) ||
      (targetSegment.length >= 12 && /\d/.test(targetSegment));

    if (isId && segments.length > 1) {
      targetSegment = segments[segments.length - 2];
    }

    if (
      targetSegment === "workspace" ||
      targetSegment === "work-space" ||
      targetSegment === "chairs-space" ||
      targetSegment === "my-chair-rentals"
    ) {
      return "Work Space";
    }
    if (targetSegment === "bookings" || targetSegment === "appointments") {
      return "Bookings";
    }
    if (targetSegment === "services") {
      return "Services";
    }
    if (targetSegment === "messages" || targetSegment === "chats") {
      return "Messages";
    }
    if (targetSegment === "calendar") {
      return "Calendar";
    }
    if (targetSegment === "portfolio") {
      return "Portfolio";
    }
    if (targetSegment === "reviews") {
      return "Reviews";
    }
    if (targetSegment === "settings") {
      return "Settings";
    }
    if (targetSegment === "notifications") {
      return "Notifications";
    }

    return (
      targetSegment.charAt(0).toUpperCase() +
      targetSegment.slice(1).replace(/-/g, " ")
    );
  };

  const displayName = currentUser?.firstName
    ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
    : storedDisplayName || currentUser?.name || (currentUser?.email?.split('@')[0] || "Business Professional");

  const initial = currentUser?.firstName
    ? currentUser.firstName[0].toUpperCase()
    : (displayName[0] ? displayName[0].toUpperCase() : "B");

  const isServicesActive = pathname.startsWith("/services");
  const isProfessionalsActive = pathname.startsWith("/professionals");
  const isSalonsActive = pathname.startsWith("/salons");
  const isWorkspacesActive = pathname.startsWith("/workspaces");
  const isHowItWorksActive = pathname.startsWith("/how-it-works");
  const isAboutActive = pathname.startsWith("/about");

  const mainNavLinks = [
    { label: "Home", href: "/", isActive: pathname === "/" },
    { label: "Services", href: "/services", isActive: isServicesActive },
    { label: "Professionals", href: "/professionals", isActive: isProfessionalsActive },
    { label: "Salons", href: "/salons", isActive: isSalonsActive },
    { label: "Workspaces", href: "/workspaces", isActive: isWorkspacesActive },
    { label: "How it Works", href: "/how-it-works", isActive: isHowItWorksActive },
    { label: "About Us", href: "/about", isActive: isAboutActive },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 sm:h-20 px-3 sm:px-6 lg:px-8 bg-background/95 backdrop-blur-md border-b border-border transition-colors duration-200">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-foreground hover:bg-accent lg:hidden transition-colors cursor-pointer shrink-0"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base sm:text-xl md:text-2xl font-bold text-foreground truncate max-w-[130px] xs:max-w-[190px] sm:max-w-none">
            {getPageTitle()}
          </h1>
          <span
            className={`hidden xs:inline-flex items-center px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full border shrink-0 ${roleBadgeColor}`}
          >
            {roleBadgeText}
          </span>
        </div>
      </div>

      {/* Center: Main Navigation Links (Hidden on small laptop/tablet, shown on desktop xl+) */}
      <nav className="hidden xl:flex items-center gap-4 2xl:gap-7 text-xs 2xl:text-sm font-medium text-muted-foreground whitespace-nowrap mx-4">
        {mainNavLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`group relative py-2 transition-colors whitespace-nowrap ${
              link.isActive
                ? "text-foreground font-semibold"
                : "hover:text-foreground"
            }`}
          >
            <span>{link.label}</span>
            <span
              className={`absolute bottom-0 left-0 h-[2px] bg-[#D99722] rounded-full transition-all duration-300 ease-out ${
                link.isActive ? "w-full" : "w-0 group-hover:w-full"
              }`}
            />
          </Link>
        ))}
      </nav>

      {/* Right: Quick Actions, Theme Toggle, Language Selector, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Theme & Language (Desktop/Tablet, moved to sidebar on mobile) */}
        <div className="hidden md:flex items-center gap-2 sm:gap-2.5">
          <ThemeToggle />

          {/* Language Selector Combobox */}
          <Combobox
            options={languageOptions}
            value={currentLangCode}
            onChange={changeLanguage}
            triggerClassName="h-9 px-2 xl:px-2.5 2xl:h-10 2xl:px-3 w-[88px] xl:w-[94px] 2xl:w-[105px] rounded-sm border-border bg-card hover:bg-accent text-xs font-semibold text-foreground shadow-2xs notranslate shrink-0"
            contentClassName="notranslate"
            labelClassName="text-xs font-semibold notranslate"
            align="end"
            noTranslate
          />
        </div>

        {/* Notifications Icon */}
        <Link
          href={`/${config.role}/notifications`}
          className="relative p-2 sm:p-2.5 rounded-xl text-foreground hover:bg-accent border border-transparent hover:border-border transition-all cursor-pointer block shrink-0"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-background shadow-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-border shrink-0">
          <div
            className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/15 text-primary font-bold text-xs sm:text-sm border border-primary/30 notranslate shrink-0 select-none uppercase overflow-hidden"
            translate="no"
          >
            {userImage ? (
              <Image src={userImage} alt={displayName} fill className="object-cover" unoptimized />
            ) : (
              initial
            )}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-sm font-semibold text-foreground notranslate" translate="no">
              {displayName}
            </span>
            <span className="text-xs text-muted-foreground capitalize">{displayRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
