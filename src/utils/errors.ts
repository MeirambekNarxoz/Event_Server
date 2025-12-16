import { GraphQLError } from 'graphql';

// Коды ошибок для GraphQL
export enum ErrorCode {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
}

// Базовая ошибка приложения
export class AppError extends Error {
  constructor(
    public message: string,
    public code: ErrorCode,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Создаёт GraphQL ошибку с extensions
export const createGraphQLError = (
  message: string,
  code: ErrorCode,
  statusCode?: number
): GraphQLError => {
  return new GraphQLError(message, {
    extensions: {
      code,
      statusCode: statusCode || 400,
    },
  });
};

// // Общий обработчик ошибок
export const handleError = (error: unknown): GraphQLError => {
  if (error instanceof AppError) {
    return createGraphQLError(error.message, error.code, error.statusCode);
  }

  if (error instanceof Error) {
    return createGraphQLError(
      error.message,
      ErrorCode.INTERNAL_ERROR,
      500
    );
  }

  return createGraphQLError(
    'An unknown error occurred',
    ErrorCode.INTERNAL_ERROR,
    500
  );
};

