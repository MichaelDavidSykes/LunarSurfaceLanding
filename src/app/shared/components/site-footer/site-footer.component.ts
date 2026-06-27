import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';

type FooterLandingTarget = 'solutions' | 'ai-agent' | 'contact';
type FooterActivePage = 'pricing' | 'terms';
type FooterLinkType = 'landing' | 'route' | 'external';
type FooterVariant = 'dark' | 'light';

interface FooterLink {
  label: string;
  type: FooterLinkType;
  target?: FooterLandingTarget;
  routerLink?: string;
  href?: string;
  activePage?: FooterActivePage;
}

interface FooterLinkGroup {
  title: string;
  links: ReadonlyArray<FooterLink>;
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

  protected readonly linkGroups: ReadonlyArray<FooterLinkGroup> = [
    {
      title: 'Products',
      links: [
        { label: 'Our Products', type: 'landing', target: 'ai-agent' },
        { label: 'ThreatScape', type: 'landing', target: 'ai-agent' },
        { label: 'SafeRoute', type: 'landing', target: 'ai-agent' }
      ]
    },
    {
      title: 'Solutions',
      links: [
        { label: 'Custom Intelligence', type: 'landing', target: 'solutions' },
        { label: 'Cybersecurity', type: 'landing', target: 'solutions' },
        { label: 'Defence & Regional Risk', type: 'landing', target: 'solutions' },
        { label: 'Executive Protection', type: 'landing', target: 'solutions' }
      ]
    },
    {
      title: 'Platform',
      links: [
        { label: 'Documentation', type: 'route', routerLink: '/api/overview' },
        { label: 'API', type: 'route', routerLink: '/api/endpoint-focus' },
        { label: 'MCP Server', type: 'route', routerLink: '/api/mcp-server' },
        { label: 'Pricing', type: 'route', routerLink: '/pricing', activePage: 'pricing' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'Contact Us', type: 'landing', target: 'contact' },
        { label: 'Terms & Conditions', type: 'route', routerLink: '/terms', activePage: 'terms' },
        { label: 'LinkedIn', type: 'external', href: 'https://linkedin.com/company/lunarchain' }
      ]
    }
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

  protected trackLinkGroup(_index: number, group: FooterLinkGroup): string {
    return group.title;
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
      solutions: '.solutions-section',
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
