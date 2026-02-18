import { Component, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { RoleService } from '../../core/services/role.service';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/auth/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  totalUsers = signal(0);
  activeUsers = signal(0);
  totalRoles = signal(0);
  totalPermissions = signal(0);

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private permissionService: PermissionService,
    public auth: AuthService,
  ) {}

  ngOnInit(): void {
    const empty = { conditions: [] };
    const activeQ = { conditions: [{ field: 'isActive', operation: 'IS_TRUE' as const }] };

    forkJoin({
      users: this.userService.count(empty),
      active: this.userService.count(activeQ),
      roles: this.roleService.count(empty),
      permissions: this.permissionService.count(empty),
    }).subscribe({
      next: (data) => {
        this.totalUsers.set(data.users);
        this.activeUsers.set(data.active);
        this.totalRoles.set(data.roles);
        this.totalPermissions.set(data.permissions);
      },
    });
  }
}
