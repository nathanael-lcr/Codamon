import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthTest } from './auth-test';

describe('AuthTest', () => {
  let component: AuthTest;
  let fixture: ComponentFixture<AuthTest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthTest],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthTest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
