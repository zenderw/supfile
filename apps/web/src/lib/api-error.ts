import axios from 'axios';

const ErrorCode = {
  EMAIL_ALREADY_USED: 'EMAIL_ALREADY_USED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
} as const;

interface ApiError {
  code?: string;
  message?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  [ErrorCode.EMAIL_ALREADY_USED]: 'Cet email est déjà utilisé',
  [ErrorCode.INVALID_CREDENTIALS]: 'Email ou mot de passe incorrect',
  [ErrorCode.TOKEN_EXPIRED]: 'Votre session a expiré, reconnectez-vous',
  [ErrorCode.TOKEN_INVALID]: 'Session invalide',
};

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiError | undefined;
    if (data?.code && ERROR_MESSAGES[data.code]) {
      return ERROR_MESSAGES[data.code];
    }
    if (data?.message) return data.message;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Une erreur est survenue';
}
