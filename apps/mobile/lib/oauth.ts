import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

export interface GoogleAuthResult {
  idToken: string;
}

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export async function startGoogleOAuth(): Promise<GoogleAuthResult> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      'EXPO_PUBLIC_GOOGLE_CLIENT_ID manquant. Renseignez-le dans le .env à la racine.',
    );
  }

  // Avec Expo Go on passe par le proxy auth.expo.io (Google iOS native ne marche pas dans Expo Go)
  // En build natif, on utilise le scheme supfile://
  const isExpoGo = !process.env.EXPO_PUBLIC_NATIVE_BUILD;
  const redirectUri = isExpoGo
    ? 'https://auth.expo.io/@wayl-zender/supfile'
    : AuthSession.makeRedirectUri({ scheme: 'supfile', path: 'oauth-callback' });

  const request = new AuthSession.AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const result = await request.promptAsync(discovery);

  if (result.type !== 'success') {
    throw new Error(result.type === 'cancel' ? 'Connexion annulée' : 'Connexion échouée');
  }

  const code = result.params.code;
  if (!code) {
    throw new Error("Code d'autorisation Google manquant");
  }

  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId: GOOGLE_CLIENT_ID,
      code,
      redirectUri,
      extraParams: {
        code_verifier: request.codeVerifier ?? '',
      },
    },
    discovery,
  );

  const idToken = tokenResponse.idToken;
  if (!idToken) {
    throw new Error('id_token absent de la réponse Google');
  }

  return { idToken };
}
