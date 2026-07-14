import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/ui/pages/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/ui/pages/register/register.component').then((m) => m.RegisterComponent),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/ui/pages/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/customers/ui/pages/list/customer-list.component').then((m) => m.CustomerListComponent),
      },
      {
        path: 'customers/:id',
        loadComponent: () =>
          import('./features/customers/ui/pages/detail/customer-detail.component').then((m) => m.CustomerDetailComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/ui/pages/list/order-list.component').then((m) => m.OrderListComponent),
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./features/orders/ui/pages/detail/order-detail.component').then((m) => m.OrderDetailComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
