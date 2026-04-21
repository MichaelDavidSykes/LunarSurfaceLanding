import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss']
})
export class TermsComponent {
  protected readonly lastUpdated = '18 April 2026';
  protected readonly sectionLinks = [
    { id: 'overview', label: 'Overview' },
    { id: 'accounts', label: 'Accounts and access' },
    { id: 'acceptable-use', label: 'Acceptable use' },
    { id: 'data', label: 'Data and privacy' },
    { id: 'billing', label: 'Commercial terms' },
    { id: 'ip', label: 'Intellectual property' },
    { id: 'disclaimers', label: 'Disclaimers and liability' },
    { id: 'termination', label: 'Suspension and termination' },
    { id: 'general', label: 'General terms' },
    { id: 'contact', label: 'Contact' }
  ];

  constructor(private readonly router: Router) {}

  protected navigateHome(target?: 'solutions' | 'ai-agent' | 'contact'): void {
    if (target) {
      void this.router.navigate(['/'], { state: { landingScrollTarget: target } });
      return;
    }

    void this.router.navigate(['/']);
  }

  protected navigateToApi(): void {
    void this.router.navigate(['/api/overview']);
  }

  protected navigateToPricing(): void {
    void this.router.navigate(['/pricing']);
  }
}
