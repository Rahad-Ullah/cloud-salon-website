import { ServiceItem } from "./service";

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  serviceName?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  image: string;
  likes?: number;
}

export interface ProfessionalItem {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  location: string;
  city: string;
  bio: string;
  salonId?: number | string;
  salonName?: string;
  badge?: string;
  services: ServiceItem[];
  portfolio?: PortfolioItem[];
  reviews?: ReviewItem[];
  workingHours?: { day: string; hours: string }[];
}
