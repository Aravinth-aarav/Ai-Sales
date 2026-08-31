import logger from '../config/logger.js';

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  // If the error object has an explicit status code, use it. Otherwise default to 500
  const statusCode = err.status || err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  
  // Log the error using winston
  logger.error(err);
  
  res.status(statusCode);
  
  res.json({
    success: false,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message,
    reason: err.reason || null,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { notFound, errorHandler };
