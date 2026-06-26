import { provideHttpClient, withFetch } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { InteractiveGlobeComponent } from './interactive-globe/interactive-globe.component';
import { ApiOverviewComponent } from './api-overview/api-overview.component';
import { TopToolbarComponent } from './shared/components/top-toolbar/top-toolbar.component';
import { ApiDocsSidebarComponent } from './shared/components/api-docs-sidebar/api-docs-sidebar.component';
import { ApiDocsLayoutComponent } from './api-overview/api-docs-layout.component';
import { PricingPageComponent } from './pricing-page/pricing-page.component';
import { TermsComponent } from './terms/terms.component';
import { SiteFooterComponent } from './shared/components/site-footer/site-footer.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    InteractiveGlobeComponent,
    ApiOverviewComponent,
    TopToolbarComponent,
    ApiDocsSidebarComponent,
    ApiDocsLayoutComponent,
    PricingPageComponent,
    TermsComponent,
    SiteFooterComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    MatIconModule,
    MatProgressBarModule,
    MatSliderModule,
    MatSnackBarModule,
  ],
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch())
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
