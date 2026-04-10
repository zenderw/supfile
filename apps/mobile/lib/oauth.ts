import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

export interface GoogleAuthResult {
  idToken: string;
}

export async function startGoogleOAuth(): Promise<GoogleAuthResult> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('EXPO_PUBLIC_GOOGLE_CLIENT_ID manquant');
  }

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'supfile',
    path: 'oauth-callback',
  });

  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const request = new AuthSession.AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    extraParams: { nonce: Math.random().toString(36).slice(2) },
  });

  const result = await request.promptAsync(discovery);

  if (result.type !== 'success') {
    throw new Error(result.type === 'cancel' ? 'Connexion annulée' : 'Connexion échouée');
  }

  const idToken = result.params.id_token;
  if (!idToken) {
    throw new Error('Token Google manquant dans la réponse');
  }

  return { idToken };
}
