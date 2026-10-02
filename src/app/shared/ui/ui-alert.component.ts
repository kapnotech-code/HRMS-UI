import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-alert',
  standalone: true,
  template: `<div class="ui-alert" [class]="'ui-alert ui-alert-' + tone" role="status"><ng-content></ng-content></div>`,
  styles: [`
    .ui-alert { padding: 0.7rem 0.9rem; border-radius: 8px; border: 1px solid var(--color-border); margin: 0 0 1rem; }
    .ui-alert-info { background: color-mix(in srgb, var(--color-primary) 10%, white); color: var(--color-primary-dark); }
    .ui-alert-ok { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
    .ui-alert-warn { background: #fffbeb; color: #92400e; border-color: #fde68a; }
    .ui-alert-danger { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
  `]
})
export class UiAlertComponent {
  @Input() tone: 'info' | 'ok' | 'warn' | 'danger' = 'info';
}
