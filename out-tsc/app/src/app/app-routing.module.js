import { __decorate } from "tslib";
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { TestEnvComponent } from './test-env/test-env.component';
import { UserHomeComponent } from './user-home/user-home.component';
import { AlertGalleryComponent } from './alert-gallery/alert-gallery.component';
import { SettingsComponent } from './settings/settings.component';
import { ProfileComponent } from './profile/profile.component';
import { ReportGalleryComponent } from './report-gallery/report-gallery.component';
import { SearchPageComponent } from './search-page/search-page.component';
import { ContactComponent } from './contact/contact.component';
import { AuthGuard } from './services/auth-guard/auth.guard';
import { CreateTargetComponent } from './report-gallery/create-target/create-target.component';
import { TargetsComponent } from './targets/targets.component';
import { EditTargetComponent } from './edit-target/edit-target.component';
import { CreateClientComponent } from './create-client/create-client.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { VerifyComponent } from './verify/verify.component';
import { ClientGuard } from './services/client-state/client.guard';
import { ClientSetupComponent } from './client-setup/client-setup.component';
import { ResetPasswordPageComponent } from './login/reset-password-page/reset-password-page.component';
import { QueryComponent } from './query/query.component';
import { ExplorerComponent } from './explorer/explorer.component';
import { DisabledFeatureGuard } from './services/auth-guard/disabled-feature.guard';
const routes = [
    { path: '', component: LandingPageComponent, data: { hideToolbar: true } },
    { path: 'landingpage', component: LandingPageComponent, data: { hideToolbar: true } },
    { path: 'test-env', component: TestEnvComponent, canActivate: [AuthGuard, ClientGuard] },
    { path: 'user-home', component: UserHomeComponent, canActivate: [AuthGuard, ClientGuard, DisabledFeatureGuard] },
    { path: 'alerts', component: AlertGalleryComponent, canActivate: [AuthGuard, ClientGuard] },
    { path: 'reports', component: ReportGalleryComponent, canActivate: [AuthGuard, ClientGuard] },
    { path: 'targets', component: TargetsComponent, canActivate: [AuthGuard, ClientGuard, DisabledFeatureGuard] },
    { path: 'query', component: QueryComponent, canActivate: [AuthGuard, ClientGuard] },
    { path: 'explorer', component: ExplorerComponent, canActivate: [AuthGuard, ClientGuard] },
    { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard, ClientGuard] },
    { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard, ClientGuard] },
    { path: 'report-gallery/create-target', component: CreateTargetComponent, canActivate: [AuthGuard, ClientGuard] },
    { path: 'edit-target/:id', component: EditTargetComponent, canActivate: [AuthGuard, ClientGuard] },
    { path: 'clients/create', component: CreateClientComponent, canActivate: [AuthGuard, ClientGuard] },
    { path: 'search', component: SearchPageComponent, canActivate: [AuthGuard, ClientGuard] },
    { path: 'contact', component: ContactComponent, canActivate: [AuthGuard, ClientGuard] },
    { path: 'client-setup', component: ClientSetupComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'verify', component: VerifyComponent },
    { path: 'reset-password', component: ResetPasswordPageComponent, data: { hideToolbar: true } },
];
let AppRoutingModule = class AppRoutingModule {
};
AppRoutingModule = __decorate([
    NgModule({
        imports: [RouterModule.forRoot(routes)],
        exports: [RouterModule]
    })
], AppRoutingModule);
export { AppRoutingModule };
//# sourceMappingURL=app-routing.module.js.map