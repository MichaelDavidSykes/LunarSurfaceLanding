import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { AgCharts } from 'ag-charts-angular';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MarkdownModule } from 'ngx-markdown';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { NgxEchartsModule } from 'ngx-echarts';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { InteractiveGlobeComponent } from './interactive-globe/interactive-globe.component';
import { ApiOverviewComponent } from './api-overview/api-overview.component';
import { TopToolbarComponent } from './shared/components/top-toolbar/top-toolbar.component';
import { ApiDocsSidebarComponent } from './shared/components/api-docs-sidebar/api-docs-sidebar.component';
import { ApiDocsLayoutComponent } from './api-overview/api-docs-layout.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    InteractiveGlobeComponent,
    ApiOverviewComponent,
    TopToolbarComponent,
    ApiDocsSidebarComponent,
    ApiDocsLayoutComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSliderModule,
    NgChartsModule,
    AgCharts,
    NgxChartsModule,

    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
    MatSnackBarModule,
    MarkdownModule.forRoot(),
  ],
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch())
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
