import { __decorate } from "tslib";
import { HttpClientModule, provideHttpClient, withFetch, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { AgCharts } from 'ag-charts-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // Added ReactiveFormsModule
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MarkdownModule } from 'ngx-markdown';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select'; // Added
import { MatCheckboxModule } from '@angular/material/checkbox'; // Added
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';
import { CommonModule } from '@angular/common'; // Added for TitleCasePipe and other common directives
import { NgChartsModule } from 'ng2-charts';
import { TestEnvComponent } from './test-env/test-env.component';
import { UserHomeComponent } from './user-home/user-home.component';
import { NgxEchartsModule } from 'ngx-echarts';
import { AlertGalleryComponent } from './alert-gallery/alert-gallery.component';
import { SettingsComponent } from './settings/settings.component';
import { ProfileComponent } from './profile/profile.component';
import { ReportGalleryComponent } from './report-gallery/report-gallery.component';
import { ContactComponent } from './contact/contact.component';
import { CreateTargetComponent } from './report-gallery/create-target/create-target.component';
import { TargetsComponent } from './targets/targets.component';
import { CreateClientComponent } from './create-client/create-client.component'; // Added
import { GlobalDialogModule } from './shared/global-dialog/global-dialog.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { VerifyComponent } from './verify/verify.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ClientSetupComponent } from './client-setup/client-setup.component';
import { ResetPasswordPageComponent } from './login/reset-password-page/reset-password-page.component';
import { EditTargetComponent } from './edit-target/edit-target.component';
import { QueryComponent } from './query/query.component';
import { EditSavedQueryDialogComponent } from './query/edit-saved-query-dialog.component';
import { InteractiveGlobeComponent } from './interactive-globe/interactive-globe.component';
import { LandingGlobeComponent } from './landing-globe/landing-globe.component';
import { ExplorerComponent } from './explorer/explorer.component';
import { QueryBuilderComponent } from './explorer/query-builder.component';
import { IocDetailDialogComponent } from './explorer/ioc-detail-dialog.component';
import { SaveQueryDialogComponent } from './explorer/save-query-dialog.component';
let AppModule = class AppModule {
};
AppModule = __decorate([
    NgModule({
        declarations: [
            AppComponent,
            LandingPageComponent,
            TestEnvComponent,
            UserHomeComponent,
            AlertGalleryComponent,
            SettingsComponent,
            ProfileComponent,
            ReportGalleryComponent,
            ContactComponent,
            CreateTargetComponent,
            TargetsComponent,
            CreateClientComponent,
            LoginComponent,
            RegisterComponent,
            VerifyComponent,
            ClientSetupComponent,
            ResetPasswordPageComponent,
            EditTargetComponent,
            QueryComponent,
            EditSavedQueryDialogComponent,
            InteractiveGlobeComponent,
            LandingGlobeComponent,
            ExplorerComponent,
            QueryBuilderComponent,
            IocDetailDialogComponent,
            SaveQueryDialogComponent
        ],
        imports: [
            BrowserModule,
            CommonModule,
            BrowserAnimationsModule,
            AppRoutingModule,
            HttpClientModule,
            FormsModule,
            ReactiveFormsModule,
            MatButtonModule,
            MatToolbarModule,
            MatCardModule,
            MatChipsModule,
            MatTooltipModule,
            MatProgressSpinnerModule,
            MatFormFieldModule,
            MatInputModule,
            MatIconModule,
            MatSelectModule,
            MatCheckboxModule,
            MatDialogModule,
            MatButtonToggleModule,
            MatProgressBarModule,
            MatSliderModule,
            NgChartsModule,
            AgCharts,
            NgxChartsModule,
            // Add this to enable ngx-echarts
            NgxEchartsModule.forRoot({
                echarts: () => import('echarts'),
            }),
            MatSnackBarModule,
            GlobalDialogModule,
            MarkdownModule.forRoot(),
        ],
        providers: [
            provideClientHydration(),
            provideHttpClient(withFetch()),
            { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
        ],
        bootstrap: [AppComponent],
        schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map