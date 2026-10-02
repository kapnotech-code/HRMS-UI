import { Component } from '@angular/core';

@Component({
  selector: 'ui-card',
  standalone: true,
  template: `<section class="ui-card"><ng-content></ng-content></section>`,
  styles: [`
    .ui-card {
      background: var(--color-surface);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 1.25rem;
    }
  `]
})
export class UiCardComponent {}
