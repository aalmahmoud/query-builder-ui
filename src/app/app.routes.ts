import { Routes } from '@angular/router';
import { authGuard, loginGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent),
      },
      {
        path: 'users/new',
        loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent),
      },
      {
        path: 'users/:id/edit',
        loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent),
      },
      {
        path: 'roles',
        canActivate: [roleGuard('ROLE_ADMIN', 'ROLE_MANAGER')],
        loadComponent: () => import('./features/roles/role-list/role-list.component').then(m => m.RoleListComponent),
      },
      {
        path: 'roles/new',
        canActivate: [roleGuard('ROLE_ADMIN', 'ROLE_MANAGER')],
        loadComponent: () => import('./features/roles/role-form/role-form.component').then(m => m.RoleFormComponent),
      },
      {
        path: 'roles/:id/edit',
        canActivate: [roleGuard('ROLE_ADMIN', 'ROLE_MANAGER')],
        loadComponent: () => import('./features/roles/role-form/role-form.component').then(m => m.RoleFormComponent),
      },
      {
        path: 'permissions',
        canActivate: [roleGuard('ROLE_ADMIN')],
        loadComponent: () => import('./features/permissions/permission-list/permission-list.component').then(m => m.PermissionListComponent),
      },
      {
        path: 'permissions/new',
        canActivate: [roleGuard('ROLE_ADMIN')],
        loadComponent: () => import('./features/permissions/permission-form/permission-form.component').then(m => m.PermissionFormComponent),
      },
      {
        path: 'permissions/:id/edit',
        canActivate: [roleGuard('ROLE_ADMIN')],
        loadComponent: () => import('./features/permissions/permission-form/permission-form.component').then(m => m.PermissionFormComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
