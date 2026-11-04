import { Routes } from '@angular/router';
import { requireAuthGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [requireAuthGuard],
    loadComponent: () =>
      import('../features/pack-opening/pack-opening').then((page) => page.PackOpeningComponent),
  },
  {
    path: 'collection',
    canActivate: [requireAuthGuard],
    loadComponent: () =>
      import('../features/collection/collection').then((page) => page.CollectionComponent),
  },
  {
    path: 'dashboard',
    canActivate: [requireAuthGuard],
    loadComponent: () =>
      import('../features/dashboard/dashboard').then((page) => page.DashboardComponent),
  },
  {
    path: 'test-carte',
    canActivate: [requireAuthGuard],
    loadComponent: () =>
      import('../features/test-card/test-card').then((page) => page.TestCardComponent),
  },
  {
    path: 'echanges',
    canActivate: [requireAuthGuard],
    loadComponent: () =>
      import('../features/exchanges/exchanges').then((page) => page.ExchangesComponent),
  },
  {
    path: 'marche',
    canActivate: [requireAuthGuard],
    loadComponent: () => import('../features/market/market').then((page) => page.MarketComponent),
  },
  {
    path: 'classement',
    canActivate: [requireAuthGuard],
    loadComponent: () =>
      import('../features/classement/classement').then((page) => page.ClassementComponent),
  },
  {
    path: 'account',
    loadComponent: () =>
      import('../features/account/account').then((page) => page.AccountComponent),
  },
  {
    path: 'auth-test',
    redirectTo: 'account',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
