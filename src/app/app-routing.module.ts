import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LandingPageComponent } from './landing-page/landing-page.component';
import { ApiOverviewComponent } from './api-overview/api-overview.component';
import { ApiDocsLayoutComponent } from './api-overview/api-docs-layout.component';
import { TermsComponent } from './terms/terms.component';

const routes: Routes = [
  { path: '', component: LandingPageComponent, data: { hideToolbar: true } },
  { path: 'landingpage', component: LandingPageComponent, data: { hideToolbar: true } },
  { path: 'terms', component: TermsComponent, data: { hideToolbar: true } },
  {
    path: 'api',
    component: ApiDocsLayoutComponent,
    data: { hideToolbar: true },
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: ':page', component: ApiOverviewComponent }
    ]
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
      scrollOffset: [0, 112]
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
