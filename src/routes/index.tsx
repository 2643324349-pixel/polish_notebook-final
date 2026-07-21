import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from '@/components/Layout/RootLayout';
import { DevInflectionTestPage, GuidePage, LoginPage, NotebooksPage, SheetPage, SettingsPage, VipPage, TutorialPage, AgreementPage } from '@/pages';

const devRoutes =
  import.meta.env.DEV
    ? [
        {
          path: '/dev/inflection-test',
          element: <DevInflectionTestPage />,
        },
      ]
    : [];

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/notebooks" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  ...devRoutes,
  {
    element: <RootLayout />,
    children: [
      {
        path: '/notebooks',
        element: <NotebooksPage />,
      },
      {
        path: '/sheet/:id',
        element: <SheetPage />,
      },
      {
        path: '/guide',
        element: <GuidePage />,
      },
      {
        path: '/tutorial',
        element: <TutorialPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
      {
        path: '/vip',
        element: <VipPage />,
      },
      {
        path: '/legal/:type',
        element: <AgreementPage />,
      },
    ],
  },
]);
