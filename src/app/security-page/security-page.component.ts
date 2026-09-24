import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Meta, MetaDefinition, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

const PAGE_TITLE = 'LunarChain Security | Intelligence-led Offensive Security';
const DESCRIPTION = 'Meet LunarChain Security: manual penetration testing and red team exercises informed by threat intelligence, from exposure discovery to verified remediation.';
const PAGE_URL = 'https://lunarchain.net/security';

@Component({
  selector: 'app-security-page',
  templateUrl: './security-page.component.html',
  styleUrls: ['./security-page.component.scss'],
  standalone: false
})
export class SecurityPageComponent implements OnInit, OnDestroy {
  private canonical: HTMLLinkElement | null = null;
  private readonly tags: MetaDefinition[] = [
    { name: 'description', content: DESCRIPTION },
    { property: 'og:title', content: PAGE_TITLE },
    { property: 'og:description', content: DESCRIPTION },
    { property: 'og:url', content: PAGE_URL },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'LunarChain' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: PAGE_TITLE },
    { name: 'twitter:description', content: DESCRIPTION }
  ];

  constructor(
    private readonly router: Router,
    private readonly title: Title,
    private readonly meta: Meta,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  ngOnInit(): void {
    this.title.setTitle(PAGE_TITLE);
    this.tags.forEach((tag) => this.meta.updateTag(tag));
    this.canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?? this.document.createElement('link');
    this.canonical.rel = 'canonical';
    this.canonical.href = PAGE_URL;
    this.document.head.appendChild(this.canonical);
  }

  ngOnDestroy(): void {
    // Other routes currently use the index.html defaults. Do not leave this
    // page's canonical or social metadata behind after client-side navigation.
    this.title.setTitle('LunarChain');
    this.tags.forEach((tag) => this.meta.removeTag(
      tag.name ? `name="${tag.name}"` : `property="${tag.property}"`
    ));
    this.canonical?.remove();
  }

  protected navigateHome(target: 'solutions' | 'ai-agent' | 'contact'): void {
    void this.router.navigate(['/'], { state: { landingScrollTarget: target } });
  }

  protected navigateTo(path: string): void {
    void this.router.navigate([path]);
  }
}
