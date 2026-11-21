export interface RootState {
  auth: {
    token: string | null;
    user?: {
      _id: string;
      role: string;
      email: string;
      firstName?: string;
      lastName?: string;
    } | null;
  };
}
