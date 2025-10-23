import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction as ExpressNextFunction,
} from "express";

type RequestContext = Record<string, any>;

export interface Request extends ExpressRequest {
  context: RequestContext;

  /**
   * Update the request context
   */
  updateContext: (data: any) => any;
}

export interface BaseResponse {
  message: string;
  data?: any;
  error?: any;
  stack?: string;
}
export interface Response extends ExpressResponse {
  /**
   * Return success message (200)
   */
  success: (message: string, data?: any, statusCode?: number) => BaseResponse;

  /**
   * Return error message (400 - 500)
   */
  error: (
    message: string,
    error?: any,
    statusCode?: number,
    stack?: string[]
  ) => BaseResponse;
}

export interface NextFunction extends ExpressNextFunction {}

/**
 * Use the custom response middleware to extend express request and response object.
 */
export const extendExpress = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.context = req.context || {};

  req.updateContext = function (data: any): any {
    req.context = { ...req.context, ...data };
    return req.context;
  };

  res.success = function (
    message: string,
    data: any,
    statusCode: number = 200
  ): BaseResponse {
    return this.status(statusCode).json({
      message: message,
      ...{ data },
    });
  };

  res.error = function (
    message: string,
    error: any,
    statusCode: number = 500,
    stack: string[]
  ): BaseResponse {
    return this.status(statusCode).json({
      message: message,
      ...{ error },
      stack,
    });
  };

  next();
};
