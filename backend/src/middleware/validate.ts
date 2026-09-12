import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

type RequestPart = 'body' | 'query' | 'params';

export function validate(schema: ZodType, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return next(result.error);
    }

    // Express 5 exposes query/params as read-only getters; redefine when needed.
    if (part === 'body') {
      req.body = result.data;
    } else {
      Object.defineProperty(req, part, {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    return next();
  };
}
