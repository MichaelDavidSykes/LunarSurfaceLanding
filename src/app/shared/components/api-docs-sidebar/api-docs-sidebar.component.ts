import { Component, Input } from '@angular/core';

interface SidebarItem {
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
  @Input() variant: 'default' | 'light' = 'default';

  protected trackSidebarItem(_index: number, item: SidebarItem): string {
    return item.id;
  }
}
