import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { requireAuthGuard } from './auth.guard';

@Component({ standalone: true, template: '' })
class GuardTestPage {}

describe('requireAuthGuard', () => {
  it('redirects signed-out visitors to account and keeps their destination', async () => {
    const getSession = vi.fn().mockResolvedValue(null);
    await TestBed.configureTestingModule({
      imports: [GuardTestPage],
      providers: [
        provideRouter([
          { path: 'private', canActivate: [requireAuthGuard], component: GuardTestPage },
          { path: 'account', component: GuardTestPage },
        ]),
        {
          provide: AuthService,
          useValue: { user: signal(null), initialized: signal(false), getSession },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/private');

    expect(getSession).toHaveBeenCalledOnce();
    expect(router.url).toBe('/account?returnUrl=%2Fprivate');
  });

  it('allows an authenticated visitor to open protected pages', async () => {
    await TestBed.configureTestingModule({
      imports: [GuardTestPage],
      providers: [
        provideRouter([
          { path: 'private', canActivate: [requireAuthGuard], component: GuardTestPage },
        ]),
        {
          provide: AuthService,
          useValue: {
            user: signal({ id: 'player-id' }),
            initialized: signal(true),
            getSession: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/private');

    expect(router.url).toBe('/private');
  });
});
