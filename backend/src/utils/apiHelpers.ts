// backend/src/utils/apiHelpers.ts
import { Response, Request, NextFunction } from "express";
import { RequestHandler } from "express-serve-static-core";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function success<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function failure<T>(error: string): ApiResponse<T> {
  return { success: false, error };
}

export const withDataOr404 = async <T>(
  fetchPromise: Promise<T | null>,
  res: Response,
  notFoundMessage: string,
  successFn: (data: T) => void | Promise<void>,
): Promise<void> => {
  const data = await fetchPromise;
  if (!data) {
    res.status(404).json(failure(notFoundMessage));
    return;
  }
  await successFn(data);
};

export const withErrorHandling = <P = {}, ReqBody = any, ResBody = any>(
  handler: (
    req: Request<P, any, ReqBody>,
    res: Response<ApiResponse<ResBody>>,
  ) => Promise<void>,
): RequestHandler<P, ApiResponse<ResBody>, ReqBody> => {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error("Request handler error:", error);
      res
        .status(500)
        .json(
          failure(error instanceof Error ? error.message : "Unknown error"),
        );
    }
  };
};
