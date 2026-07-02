import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, Inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

type TermsSectionId =
  | 'overview'
  | 'accounts'
  | 'acceptable-use'
  | 'data'
  | 'billing'
  | 'ip'
  | 'disclaimers'
  | 'termination'
  | 'general'
  | 'contact';

interface TermsSectionLink {
  id: TermsSectionId;
  label: string;
}

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss']
})
export class TermsComponent implements AfterViewInit, OnDestroy {
  protected readonly lastUpdated = '29 May 2026';
  protected readonly sectionLinks: TermsSectionLink[] = [
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
  protected activeSectionId: TermsSectionId = 'overview';

  private readonly isBrowser: boolean;
  private fragmentSubscription?: Subscription;
  private sectionObserver?: IntersectionObserver;
  private scrollTimer?: ReturnType<typeof setTimeout>;
  private smoothScrollFragment: TermsSectionId | null = null;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    this.setupSectionObserver();
    this.fragmentSubscription = this.route.fragment.subscribe((fragment) => {
      if (!this.isKnownSectionId(fragment)) {
        return;
      }

      this.activeSectionId = fragment;
      const behavior = this.smoothScrollFragment === fragment ? 'smooth' : 'auto';
      this.smoothScrollFragment = null;
      this.scheduleSectionScroll(fragment, behavior);
    });
  }

  ngOnDestroy(): void {
    this.fragmentSubscription?.unsubscribe();
    this.sectionObserver?.disconnect();

    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
      this.scrollTimer = undefined;
    }
  }

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

  protected scrollToSection(sectionId: TermsSectionId): void {
    this.activeSectionId = sectionId;

    if (!this.isBrowser) {
      return;
    }

    if (this.route.snapshot.fragment === sectionId) {
      this.smoothScrollFragment = null;
      this.scheduleSectionScroll(sectionId, 'smooth');
      return;
    }

    this.smoothScrollFragment = sectionId;
    void this.router.navigate([], {
      relativeTo: this.route,
      fragment: sectionId
    });
  }

  protected isSectionActive(sectionId: TermsSectionId): boolean {
    return this.activeSectionId === sectionId;
  }

  private setupSectionObserver(): void {
    if (
      typeof window === 'undefined' ||
      !('IntersectionObserver' in window)
    ) {
      return;
    }

    const sections = this.sectionLinks
      .map((section) => document.getElementById(section.id))
      .filter((section): section is HTMLElement => section !== null);

    if (!sections.length) {
      return;
    }

    this.sectionObserver = new IntersectionObserver((entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      const visibleSectionId = visibleEntries[0]?.target.id;
      if (this.isKnownSectionId(visibleSectionId)) {
        this.activeSectionId = visibleSectionId;
      }
    }, {
      rootMargin: '-132px 0px -58% 0px',
      threshold: [0, 0.2, 0.6]
    });

    sections.forEach((section) => this.sectionObserver?.observe(section));
  }

  private scheduleSectionScroll(sectionId: TermsSectionId, behavior: ScrollBehavior): void {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }

    this.scrollTimer = setTimeout(() => {
      this.scrollElementIntoView(sectionId, behavior);
      this.scrollTimer = undefined;
    }, 0);
  }

  private scrollElementIntoView(sectionId: TermsSectionId, behavior: ScrollBehavior): void {
    if (typeof window === 'undefined') {
      return;
    }

    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }

    const stickyOffset = window.innerWidth <= 640 ? 104 : 124;
    const targetTop = section.getBoundingClientRect().top + window.scrollY - stickyOffset;
    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior
    });
  }

  private isKnownSectionId(sectionId: string | null | undefined): sectionId is TermsSectionId {
    return this.sectionLinks.some((section) => section.id === sectionId);
  }
}
