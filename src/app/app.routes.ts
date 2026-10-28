import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../features/dashboard/dashboard').then(
        (page) => page.DashboardComponent
      ),
  },
  {
    path: 'pack',
    loadComponent: () =>
      import('../features/pack-opening/pack-opening').then(
        (page) => page.PackOpeningComponent
      ),
  },
  {
    path: 'test-carte',
    loadComponent: () =>
      import('../features/test-card/test-card').then(
        (page) => page.TestCardComponent
      ),
  },
  {
    path: 'echanges',
    loadComponent: () =>
      import('../features/exchanges/exchanges').then(
        (page) => page.ExchangesComponent
      ),
  },
  {
    path: 'marche',
    loadComponent: () =>
      import('../features/market/market').then(
        (page) => page.MarketComponent
      ),
  },
  {
    path: 'classement',
    loadComponent: () =>
      import('../features/classement/classement').then(
        (page) => page.ClassementComponent
      ),
  },
  {
    path: 'account',
    loadComponent: () =>
      import('../features/account/account').then(
        (page) => page.AccountComponent
      ),
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