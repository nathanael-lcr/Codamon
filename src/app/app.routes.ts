import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../features/dashboard/dashboard').then((page) => page.DashboardComponent),
  },
  {
    path: 'account',
    loadComponent: () =>
      import('../features/account/account').then((page) => page.AccountComponent),
  },
  {
    path: 'test-carte',
    loadComponent: () =>
      import('../features/test-card/test-card').then((page) => page.TestCardComponent),
  },
  {
    path: 'pack',
    loadComponent: () => import('../features/pack-opening/pack-opening').then((page) => page.PackOpeningComponent),
  },
  {
    path: 'auth-test',
    redirectTo: 'account',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
