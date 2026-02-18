import { Component, computed, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../core/auth/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule,
    MatDividerModule, MatTooltipModule,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  private allNavItems: NavItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard', roles: ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_MANAGER'] },
    { icon: 'people', label: 'Users', route: '/users', roles: ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_MANAGER'] },
    { icon: 'admin_panel_settings', label: 'Roles', route: '/roles', roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] },
    { icon: 'lock', label: 'Permissions', route: '/permissions', roles: ['ROLE_ADMIN'] },
  ];

  navItems = computed(() =>
    this.allNavItems.filter(item => item.roles.some(r => this.auth.roles().includes(r)))
  );

  constructor(public auth: AuthService) {}

  logout(): void {
    this.auth.logout();
  }
}
