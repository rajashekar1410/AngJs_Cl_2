import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';
import { LoginAuthService } from 'src/app/core/services/login-auth/login-auth.service';
import { LoginComponent } from '../app/login/login.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'home', loadChildren: () => import('../app/home/home.module').then(m => m.homeModule), canActivate: [LoginAuthService] },
];
export const AppRoutingModule: ModuleWithProviders<any> = RouterModule.forRoot(routes, {
    useHash: true,
    preloadingStrategy: PreloadAllModules,
    relativeLinkResolution: 'legacy'
});
