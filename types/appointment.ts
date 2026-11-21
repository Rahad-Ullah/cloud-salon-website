export enum AppointmentStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
  Rejected = 'rejected',
  AutoCancelled = 'auto_cancelled',
  Active = 'active',
  Completed = 'completed',
}

export interface IAppointmentPricing {
  subtotal?: number;
  discount?: number;
  platformFee?: number;
  serviceFee?: number;
  total?: number;
}

export interface IAppointment {
  _id: string;
  uid?: string;
  customer?: any;
  professional?: any;
  salon?: any;
  services?: any[];
  startsAt?: string;
  endsAt?: string;
  status: AppointmentStatus | string;
  paymentStatus?: 'paid' | 'unpaid' | 'refunded' | string;
  pricing?: IAppointmentPricing;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}
