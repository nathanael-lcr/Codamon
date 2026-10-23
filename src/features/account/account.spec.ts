import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../app/core/auth/auth.service';
import { AccountComponent } from './account';

describe('AccountComponent', () => {
  let fixture: ComponentFixture<AccountComponent>;
  let signIn: ReturnType<typeof vi.fn>;
  let signUp: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    signIn = vi.fn().mockResolvedValue({});
    signUp = vi.fn().mockResolvedValue({ session: null });

    await TestBed.configureTestingModule({
      imports: [AccountComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user: signal(null),
            initialized: signal(true),
            signIn,
            signUp,
            signOut: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountComponent);
    fixture.detectChanges();
  });

  it('signs in with the entered credentials', async () => {
    const email = fixture.nativeElement.querySelector('#account-email') as HTMLInputElement;
    const password = fixture.nativeElement.querySelector('#account-password') as HTMLInputElement;
    email.value = 'user@example.com';
    email.dispatchEvent(new Event('input'));
    password.value = 'password123';
    password.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(signIn).toHaveBeenCalledWith('user@example.com', 'password123');
  });

  it('shows the email confirmation message after registration', async () => {
    (fixture.nativeElement.querySelector('button[aria-pressed="false"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const email = fixture.nativeElement.querySelector('#account-email') as HTMLInputElement;
    const password = fixture.nativeElement.querySelector('#account-password') as HTMLInputElement;
    email.value = 'new@example.com';
    email.dispatchEvent(new Event('input'));
    password.value = 'password123';
    password.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(signUp).toHaveBeenCalledWith('new@example.com', 'password123');
    expect(fixture.nativeElement.textContent).toContain(
      'Compte créé. Consulte tes e-mails pour confirmer ton inscription.',
    );
  });
});
