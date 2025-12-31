import { Response } from "express";

interface ResponseOptions {
  res: Response;
  statusCode: number;
  message: string;
  data?: any;
  error?: any;
}

export const sendResponse = ({
  res,
  statusCode,
  message,
  data,
  error,
}: ResponseOptions) => {
  // Determine the success status based on status code
  const success = statusCode >= 200 && statusCode < 400;

  return res.status(statusCode).json({
    success,
    message,
    // Include data and error parameters in response only when it is defined
    ...(data !== undefined && { data }),
    ...(error !== undefined && { error }),
  });
};
