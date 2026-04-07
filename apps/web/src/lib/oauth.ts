const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export function startGoogleOAuth(): void {
  window.location.href = `${apiUrl}/auth/google`;
}
