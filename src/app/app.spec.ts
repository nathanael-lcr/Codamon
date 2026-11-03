import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { PackOpeningNavigationService } from './core/cards/pack-opening-navigation.service';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { user: signal(null), initialized: signal(true) },
        },
      ],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('should request the pack page to return home when its nav link is clicked', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const packLinks = root.querySelectorAll<HTMLAnchorElement>('a[routerLink="/"]');
    expect(packLinks.length).toBeGreaterThan(0);
    packLinks[0]?.click();

    expect(TestBed.inject(PackOpeningNavigationService).homeRequest()).toBe(1);
  });
});
