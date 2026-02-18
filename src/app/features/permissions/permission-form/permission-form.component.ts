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
import { PermissionService } from '../../../core/services/permission.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PermissionRequest } from '../../../core/models/permission.model';

@Component({
  selector: 'app-permission-form',
  standalone: true,
  imports: [
    FormsModule, RouterLink, MatCardModule, MatFormFieldModule,
    MatInputModule, MatCheckboxModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './permission-form.component.html',
  styleUrl: './permission-form.component.scss',
})
export class PermissionFormComponent implements OnInit {
  isEdit = false;
  permissionId = 0;
  loading = signal(false);
  saving = signal(false);

  form: PermissionRequest = {
    name: '',
    resource: '',
    action: '',
    description: '',
    isActive: true,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private permissionService: PermissionService,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.permissionId = +idParam;
      this.loading.set(true);
      this.permissionService.getById(this.permissionId).subscribe({
        next: (p) => {
          this.form = { name: p.name, resource: p.resource, action: p.action, description: p.description, isActive: p.isActive };
          this.loading.set(false);
        },
        error: () => { this.notification.error('Permission not found'); this.router.navigate(['/permissions']); },
      });
    }
  }

  onResourceOrActionChange(): void {
    if (this.form.resource && this.form.action) {
      this.form.name = `${this.form.resource}:${this.form.action}`;
    }
  }

  save(): void {
    this.saving.set(true);
    const op$ = this.isEdit
      ? this.permissionService.update(this.permissionId, this.form)
      : this.permissionService.create(this.form);

    op$.subscribe({
      next: () => {
        this.notification.success(this.isEdit ? 'Permission updated' : 'Permission created');
        this.router.navigate(['/permissions']);
      },
      error: (err) => {
        this.saving.set(false);
        this.notification.error(err.error?.message || 'Failed to save permission');
      },
    });
  }
}
