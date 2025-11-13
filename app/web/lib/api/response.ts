// app/web/lib/api/response.ts
import { NextResponse } from 'next/server';

type SuccessResponse<T> = {
  success: true;
  data: T;
};

type ErrorResponse = {
  success: false;
  error: {
    message: string;
    [key: string]: unknown;
  };
};

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

export function ok<T>(data: T, init?: ResponseInit) {
  const body: SuccessResponse<T> = {
    success: true,
    data,
  };

  return NextResponse.json(body, {
    status: 200,
    ...init,
  });
}

export function error(
  message: string,
  status: number = 500,
  extra?: Record<string, unknown>,
  init?: ResponseInit,
) {
  const body: ErrorResponse = {
    success: false,
    error: {
      message,
      ...(extra ?? {}),
    },
  };

  return NextResponse.json(body, {
    status,
    ...init,
  });
}
