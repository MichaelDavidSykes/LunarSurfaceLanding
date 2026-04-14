import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

interface DocsSidebarItem {
  id: string;
  label: string;
  path?: string;
  children?: DocsSidebarItem[];
}

@Component({
  selector: 'app-api-docs-layout',
  templateUrl: './api-docs-layout.component.html',
  styleUrls: ['./api-docs-layout.component.scss']
})
export class ApiDocsLayoutComponent implements OnDestroy {
  protected isMobileDocsMenuOpen = false;
  private readonly routerEventsSub: Subscription;

  constructor(private readonly router: Router) {
    this.routerEventsSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.closeMobileDocsMenu());
  }

  protected readonly sidebarItems: DocsSidebarItem[] = [
    {
      id: 'getting-started',
      label: 'Getting Started',
      path: 'overview',
      children: [
        { id: 'overview', label: 'Platform Overview', path: 'overview' },
        { id: 'quick-start', label: 'Integration Paths', path: 'quick-start' },
        { id: 'base-configuration', label: 'Architecture & Graph Model', path: 'base-configuration' }
      ]
    },
    {
      id: 'platform-surfaces',
      label: 'Platform Surfaces',
      path: 'endpoint-focus',
      children: [
        { id: 'endpoint-focus', label: 'API Surfaces', path: 'endpoint-focus' },
        { id: 'payload-response', label: 'Request & Response', path: 'payload-response' }
      ]
    },
    {
      id: 'agentic-systems',
      label: 'Agentic Systems',
      path: 'mcp-server',
      children: [
        { id: 'mcp-server', label: 'MCP & Agent Workflows', path: 'mcp-server' }
      ]
    },
    {
      id: 'query-authoring',
      label: 'Query Authoring',
      path: 'aql-playbook',
      children: [
        { id: 'aql-playbook', label: 'AQL Playbook', path: 'aql-playbook' }
      ]
    }
  ];

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

  ngOnDestroy(): void {
    this.routerEventsSub.unsubscribe();
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }
}
