export interface Transaction {
  _id: string;
  amount: number;
  netAmount?: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  gateway?: string;
  createdAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    image?: string;
  };
  reference?: {
    id?: {
      uid?: string;
      roomClass?: string;
    };
  };
}
