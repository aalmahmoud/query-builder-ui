import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserRequest } from '../../../core/models/user.model';
import { Role } from '../../../core/models/role.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    FormsModule, RouterLink, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnInit {
  isEdit = false;
  userId = 0;
  loading = signal(false);
  saving = signal(false);
  roles = signal<Role[]>([]);

  form: UserRequest = {
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    nationalId: '',
    password: '',
    roleId: 0,
    isActive: true,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private roleService: RoleService,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    this.roleService.getAll().subscribe(page => this.roles.set(page.content));
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.userId = +idParam;
      this.loading.set(true);
      this.userService.getById(this.userId).subscribe({
        next: (user) => {
          this.form = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobileNumber: user.mobileNumber,
            nationalId: user.nationalId,
            roleId: user.roleId,
            isActive: user.isActive,
          };
          this.loading.set(false);
        },
        error: () => {
          this.notification.error('User not found');
          this.router.navigate(['/users']);
        },
      });
    }
  }

  save(): void {
    this.saving.set(true);
    const op$ = this.isEdit
      ? this.userService.update(this.userId, this.form)
      : this.userService.create(this.form);

    op$.subscribe({
      next: () => {
        this.notification.success(this.isEdit ? 'User updated' : 'User created');
        this.router.navigate(['/users']);
      },
      error: (err) => {
        this.saving.set(false);
        this.notification.error(err.error?.message || 'Failed to save user');
      },
    });
  }
}
