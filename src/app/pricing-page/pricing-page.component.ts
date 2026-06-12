import { Component } from '@angular/core';
import { Router } from '@angular/router';

type PricingLandingTarget = 'solutions' | 'ai-agent' | 'contact';
type PlanCtaAction = 'docs' | 'contact';

interface PricingMetric {
  label: string;
  value: string;
}

interface PricingPlan {
  name: string;
  price: string;
  cadence: string;
  description: string;
  metrics: PricingMetric[];
  featured?: boolean;
  ctaLabel: string;
  ctaAction: PlanCtaAction;
  features: string[];
  footnote: string;
}

interface ProductPricingOverview {
  label: string;
  description: string;
}

@Component({
  selector: 'app-pricing-page',
  templateUrl: './pricing-page.component.html',
  styleUrls: ['./pricing-page.component.scss']
})
export class PricingPageComponent {
  protected readonly pricingOverview: ProductPricingOverview[] = [
    {
      label: 'ThreatScape',
      description: 'Subscription pricing for the analyst workspace, monitoring, alerting, reporting, API usage, and MCP access.'
    },
    {
      label: 'SafeRoute',
      description: 'Scoped pricing for convoy route planning, route risk layers, briefings, and operational deployment support.'
    },
    {
      label: 'Custom intelligence solutions',
      description: 'Quoted separately for specialised dashboards, workflows, source coverage, and private deployments.'
    }
  ];

  protected readonly threatscapePlans: PricingPlan[] = [
    {
      name: 'Free',
      price: '$0',
      cadence: '/month',
      description: 'For quick intelligence lookups and manual investigations.',
      metrics: [
        { label: 'Seats', value: '2 seats' },
        { label: 'Coverage', value: '6 active queries' },
        { label: 'Delivery', value: 'In-app and email' }
      ],
      ctaLabel: 'Read the docs',
      ctaAction: 'docs',
      features: [
        'Graph explorer and saved queries',
        'Manual investigations',
        '12 AI investigations / month',
        '150 MCP/API calls / month'
      ],
      footnote: 'For evaluation, demos, and light ongoing query coverage.'
    },
    {
      name: 'Pro',
      price: '$50',
      cadence: '/workspace/month',
      description: 'The starter plan for smaller teams performing lightweight intelligence operations.',
      metrics: [
        { label: 'Seats', value: '3 seats' },
        { label: 'Coverage', value: '15 active queries' },
        { label: 'Delivery', value: 'In-app and email' }
      ],
      ctaLabel: 'Request access',
      ctaAction: 'contact',
      features: [
        'Shared workspace for small teams',
        'Manual exploration and saved queries',
        '75 AI investigations / month',
        '5,000 MCP/API calls / month'
      ],
      footnote: 'For small teams moving from evaluation into ongoing use.'
    },
    {
      name: 'Business',
      price: '$200',
      cadence: '/workspace/month',
      description: 'For larger teams running more advanced intelligence operations.',
      metrics: [
        { label: 'Seats', value: '8 seats' },
        { label: 'Coverage', value: '50 active queries' },
        { label: 'Delivery', value: 'Email and webhook' }
      ],
      featured: true,
      ctaLabel: 'Request access',
      ctaAction: 'contact',
      features: [
        'In-app, email, and webhook alerts',
        'CSV and PDF exports',
        '500 AI investigations / month',
        '50,000 MCP/API calls / month'
      ],
      footnote: 'For security and intelligence teams using LunarChain day to day.'
    },
    {
      name: 'Enterprise',
      price: 'From $2,500',
      cadence: '/month, billed annually',
      description: 'For private deployments, custom workflows, and higher-volume intelligence operations.',
      metrics: [
        { label: 'Seats', value: 'Custom' },
        { label: 'Coverage', value: 'Custom' },
        { label: 'Delivery', value: 'Custom routing' }
      ],
      ctaLabel: 'Contact us',
      ctaAction: 'contact',
      features: [
        'Custom AI and MCP/API limits',
        'Custom alert routing and exports',
        'Custom source onboarding',
        'Onboarding, SLA support, and SSO when ready'
      ],
      footnote: 'For private deployments, heavier usage, and custom workflows.'
    }
  ];

  protected readonly saferoutePlans: PricingPlan[] = [
    {
      name: 'SafeRoute Evaluation',
      price: 'Scoped',
      cadence: '/pilot',
      description: 'For teams validating route planning and movement-risk workflows on a focused route set.',
      metrics: [
        { label: 'Users', value: 'Core planning team' },
        { label: 'Routes', value: 'Pilot route set' },
        { label: 'Delivery', value: 'Setup workshop' }
      ],
      ctaLabel: 'Contact us',
      ctaAction: 'contact',
      features: [
        'SafeRoute planner configuration',
        'Primary and alternate route review',
        'Basic risk layers and handoff exports',
        'Pilot support for evaluation'
      ],
      footnote: 'Best for proving the workflow before a wider operational rollout.'
    },
    {
      name: 'SafeRoute Operations',
      price: 'Scoped',
      cadence: '/month',
      description: 'For active security teams planning, briefing, and monitoring protected movements.',
      metrics: [
        { label: 'Users', value: 'Protective operations team' },
        { label: 'Routes', value: 'Active route portfolio' },
        { label: 'Delivery', value: 'Monitoring and alerts' }
      ],
      featured: true,
      ctaLabel: 'Contact us',
      ctaAction: 'contact',
      features: [
        'Convoy, trip, vehicle, and waypoint management',
        'Route risk comparison and readiness checks',
        'Live risk layers around movement corridors',
        'Briefing packs and operational handoff exports'
      ],
      footnote: 'Built for teams that need repeatable route intelligence workflows.'
    },
    {
      name: 'SafeRoute Enterprise',
      price: 'Custom',
      cadence: '/deployment',
      description: 'For larger protective operations, private deployments, and custom regional intelligence coverage.',
      metrics: [
        { label: 'Deployment', value: 'Private or dedicated' },
        { label: 'Data', value: 'Custom map and risk layers' },
        { label: 'Support', value: 'Onboarding and SLA' }
      ],
      ctaLabel: 'Contact us',
      ctaAction: 'contact',
      features: [
        'Custom route intelligence workflows',
        'Regional source and incident coverage',
        'API delivery for internal systems',
        'Training, governance, and SSO when ready'
      ],
      footnote: 'Scoped around operating regions, route volume, integrations, and support needs.'
    }
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
