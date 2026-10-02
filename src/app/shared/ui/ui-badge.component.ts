import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-badge',
  standalone: true,
  template: `<span class="ui-badge" [class]="'ui-badge ui-badge-' + tone"><ng-content></ng-content></span>`,
  styles: [`
    .ui-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
    }
    .ui-badge-neutral { background: var(--color-border); color: var(--color-text); }
    .ui-badge-primary { background: color-mix(in srgb, var(--color-primary) 18%, white); color: var(--color-primary-dark); }
    .ui-badge-danger { background: #fee2e2; color: #991b1b; }
  `]
})
export class UiBadgeComponent {
  @Input() tone: 'neutral' | 'primary' | 'danger' = 'neutral';
}
