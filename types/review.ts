export interface Review {
  _id?: string;
  id?: string;
  property?: string;
  customer?: {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    image?: string;
  };
  user?: {
    name?: string;
    email?: string;
  };
  rating?: number;
  comment?: string;
  createdAt?: string;
}
