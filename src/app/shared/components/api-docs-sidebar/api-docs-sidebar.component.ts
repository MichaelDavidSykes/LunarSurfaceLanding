import { Component, Input } from '@angular/core';

interface SidebarItem {
  path?: string;
  id: string;
  label: string;
  children?: SidebarItem[];
}

@Component({
  selector: 'app-api-docs-sidebar',
  templateUrl: './api-docs-sidebar.component.html',
  styleUrls: ['./api-docs-sidebar.component.scss']
})
export class ApiDocsSidebarComponent {
  @Input() title = 'Documentation';
  @Input() kicker = 'LunarChain API';
  @Input() items: SidebarItem[] = [];
  @Input() basePath = '/api';
  @Input() variant: 'default' | 'light' = 'default';

  protected buildPath(item: SidebarItem): string {
    const segment = item.path ?? item.id;
    return `${this.basePath}/${segment}`;
  }
}
