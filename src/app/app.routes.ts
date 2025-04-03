import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { logedGuard } from './core/guards/loged.guard';

export const routes: Routes = [

    { path: '', redirectTo: 'auth', pathMatch: 'full' },
    {
        path: 'main',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./core/layouts/main-layout/main-layout.component').then(
                (m) => m.MainLayoutComponent
            ),
        children: [
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            {
                path: 'home',
                loadComponent: () =>
                    import('./core/pages/home/home.component').then(
                        (c) => c.HomeComponent
                    ),
            },
            {
                path: 'details/:id',
                loadComponent: () =>
                    import('./shared/components/product-details/product-details.component').then(
                        (c) => c.ProductDetailsComponent
                    ),
            },
        ],
    },
    {
        path: 'auth',
        canActivate: [logedGuard],
        loadComponent: () =>
            import('./core/layouts/auth-layout/auth-layout.component').then(
                (m) => m.AuthLayoutComponent
            ),
        children: [
            { path: '', redirectTo: 'login', pathMatch: 'full' },
            {
                path: 'login',
                loadComponent: () =>
                    import('./core/pages/login/login.component').then(
                        (c) => c.LoginComponent
                    ),
            },

        ],
    },
];

