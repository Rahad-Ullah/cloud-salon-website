export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  price?: string;
  duration?: string;
}

export interface ServiceCategory {
  id: string;
  title: string;
  slug: string;
  desc: string;
  count: string;
  img: string;
}
