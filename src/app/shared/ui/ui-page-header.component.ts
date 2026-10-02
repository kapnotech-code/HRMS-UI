import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-page-header',
  standalone: true,
  template: `
    <header class="ui-page-header">
      <div>
        <h1>{{ title }}</h1>
        @if (subtitle) {
          <p>{{ subtitle }}</p>
        }
      </div>
      <div class="ui-page-actions">
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: [`
    .ui-page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin: 0 0 1.25rem;
    }
    h1 { margin: 0 0 0.35rem; font-size: 1.35rem; color: var(--color-text); }
    p { margin: 0; color: var(--color-muted); }
    .ui-page-actions { display: flex; gap: 8px; align-items: center; }
  `]
})
export class UiPageHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
}
