import { GraphQLFormattedError } from 'graphql';
import { AppError } from '../errors';
import logger from '@/config/logger';

export const formatError = (
  formattedError: GraphQLFormattedError,
  error: unknown
): GraphQLFormattedError => {
  logger.error(`GraphQL Error: ${formattedError.message}`);

  if (error instanceof Error && 'originalError' in error) {
    const originalError = (error as any).originalError;
    
    if (originalError instanceof AppError) {
      return {
        ...formattedError,
        extensions: {
          ...formattedError.extensions,
          statusCode: originalError.statusCode,
        },
      };
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return {
      message: 'Internal server error',
      extensions: {
        statusCode: 500,
      },
    };
  }

  return formattedError;
};
