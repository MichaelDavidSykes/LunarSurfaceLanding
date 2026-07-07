import { AfterViewInit, Component, HostListener, Inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

interface DocsSidebarItem {
  id: string;
  label: string;
  children?: DocsSidebarItem[];
}

interface DocsOutlineItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-api-docs-layout',
  templateUrl: './api-docs-layout.component.html',
  styleUrls: ['./api-docs-layout.component.scss']
})
export class ApiDocsLayoutComponent implements AfterViewInit, OnDestroy {
  protected isMobileDocsMenuOpen = false;
  protected currentPage = 'overview';
  protected activeOutlineId = '';
  private readonly routerEventsSub: Subscription;
  private outlineSyncFrame: number | null = null;
  private outlineSyncFollowUpFrame: number | null = null;

  constructor(
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {
    this.syncCurrentPage(this.router.url);
    this.activeOutlineId = this.currentOutline[0]?.id ?? '';
    this.routerEventsSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navigationEvent = event as NavigationEnd;
        this.syncCurrentPage(navigationEvent.urlAfterRedirects);
        this.activeOutlineId = this.currentOutline[0]?.id ?? '';
        this.closeMobileDocsMenu();
        this.scheduleOutlineSync(navigationEvent.urlAfterRedirects);
      });
  }

  protected readonly sidebarItems: DocsSidebarItem[] = [
    {
      id: 'start',
      label: 'Start',
      children: [
        { id: 'overview', label: 'Overview' },
        { id: 'quick-start', label: 'Paths' },
        { id: 'base-configuration', label: 'Intelligence Graph' }
      ]
    },
    {
      id: 'platform-surfaces',
      label: 'APIs',
      children: [
        { id: 'endpoint-focus', label: 'Surfaces' },
        { id: 'payload-response', label: 'Payloads' }
      ]
    },
    {
      id: 'agentic-systems',
      label: 'Agents',
      children: [
        { id: 'mcp-server', label: 'MCP' }
      ]
    },
    {
      id: 'query-authoring',
      label: 'Queries',
      children: [
        { id: 'aql-playbook', label: 'AQL' }
      ]
    }
  ];

  protected readonly pageOutlines: Record<string, DocsOutlineItem[]> = {
    overview: [
      { id: 'page-overview', label: 'Overview' },
      { id: 'platform-surfaces', label: 'Main components' },
      { id: 'use-cases', label: 'Use cases' }
    ],
    'quick-start': [
      { id: 'integration-paths', label: 'Integration paths' },
      { id: 'starter-requests', label: 'Starter requests' },
      { id: 'frontend-paths', label: 'Frontend split' }
    ],
    'base-configuration': [
      { id: 'system-layers', label: 'System layers' },
      { id: 'graph-facts', label: 'Intelligence graph facts' },
      { id: 'platform-config', label: 'Platform config' }
    ],
    'endpoint-focus': [
      { id: 'public-routes', label: 'Public routes' },
      { id: 'authenticated-routes', label: 'Authenticated routes' },
      { id: 'agent-routes', label: 'Agent route' }
    ],
    'mcp-server': [
      { id: 'mcp-workflow', label: 'Workflow' },
      { id: 'protocol-details', label: 'Protocol details' },
      { id: 'mcp-resources', label: 'Resources' },
      { id: 'mcp-tools', label: 'Tools' },
      { id: 'mcp-examples', label: 'Examples' }
    ],
    'payload-response': [
      { id: 'authenticated-payloads', label: 'Authenticated API' },
      { id: 'public-payloads', label: 'Public API' },
      { id: 'mcp-payloads', label: 'MCP' },
      { id: 'payload-errors', label: 'Errors' }
    ],
    'aql-playbook': [
      { id: 'authoring-rules', label: 'AQL basics' },
      { id: 'aql-examples', label: 'Examples' }
    ]
  };

  protected get currentOutline(): DocsOutlineItem[] {
    return this.pageOutlines[this.currentPage] ?? [];
  }

  protected buildSectionHref(sectionId: string): string {
    const currentPath = this.router.url.split('#')[0];
    return `${currentPath}#${sectionId}`;
  }

  protected onOutlineClick(event: MouseEvent, sectionId: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    event.preventDefault();
    this.scrollToSection(sectionId);
  }

  protected scrollToSection(sectionId: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }

    this.openTargetIfNeeded(target);

    const top = target.getBoundingClientRect().top + window.scrollY - this.getScrollOffset();
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    this.activeOutlineId = sectionId;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${sectionId}`);
  }

  protected toggleMobileDocsMenu(): void {
    this.isMobileDocsMenuOpen = !this.isMobileDocsMenuOpen;
    this.syncBodyScrollLock();
  }

  protected closeMobileDocsMenu(): void {
    if (!this.isMobileDocsMenuOpen) {
      return;
    }
    this.isMobileDocsMenuOpen = false;
    this.syncBodyScrollLock();
  }

  private syncBodyScrollLock(): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.body.style.overflow = this.isMobileDocsMenuOpen ? 'hidden' : '';
  }

  private syncCurrentPage(url: string): void {
    const cleanUrl = url.split('#')[0].split('?')[0];
    const lastSegment = cleanUrl.split('/').filter(Boolean).pop();
    this.currentPage = !lastSegment || lastSegment === 'api' ? 'overview' : lastSegment;
  }

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    this.syncActiveOutlineWithScroll();
  }

  ngAfterViewInit(): void {
    this.scheduleOutlineSync(this.router.url);
  }

  private scheduleOutlineSync(url: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.cancelPendingOutlineSync();

    this.outlineSyncFrame = window.requestAnimationFrame(() => {
      this.outlineSyncFrame = null;
      this.outlineSyncFollowUpFrame = window.requestAnimationFrame(() => {
        this.outlineSyncFollowUpFrame = null;
        this.scrollToFragmentFromUrl(url);
        this.syncActiveOutlineWithScroll();
      });
    });
  }

  private cancelPendingOutlineSync(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.outlineSyncFrame !== null) {
      window.cancelAnimationFrame(this.outlineSyncFrame);
      this.outlineSyncFrame = null;
    }

    if (this.outlineSyncFollowUpFrame !== null) {
      window.cancelAnimationFrame(this.outlineSyncFollowUpFrame);
      this.outlineSyncFollowUpFrame = null;
    }
  }

  private scrollToFragmentFromUrl(url: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const fragment = url.split('#')[1];
    if (!fragment) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const decodedFragment = decodeURIComponent(fragment);
    const target = document.getElementById(decodedFragment);
    if (!target) {
      return;
    }

    this.openTargetIfNeeded(target);

    const top = target.getBoundingClientRect().top + window.scrollY - this.getScrollOffset();
    window.scrollTo({ top: Math.max(top, 0), behavior: 'auto' });
    this.activeOutlineId = decodedFragment;
  }

  private syncActiveOutlineWithScroll(): void {
    if (!isPlatformBrowser(this.platformId) || !this.currentOutline.length) {
      return;
    }

    const threshold = window.scrollY + this.getScrollOffset() + 16;
    let activeId = this.currentOutline[0]?.id ?? '';

    for (const item of this.currentOutline) {
      const element = document.getElementById(item.id);
      if (!element) {
        continue;
      }

      if (element.offsetTop <= threshold) {
        activeId = item.id;
      } else {
        break;
      }
    }

    this.activeOutlineId = activeId;
  }

  private getScrollOffset(): number {
    return window.innerWidth <= 980 ? 104 : 118;
  }

  private openTargetIfNeeded(target: HTMLElement): void {
    if (target instanceof HTMLDetailsElement && !target.open) {
      target.open = true;
    }
  }

  ngOnDestroy(): void {
    this.routerEventsSub.unsubscribe();
    this.cancelPendingOutlineSync();
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }
}
