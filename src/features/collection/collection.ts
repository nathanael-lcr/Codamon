import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../app/core/auth/auth.service';
import { CollectionService } from '../../app/core/collection/collection.service';
import { CardDisplayComponent } from '../../shared/card-display/card-display';

@Component({
  selector: 'app-collection',
  standalone: true,
  imports: [RouterLink, CardDisplayComponent],
  templateUrl: './collection.html',
})
export class CollectionComponent {
  protected readonly auth = inject(AuthService);
  protected readonly collection = inject(CollectionService);
}