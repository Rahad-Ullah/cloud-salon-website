export interface SalonTypeCategory {
  id: string;
  name: string;
  slug: string;
}

export interface SalonItem {
  id: number | string;
  name: string;
  salonType: string;
  category: string;
  rating: number;
  reviews: number;
  location: string;
  city: string;
  price: string;
  badge: string;
  tags: string[];
  img: string;
  featured?: boolean;
  address?: string;
  phone?: string;
  description?: string;
  hours?: string;
  amenities?: string[];
  photos?: string[];
}
