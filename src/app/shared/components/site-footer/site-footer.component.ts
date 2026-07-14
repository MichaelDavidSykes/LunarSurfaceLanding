import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';

type FooterLandingTarget = 'ai-agent' | 'contact';
type FooterActivePage = 'pricing' | 'terms';
type FooterLinkType = 'landing' | 'route';
type FooterVariant = 'dark' | 'light';

interface FooterLink {
  label: string;
  type: FooterLinkType;
  target?: FooterLandingTarget;
  routerLink?: string;
  activePage?: FooterActivePage;
}

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.component.html',
  styleUrls: ['./site-footer.component.scss']
})
export class SiteFooterComponent {
  @Input() activePage: FooterActivePage | null = null;
  @Input() showSocial = true;
  @Input() variant: FooterVariant = 'dark';

  protected readonly footerLinks: ReadonlyArray<FooterLink> = [
    { label: 'Products', type: 'landing', target: 'ai-agent' },
    { label: 'API docs', type: 'route', routerLink: '/api/overview' },
    { label: 'Pricing', type: 'route', routerLink: '/pricing', activePage: 'pricing' },
    { label: 'Contact', type: 'landing', target: 'contact' },
    { label: 'Terms', type: 'route', routerLink: '/terms', activePage: 'terms' }
  ];

  private readonly isBrowser: boolean;

  constructor(
    private readonly router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  protected navigateToLanding(target: FooterLandingTarget | undefined): void {
    if (!target) {
      return;
    }

    if (this.isCurrentLandingRoute() && this.scrollToLandingTarget(target)) {
      return;
    }

    void this.router.navigate(['/'], { state: { landingScrollTarget: target } });
  }

  protected getAriaCurrent(link: FooterLink): 'page' | null {
    return link.activePage && link.activePage === this.activePage ? 'page' : null;
  }

  protected trackFooterLink(_index: number, link: FooterLink): string {
    return link.label;
  }

  private isCurrentLandingRoute(): boolean {
    const path = this.router.url.split('?')[0].split('#')[0];
    return path === '' || path === '/';
  }

  private scrollToLandingTarget(target: FooterLandingTarget): boolean {
    if (!this.isBrowser || typeof document === 'undefined') {
      return false;
    }

    const selectorByTarget: Record<FooterLandingTarget, string> = {
      'ai-agent': '.product-suite-section',
      contact: '.contact-section'
    };
    const targetElement = document.querySelector(selectorByTarget[target]);
    if (!targetElement) {
      return false;
    }

    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }
}
