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
  business: string;
  enterprise: string;
}

@Component({
  selector: 'app-pricing-page',
  templateUrl: './pricing-page.component.html',
  styleUrls: ['./pricing-page.component.scss']
})
export class PricingPageComponent {
  protected readonly modelPoints: PricingModelPoint[] = [
    { label: 'Monitored queries', value: 'How many saved queries can run continuously and trigger alerts' },
    { label: 'Delivery and support', value: 'How alerts are routed, which exports are included, and what support you get' },
    { label: 'Agent and MCP usage', value: 'Separate monthly AI and MCP/API allowance' }
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
      description: 'For quick intelligence lookups and manual investigations.',
      seats: '2 seats',
      monitors: '6 monitored queries',
      refresh: 'Real-time',
      ctaLabel: 'Read the docs',
      ctaAction: 'docs',
      features: [
        '12 AI investigations / month',
        '150 MCP/API calls / month',
        'In-app and email alerts',
        'Manual exploration and saved queries'
      ],
      footnote: 'For evaluation, demos, and light ongoing query coverage.'
    },
    {
      name: 'Pro',
      price: '$50',
      cadence: '/workspace/month',
      description: 'The starter plan for smaller teams performing lightweight intelligence operations.',
      seats: '3 seats',
      monitors: '15 monitored queries',
      refresh: 'Real-time',
      ctaLabel: 'Request access',
      ctaAction: 'contact',
      features: [
        '75 AI investigations / month',
        '5,000 MCP/API calls / month',
        'In-app and email alerts',
        'Shared workspace for small teams'
      ],
      footnote: 'For small teams moving from evaluation into ongoing use.'
    },
    {
      name: 'Business',
      price: '$200',
      cadence: '/workspace/month',
      description: 'For larger teams running more advanced intelligence operations.',
      seats: '8 seats',
      monitors: '50 monitored queries',
      refresh: 'Real-time',
      featured: true,
      ctaLabel: 'Request access',
      ctaAction: 'contact',
      features: [
        '500 AI investigations / month',
        '50,000 MCP/API calls / month',
        'In-app, email, and webhook alerts',
        'CSV and PDF exports'
      ],
      footnote: 'For security and intelligence teams using LunarChain day to day.'
    },
    {
      name: 'Enterprise',
      price: 'From $2,500',
      cadence: '/month, billed annually',
      description: 'For enterprise grade intelligence operations with maxed out AI and Data Capabilities',
      seats: 'Custom',
      monitors: 'Custom',
      refresh: 'Real-time',
      ctaLabel: 'Contact sales',
      ctaAction: 'contact',
      features: [
        'Custom AI and MCP/API limits',
        'Custom alert routing and exports',
        'Deeper agentic investigations and custom source onboarding',
        'Onboarding, SLA support, and SSO when ready'
      ],
      footnote: 'For private deployments, heavier usage, and custom workflows.'
    }
  ];

  protected readonly comparisonRows: ComparisonRow[] = [
    { label: 'Seats included', free: '2', pro: '3', business: '8', enterprise: 'Custom' },
    { label: 'Monitored queries', free: '6', pro: '15', business: '50', enterprise: 'Custom' },
    { label: 'Refresh cadence', free: 'Real-time', pro: 'Real-time', business: 'Real-time', enterprise: 'Real-time' },
    { label: 'Alert delivery', free: 'In-app and email', pro: 'In-app and email', business: 'In-app, email, webhook', enterprise: 'Custom routing' },
    { label: 'Exports', free: 'None', pro: 'None', business: 'CSV, PDF', enterprise: 'CSV, PDF, STIX, JSON' },
    { label: 'AI and MCP usage', free: '12 AI / 150 MCP', pro: '75 AI / 5k MCP', business: '500 AI / 50k MCP', enterprise: 'Custom allowance' },
    { label: 'Support', free: 'Community', pro: 'Email', business: 'Priority email', enterprise: 'SLA and onboarding' }
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
