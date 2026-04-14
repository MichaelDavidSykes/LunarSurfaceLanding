import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

interface DocsSidebarItem {
  id: string;
  label: string;
  path?: string;
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
export class ApiDocsLayoutComponent implements OnDestroy {
  protected isMobileDocsMenuOpen = false;
  protected currentPage = 'overview';
  private readonly routerEventsSub: Subscription;

  constructor(private readonly router: Router) {
    this.syncCurrentPage(this.router.url);
    this.routerEventsSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.syncCurrentPage((event as NavigationEnd).urlAfterRedirects);
        this.closeMobileDocsMenu();
      });
  }

  protected readonly sidebarItems: DocsSidebarItem[] = [
    {
      id: 'start',
      label: 'Start',
      path: 'overview',
      children: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'quick-start', label: 'Paths', path: 'quick-start' },
        { id: 'base-configuration', label: 'Graph Model', path: 'base-configuration' }
      ]
    },
    {
      id: 'platform-surfaces',
      label: 'APIs',
      path: 'endpoint-focus',
      children: [
        { id: 'endpoint-focus', label: 'Surfaces', path: 'endpoint-focus' },
        { id: 'payload-response', label: 'Payloads', path: 'payload-response' }
      ]
    },
    {
      id: 'agentic-systems',
      label: 'Agents',
      path: 'mcp-server',
      children: [
        { id: 'mcp-server', label: 'MCP', path: 'mcp-server' }
      ]
    },
    {
      id: 'query-authoring',
      label: 'Queries',
      path: 'aql-playbook',
      children: [
        { id: 'aql-playbook', label: 'AQL', path: 'aql-playbook' }
      ]
    }
  ];

  protected readonly pageOutlines: Record<string, DocsOutlineItem[]> = {
    overview: [
      { id: 'page-overview', label: 'Overview' },
      { id: 'platform-surfaces', label: 'Platform surfaces' },
      { id: 'use-cases', label: 'Use cases' }
    ],
    'quick-start': [
      { id: 'integration-paths', label: 'Integration paths' },
      { id: 'starter-requests', label: 'Starter requests' },
      { id: 'frontend-paths', label: 'Frontend split' }
    ],
    'base-configuration': [
      { id: 'system-layers', label: 'System layers' },
      { id: 'graph-facts', label: 'Graph facts' },
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
      { id: 'authoring-rules', label: 'Authoring rules' },
      { id: 'aql-examples', label: 'Examples' }
    ]
  };

  protected get currentOutline(): DocsOutlineItem[] {
    return this.pageOutlines[this.currentPage] ?? [];
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

  ngOnDestroy(): void {
    this.routerEventsSub.unsubscribe();
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }
}
