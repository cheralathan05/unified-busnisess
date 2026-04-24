// auto-generated
// src/utils/response.ts

export const successResponse = (data: any, message = "Success") => {
  return {
    success: true,
    message,
    data,
  };
};

export const errorResponse = (message: string, errors?: any) => {
  return {
    success: false,
    message,
    errors,
  };
};