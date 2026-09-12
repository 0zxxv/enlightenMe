export type ApiErrorBody = {
  code: string;
  message: string;
};

export type ApiSuccess<T> = {
  data: T;
};

export type ApiPaginated<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export type ApiErrorResponse = {
  error: ApiErrorBody;
};

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}
