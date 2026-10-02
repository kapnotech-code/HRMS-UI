import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-button',
  standalone: true,
  template: `
    <button
      [attr.type]="type"
      [disabled]="disabled"
      [class]="'ui-btn ui-btn-' + variant">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host { display: inline-block; }
    :host.block { display: block; width: 100%; }
    :host.block .ui-btn { width: 100%; }
    .ui-btn {
      font: inherit;
      font-weight: 700;
      border-radius: 8px;
      padding: 0.55rem 1rem;
      cursor: pointer;
      border: 1px solid transparent;
    }
    .ui-btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .ui-btn-primary { background: var(--color-primary); color: #fff; }
    .ui-btn-outline { background: transparent; border-color: var(--color-border); color: var(--color-text); }
    .ui-btn-ghost { background: transparent; color: var(--color-primary-dark); }
    .ui-btn-danger { background: #b91c1c; color: #fff; }
  `]
})
export class UiButtonComponent {
  @Input() variant: 'primary' | 'outline' | 'ghost' | 'danger' = 'primary';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
}
