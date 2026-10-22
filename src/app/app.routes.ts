import { Routes } from '@angular/router';
import { AuthTestComponent } from '../features/auth-test/auth-test';

export const routes: Routes = [
  {
    path: 'auth-test',
    component: AuthTestComponent,
  },

  // Conserve ici tes routes existantes.
  // La route wildcard doit rester en dernier.
  {
    path: '**',
    redirectTo: '',
  },
];
