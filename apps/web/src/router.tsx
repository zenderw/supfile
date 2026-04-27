import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import { RequireAnon } from '@/components/auth/RequireAnon';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { MainLayout } from '@/layouts/MainLayout';
import { FilesPage } from '@/pages/FilesPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { TrashPage } from '@/pages/TrashPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { OAuthCallbackPage } from '@/pages/auth/OAuthCallbackPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

const routes: RouteObject[] = [
  { path: '/auth/oauth-callback', element: <OAuthCallbackPage /> },
  {
    element: <RequireAnon />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <MainLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'files', element: <FilesPage /> },
          { path: 'files/:folderId', element: <FilesPage /> },
          { path: 'trash', element: <TrashPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes);
