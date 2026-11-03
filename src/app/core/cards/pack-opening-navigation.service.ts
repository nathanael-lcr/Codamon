import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PackOpeningNavigationService {
  private readonly _homeRequest = signal(0);
  readonly homeRequest = this._homeRequest.asReadonly();

  returnHome(): void {
    this._homeRequest.update((request) => request + 1);
  }
}
