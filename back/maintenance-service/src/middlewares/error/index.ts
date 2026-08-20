import { NextFunction, Request, Response } from 'express';

export class ApiError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message);
  }
}

export default function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof ApiError) {
    res.status(err.code).send({ message: err.message });
    return;
  }

  console.error('Unexpected error:', err);
  res.status(500).send({ message: 'Internal server error' });
}
