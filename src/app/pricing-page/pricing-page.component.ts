import { Component } from '@angular/core';
import { Router } from '@angular/router';

type PricingLandingTarget = 'solutions' | 'ai-agent' | 'contact';

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
  features: string[];
  footnote: string;
}

interface ProductPricingOverview {
  label: string;
  description: string;
}

interface ProductPricingSection {
  id: string;
  modifierClass: string;
  kicker: string;
  heading: string;
  description: string;
  plans: PricingPlan[];
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
      description: 'Annual workspace pricing for intelligence search, saved queries, monitoring, alerting, AI investigations, API usage, and MCP access.'
    },
    {
      label: 'SafeRoute',
      description: 'Annual workspace pricing for route planning, route-risk review, safe haven markers, briefing exports, and protected movement workflows.'
    },
    {
      label: 'Custom intelligence solutions',
      description: 'Quoted separately for enterprise deployments, specialist source onboarding, API/MCP integrations, paid pilots, and custom intelligence operations.'
    }
  ];

  protected readonly pricingSections: ProductPricingSection[] = [
    {
      id: 'threatscape-pricing',
      modifierClass: 'product-pricing-section--threatscape',
      kicker: '01 / ThreatScape',
      heading: 'ThreatScape annual workspace pricing.',
      description: 'ThreatScape pricing is based on seats, active monitored queries, alert delivery, exports, AI investigations, and MCP/API usage. Final pricing is confirmed by written quotation or proposal.',
      plans: [
        {
          name: 'ThreatScape Demo',
          price: '$0',
          cadence: '/controlled evaluation',
          description: 'For qualified teams evaluating ThreatScape in a controlled, non-production workspace.',
          metrics: [
            { label: 'Seats', value: '2 seats' },
            { label: 'Coverage', value: '6 active queries' },
            { label: 'Delivery', value: 'In-app and email' }
          ],
          ctaLabel: 'Request evaluation',
          features: [
            'Graph explorer and saved queries',
            'Manual investigations',
            '12 AI investigations during evaluation',
            '150 MCP/API calls during evaluation'
          ],
          footnote: 'Evaluation access is time-limited to a maximum of one month unless agreed in writing.'
        },
        {
          name: 'Professional',
          price: '$4,000',
          cadence: '/workspace/year',
          description: 'For smaller teams moving from evaluation into recurring intelligence monitoring.',
          metrics: [
            { label: 'Seats', value: '3 seats' },
            { label: 'Coverage', value: '15 active queries' },
            { label: 'Delivery', value: 'In-app and email' }
          ],
          ctaLabel: 'Request access',
          features: [
            'Shared workspace for small teams',
            'Manual exploration and saved query monitoring',
            '75 AI investigations / month',
            '5,000 MCP/API calls / month'
          ],
          footnote: 'Billed annually. Final pricing remains subject to written quotation or proposal.'
        },
        {
          name: 'Business',
          price: '$8,000',
          cadence: '/workspace/year',
          description: 'For larger teams running more active intelligence requirements and delivery workflows.',
          metrics: [
            { label: 'Seats', value: '18 seats' },
            { label: 'Coverage', value: '80 active queries' },
            { label: 'Delivery', value: 'Email and webhook' }
          ],
          featured: true,
          ctaLabel: 'Request access',
          features: [
            'In-app, email, and webhook alerts',
            'CSV and PDF exports',
            '500 AI investigations / month',
            '50,000 MCP/API calls / month'
          ],
          footnote: 'Billed annually. Final pricing remains subject to written quotation or proposal.'
        },
        {
          name: 'Enterprise',
          price: 'Quoted',
          cadence: '/annual subscription',
          description: 'For larger teams, sensitive environments, private deployments, and custom intelligence workflows.',
          metrics: [
            { label: 'Seats', value: 'Custom' },
            { label: 'Coverage', value: 'Custom' },
            { label: 'Delivery', value: 'Custom routing' }
          ],
          ctaLabel: 'Contact us',
          features: [
            'Custom AI and MCP/API limits',
            'Custom alert routing and exports',
            'Custom source onboarding',
            'Onboarding, SLA support, and SSO when ready'
          ],
          footnote: 'Quoted for enterprise, defence/security, high-sensitivity, private deployment, or procurement-specific requirements.'
        }
      ]
    },
    {
      id: 'saferoute-pricing',
      modifierClass: 'product-pricing-section--saferoute',
      kicker: '02 / SafeRoute',
      heading: 'SafeRoute annual workspace pricing.',
      description: 'SafeRoute pricing is based on seats, route-planning workflow, configured risk review, briefing outputs, support needs, and deployment scope. Enterprise and operational deployments are quoted separately.',
      plans: [
        {
          name: 'SafeRoute Demo',
          price: '$0',
          cadence: '/controlled evaluation',
          description: 'For qualified teams evaluating SafeRoute with representative routes, venues, vehicles, and risk scenarios.',
          metrics: [
            { label: 'Seats', value: 'Up to 3 seats' },
            { label: 'Routes', value: 'Representative routes' },
            { label: 'Delivery', value: 'Demo workspace' }
          ],
          ctaLabel: 'Contact us',
          features: [
            'Representative routes, scenarios, vehicles, and venues',
            'Risk areas, no-go zones, and safe haven points',
            'Route review criteria and demonstration workflow',
            'Controlled evaluation support'
          ],
          footnote: 'Evaluation access is time-limited to a maximum of one month and is not for live operational use.'
        },
        {
          name: 'SafeRoute Professional',
          price: '$4,000',
          cadence: '/workspace/year',
          description: 'For smaller teams that need structured route-risk planning and briefing support.',
          metrics: [
            { label: 'Seats', value: 'Up to 5 seats' },
            { label: 'Routes', value: 'Route planning and review' },
            { label: 'Delivery', value: 'Briefing exports' }
          ],
          featured: true,
          ctaLabel: 'Contact us',
          features: [
            'Route planning and alternate route comparison',
            'Configured route-risk review',
            'Approved no-go areas',
            'Safe haven and support-location markers'
          ],
          footnote: 'Billed annually. Does not include live operational support or private deployment requirements.'
        },
        {
          name: 'SafeRoute Business',
          price: '$8,000',
          cadence: '/workspace/year',
          description: 'For organisations that need repeatable protected movement planning across more users and scenarios.',
          metrics: [
            { label: 'Seats', value: 'Up to 12 seats' },
            { label: 'Routes', value: 'Multi-scenario workflows' },
            { label: 'Delivery', value: 'Dashboards and handoff packs' }
          ],
          ctaLabel: 'Contact us',
          features: [
            'Convoy and asset readiness fields',
            'Configured route-risk layers',
            'Route review dashboards and briefing exports',
            'Scheduled review support and limited API/export support'
          ],
          footnote: 'Billed annually. Intended for repeatable planning, review, and briefing workflows.'
        },
        {
          name: 'SafeRoute Enterprise',
          price: 'Quoted',
          cadence: '/annual or project',
          description: 'For larger protective operations, sensitive deployments, and custom regional route intelligence.',
          metrics: [
            { label: 'Deployment', value: 'Private or dedicated' },
            { label: 'Data', value: 'Custom risk layers' },
            { label: 'Support', value: 'Training and SLA' }
          ],
          ctaLabel: 'Contact us',
          features: [
            'Custom route intelligence workflows',
            'Advanced regional data coverage',
            'Custom route models and operating procedures',
            'Integrations, training, and dedicated onboarding'
          ],
          footnote: 'Quoted for private deployments, integrations, operational support, and high-sensitivity requirements.'
        }
      ]
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
}
