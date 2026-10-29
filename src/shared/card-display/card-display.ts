import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Card } from '../../app/core/cards/card.model';

@Component({
  selector: 'app-card-display',
  standalone: true,
  templateUrl: './card-display.html',
  styleUrl: './card-display.css',
})
export class CardDisplayComponent {
  readonly card = input.required<Card>();
  readonly compact = input(false);
  readonly flippable = input(false);
  readonly flipped = input(false);
  protected readonly imageFailed = signal(false);
  protected readonly tiltX = signal(0);
  protected readonly tiltY = signal(0);
  protected readonly pointerX = signal(50);
  protected readonly pointerY = signal(50);
  protected readonly displayImage = computed(() => {
    if (this.imageFailed()) return null;
    return this.card().image_url || this.card().thumbnail_url;
  });
  // Largeur de référence du dessin de la carte : 384 px.
  private static readonly DESIGN_WIDTH = 384;

  private readonly destroyRef = inject(DestroyRef);
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');

  // Largeur maximale affichée. La carte peut être plus petite
  // si la grille lui laisse moins de place.
  readonly width = input(384);

  protected readonly scale = signal(1);

  constructor() {
    // S'exécute après le rendu, uniquement dans le navigateur.
    afterNextRender(() => {
      const element = this.viewport().nativeElement;

      const observer = new ResizeObserver(([entry]) => {
        if (!entry) return;

        this.scale.set(entry.contentRect.width / CardDisplayComponent.DESIGN_WIDTH);
      });

      observer.observe(element);

      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected onImageError(): void {
    this.imageFailed.set(true);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (
      event.pointerType !== 'mouse' ||
      typeof window === 'undefined' ||
      !window.matchMedia(
        '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
      ).matches
    ) {
      return;
    }

    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return;

    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    this.tiltX.set((0.5 - y) * 14);
    this.tiltY.set((x - 0.5) * 14);
    this.pointerX.set(x * 100);
    this.pointerY.set(y * 100);
  }

  protected resetTilt(): void {
    this.tiltX.set(0);
    this.tiltY.set(0);
    this.pointerX.set(50);
    this.pointerY.set(50);
  }

  protected formatLabel(value: string): string {
    return value.replaceAll('_', ' ');
  }
}
