import { Request, Response, NextFunction } from 'express';

export const validateRequestBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields = requiredFields.filter(field => !(field in req.body));

    if (missingFields.length > 0) {
      res.status(400).json({
        error: 'Missing required fields',
        missingFields,
      });
      return;
    }

    next();
  };
};
