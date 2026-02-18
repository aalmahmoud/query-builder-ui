import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { RoleService } from '../../../core/services/role.service';
import { PermissionService } from '../../../core/services/permission.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RoleRequest } from '../../../core/models/role.model';
import { Permission } from '../../../core/models/permission.model';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    FormsModule, RouterLink, MatCardModule, MatFormFieldModule,
    MatInputModule, MatCheckboxModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatListModule, MatDividerModule,
  ],
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.scss',
})
export class RoleFormComponent implements OnInit {
  isEdit = false;
  roleId = 0;
  loading = signal(false);
  saving = signal(false);
  allPermissions = signal<Permission[]>([]);
  selectedPermissionIds = new Set<number>();

  form: RoleRequest = {
    name: '',
    description: '',
    isActive: true,
    permissionIds: [],
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roleService: RoleService,
    private permissionService: PermissionService,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    this.permissionService.getAll().subscribe(page => this.allPermissions.set(page.content));
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.roleId = +idParam;
      this.loading.set(true);
      this.roleService.getById(this.roleId).subscribe({
        next: (role) => {
          this.form = { name: role.name, description: role.description, isActive: role.isActive, permissionIds: role.permissionIds };
          this.selectedPermissionIds = new Set(role.permissionIds);
          this.loading.set(false);
        },
        error: () => { this.notification.error('Role not found'); this.router.navigate(['/roles']); },
      });
    }
  }

  togglePermission(id: number): void {
    if (this.selectedPermissionIds.has(id)) this.selectedPermissionIds.delete(id);
    else this.selectedPermissionIds.add(id);
  }

  getResourceGroups(): { resource: string; permissions: Permission[] }[] {
    const map = new Map<string, Permission[]>();
    for (const p of this.allPermissions()) {
      const list = map.get(p.resource) ?? [];
      list.push(p);
      map.set(p.resource, list);
    }
    return Array.from(map.entries()).map(([resource, permissions]) => ({ resource, permissions }));
  }

  save(): void {
    this.form.permissionIds = Array.from(this.selectedPermissionIds);
    this.saving.set(true);
    const op$ = this.isEdit
      ? this.roleService.update(this.roleId, this.form)
      : this.roleService.create(this.form);

    op$.subscribe({
      next: () => {
        this.notification.success(this.isEdit ? 'Role updated' : 'Role created');
        this.router.navigate(['/roles']);
      },
      error: (err) => {
        this.saving.set(false);
        this.notification.error(err.error?.message || 'Failed to save role');
      },
    });
  }
}
