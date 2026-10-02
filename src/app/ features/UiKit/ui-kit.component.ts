import { Component } from '@angular/core';
import { UiAlertComponent, UiBadgeComponent, UiButtonComponent, UiCardComponent, UiPageHeaderComponent } from '../../shared/ui';

@Component({
  selector: 'app-ui-kit',
  standalone: true,
  imports: [UiPageHeaderComponent, UiCardComponent, UiButtonComponent, UiAlertComponent, UiBadgeComponent],
  template: `
    <ui-page-header title="UI kit" subtitle="Shared primitives on design tokens. Use these in restyles (phase 5)." />

    <ui-card>
      <h2>Buttons</h2>
      <div class="row">
        <ui-button>Primary</ui-button>
        <ui-button variant="outline">Outline</ui-button>
        <ui-button variant="ghost">Ghost</ui-button>
        <ui-button variant="danger">Danger</ui-button>
        <ui-button [disabled]="true">Disabled</ui-button>
      </div>
    </ui-card>

    <ui-card>
      <h2>Alerts</h2>
      <ui-alert tone="info">Info on token colors</ui-alert>
      <ui-alert tone="ok">Saved successfully</ui-alert>
      <ui-alert tone="warn">Grace period</ui-alert>
      <ui-alert tone="danger">Payment required</ui-alert>
    </ui-card>

    <ui-card>
      <h2>Badges</h2>
      <div class="row">
        <ui-badge>Neutral</ui-badge>
        <ui-badge tone="primary">Primary</ui-badge>
        <ui-badge tone="danger">Pending</ui-badge>
      </div>
    </ui-card>
  `,
  styles: [`
    :host { display: block; max-width: 800px; }
    ui-card { display: block; margin-bottom: 1rem; }
    h2 { margin: 0 0 0.75rem; font-size: 1rem; }
    .row { display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; }
  `]
})
export class UiKitComponent {}
