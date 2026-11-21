export interface ApiError {
  status?: number | string;
  data?: {
    message?: string;
    errorMessages?: { path?: string; message: string }[];
  };
  message?: string;
}
