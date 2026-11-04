import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const requireAuthGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.initialized()) {
    return auth.user()
      ? true
      : router.createUrlTree(['/account'], { queryParams: { returnUrl: state.url } });
  }

  const session = await auth.getSession();
  return session
    ? true
    : router.createUrlTree(['/account'], { queryParams: { returnUrl: state.url } });
};
