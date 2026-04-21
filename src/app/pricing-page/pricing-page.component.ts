import { Component } from '@angular/core';
import { Router } from '@angular/router';

type PricingLandingTarget = 'solutions' | 'ai-agent' | 'contact';
type PlanCtaAction = 'docs' | 'contact';

interface PricingModelPoint {
  label: string;
  value: string;
}

interface PricingPlan {
  name: string;
  price: string;
  cadence: string;
  description: string;
  seats: string;
  monitors: string;
  refresh: string;
  badge?: string;
  featured?: boolean;
  ctaLabel: string;
  ctaAction: PlanCtaAction;
  features: string[];
  footnote: string;
}

interface ComparisonRow {
  label: string;
  free: string;
  pro: string;
  enterprise: string;
}

@Component({
  selector: 'app-pricing-page',
  templateUrl: './pricing-page.component.html',
  styleUrls: ['./pricing-page.component.scss']
})
export class PricingPageComponent {
  protected readonly modelPoints: PricingModelPoint[] = [
    { label: 'Primary limit', value: 'Active monitored queries' },
    { label: 'Metered separately', value: 'AI investigations and MCP/API calls' },
    { label: 'Paid tiers add', value: 'More retention, broader delivery, and support' }
  ];

  protected readonly includedFeatures: string[] = [
    'Shared workspace',
    'Graph explorer',
    'Saved queries',
    'Manual investigations',
    'MCP access'
  ];

  protected readonly plans: PricingPlan[] = [
    {
      name: 'Free',
      price: '$0',
      cadence: '/month',
      description: 'Explore the graph, test the MCP workflow, and keep a small number of monitors running.',
      seats: '2 seats',
      monitors: '5 monitored queries',
      refresh: 'Real-time',
      ctaLabel: 'Read the docs',
      ctaAction: 'docs',
      features: [
        '14-day history',
        '25 AI investigations / month',
        '1,000 MCP/API calls / month',
        'In-app and email alerts',
        'Manual exploration and saved queries'
      ],
      footnote: 'For evaluation, demos, and light recurring monitoring.'
    },
    {
      name: 'Pro',
      price: '$149',
      cadence: '/workspace/month',
      description: 'The operational plan for teams that want more recurring coverage and stronger delivery.',
      seats: '5 seats',
      monitors: '20 monitored queries',
      refresh: 'Real-time',
      badge: 'Recommended',
      featured: true,
      ctaLabel: 'Request access',
      ctaAction: 'contact',
      features: [
        '180-day history',
        '300 AI investigations / month',
        '25,000 MCP/API calls / month',
        'In-app, email, and webhook alerts',
        'CSV and PDF exports'
      ],
      footnote: 'For analyst teams running LunarChain as part of daily workflow.'
    },
    {
      name: 'Enterprise',
      price: 'From $2,500',
      cadence: '/month, billed annually',
      description: 'For larger deployments that need more coverage, custom delivery, and commercial support.',
      seats: '10+ seats',
      monitors: '100+ monitored queries',
      refresh: 'Real-time',
      ctaLabel: 'Contact sales',
      ctaAction: 'contact',
      features: [
        '24 months+ retention',
        'Custom AI and MCP/API limits',
        'Custom alert routing and exports',
        'Deeper agentic investigations and custom source onboarding',
        'Onboarding, SLA support, and SSO when ready'
      ],
      footnote: 'For private deployments, heavier usage, and custom workflows.'
    }
  ];

  protected readonly comparisonRows: ComparisonRow[] = [
    { label: 'Seats included', free: '2', pro: '5', enterprise: '10+' },
    { label: 'Monitored queries', free: '5', pro: '20', enterprise: '100+' },
    { label: 'Refresh cadence', free: 'Real-time', pro: 'Real-time', enterprise: 'Real-time' },
    { label: 'Retention', free: '14 days', pro: '180 days', enterprise: '24 months+' },
    { label: 'Alert delivery', free: 'In-app and email', pro: 'In-app, email, webhook', enterprise: 'Custom routing' },
    { label: 'Exports', free: 'None', pro: 'CSV, PDF', enterprise: 'CSV, PDF, STIX, JSON' },
    { label: 'AI and MCP usage', free: 'Starter allowance', pro: 'Operational allowance', enterprise: 'Custom allowance' },
    { label: 'Support', free: 'Community', pro: 'Priority email', enterprise: 'SLA and onboarding' }
  ];

  constructor(private readonly router: Router) {}

  protected navigateHome(target?: PricingLandingTarget): void {
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

  protected handlePlanCta(action: PlanCtaAction): void {
    if (action === 'docs') {
      this.navigateToApi();
      return;
    }

    this.navigateHome('contact');
  }
}
