import axios from 'axios';

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_USED: 'Cet email est déjà utilisé',
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
  TOKEN_EXPIRED: 'Votre session a expiré',
  TOKEN_INVALID: 'Session invalide',
};

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { code?: string; message?: string } | undefined;
    if (data?.code && ERROR_MESSAGES[data.code]) {
      return ERROR_MESSAGES[data.code];
    }
    if (data?.message) return data.message;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Une erreur est survenue';
}
