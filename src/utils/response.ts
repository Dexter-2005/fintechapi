/**
 * Consistent success response
 */
export const successResponse = <T>(
  data: T,
  message = 'Success',
  statusCode = 200
) => ({
  success: true,
  statusCode,
  message,
  data,
});

/**
 * Consistent error response
 */
export const errorResponse = (
  message: string,
  statusCode = 500,
  errors?: unknown
) => ({
  success: false,
  statusCode,
  message,
  errors: errors ?? null,
});
