import { Component, EventEmitter, Inject, Input, OnChanges, OnDestroy, OnInit, Output, PLATFORM_ID, SimpleChanges } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

type ToolbarAction = 'solutions' | 'ai' | 'api' | 'pricing' | 'contact';
type ToolbarContext = 'landing' | 'api';

@Component({
  selector: 'app-top-toolbar',
  templateUrl: './top-toolbar.component.html',
  styleUrls: ['./top-toolbar.component.scss']
})
export class TopToolbarComponent implements OnInit, OnChanges, OnDestroy {
  private static lastVisualScrolled = false;
  private static lastUnmountAt = 0;
  private static lastContext: ToolbarContext | null = null;

  @Input() context: ToolbarContext = 'landing';
  @Input() isScrolled = false;
  @Input() forceScrolled = false;
  @Input() activeAction: ToolbarAction | null = null;

  @Output() solutionsClick = new EventEmitter<void>();
  @Output() aiAgentClick = new EventEmitter<void>();
  @Output() apiClick = new EventEmitter<void>();
  @Output() pricingClick = new EventEmitter<void>();
  @Output() contactClick = new EventEmitter<void>();
  @Output() mobileMenuOpenChange = new EventEmitter<boolean>();
  @Output() docsMenuClick = new EventEmitter<void>();

  protected isMobileMenuOpen = false;
  protected disableTransitions = false;
  protected readonly loginUrl = `${environment.appUrl}/login`;
  private forcedScrollVisual = false;
  private forceScrollTimer: ReturnType<typeof setTimeout> | null = null;
  private transitionUnlockTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {}

  ngOnInit(): void {
    const now = Date.now();
    const justSwitchedPages = now - TopToolbarComponent.lastUnmountAt < 1400;
    const cameFromApi = TopToolbarComponent.lastContext === 'api';

    // Prevent API -> landing toolbar morph animation during route/render handoff.
    if (this.context === 'landing' && cameFromApi && justSwitchedPages) {
      this.disableTransitions = true;
      this.transitionUnlockTimer = setTimeout(() => {
        this.disableTransitions = false;
      }, 420);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['forceScrolled']) {
      return;
    }

    if (this.forceScrolled) {
      const now = Date.now();
      const justSwitchedPages = now - TopToolbarComponent.lastUnmountAt < 900;
      const shouldKeepState =
        justSwitchedPages && TopToolbarComponent.lastVisualScrolled;

      // Keep prior visual state on quick route switches to avoid a re-init flash.
      if (shouldKeepState) {
        this.forcedScrollVisual = true;
        if (this.forceScrollTimer) {
          clearTimeout(this.forceScrollTimer);
          this.forceScrollTimer = null;
        }
        return;
      }

      // Otherwise animate into narrowed mode.
      this.forcedScrollVisual = false;
      if (this.forceScrollTimer) {
        clearTimeout(this.forceScrollTimer);
      }
      this.forceScrollTimer = setTimeout(() => {
        this.forcedScrollVisual = true;
      }, 60);
      return;
    }

    this.forcedScrollVisual = false;
    if (this.forceScrollTimer) {
      clearTimeout(this.forceScrollTimer);
      this.forceScrollTimer = null;
    }
  }

  ngOnDestroy(): void {
    TopToolbarComponent.lastVisualScrolled = this.taskbarScrolled;
    TopToolbarComponent.lastUnmountAt = Date.now();
    TopToolbarComponent.lastContext = this.context;

    if (this.forceScrollTimer) {
      clearTimeout(this.forceScrollTimer);
      this.forceScrollTimer = null;
    }

    if (this.transitionUnlockTimer) {
      clearTimeout(this.transitionUnlockTimer);
      this.transitionUnlockTimer = null;
    }

    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  protected get taskbarScrolled(): boolean {
    return this.forcedScrollVisual || this.isScrolled || this.isMobileMenuOpen;
  }

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.mobileMenuOpenChange.emit(this.isMobileMenuOpen);
    if (this.isMobileMenuOpen && isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    } else if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  protected onAction(action: ToolbarAction): void {
    if (this.context === 'landing') {
      this.emitLandingAction(action);
    } else {
      this.handleApiAction(action);
    }

    if (this.isMobileMenuOpen) {
      this.toggleMobileMenu();
    }
  }

  protected onDocsMenuClick(): void {
    this.docsMenuClick.emit();
  }

  protected onBrandClick(): void {
    if (this.isMobileMenuOpen) {
      this.toggleMobileMenu();
    }

    if (this.context === 'landing' && this.isCurrentLandingRoute()) {
      if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    this.router.navigate(['/'], { state: { landingScrollTarget: 'top' } });
  }

  protected isActionActive(action: ToolbarAction): boolean {
    if (this.activeAction) {
      return this.activeAction === action;
    }

    return this.context === 'api' && action === 'api';
  }

  private emitLandingAction(action: ToolbarAction): void {
    switch (action) {
      case 'solutions':
        this.solutionsClick.emit();
        break;
      case 'ai':
        this.aiAgentClick.emit();
        break;
      case 'api':
        this.apiClick.emit();
        break;
      case 'pricing':
        this.pricingClick.emit();
        break;
      case 'contact':
        this.contactClick.emit();
        break;
    }
  }

  private handleApiAction(action: ToolbarAction): void {
    if (action === 'api') {
      this.router.navigateByUrl('/api/overview');
      return;
    }

    if (action === 'pricing') {
      this.router.navigateByUrl('/pricing');
      return;
    }

    const landingTargetByAction: Record<Exclude<ToolbarAction, 'api' | 'pricing'>, string> = {
      solutions: 'solutions',
      ai: 'ai-agent',
      contact: 'contact'
    };
    const landingScrollTarget = landingTargetByAction[action as Exclude<ToolbarAction, 'api' | 'pricing'>];
    this.router.navigate(['/'], { state: { landingScrollTarget } });
  }

  private isCurrentLandingRoute(): boolean {
    const path = this.router.url.split('?')[0].split('#')[0];
    return path === '' || path === '/';
  }
}
