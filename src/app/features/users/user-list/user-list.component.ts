import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User, USER_FIELDS, USER_COLUMNS } from '../../../core/models/user.model';
import { QueryRequest } from '../../../core/models/query.model';
import { QueryBuilderComponent } from '../../../shared/components/query-builder/query-builder.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ExportDialogComponent, ExportDialogResult } from '../../../shared/components/export-dialog/export-dialog.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatTooltipModule, MatMenuModule,
    MatProgressBarModule, RouterLink, DatePipe, QueryBuilderComponent,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  displayedColumns = ['firstName', 'lastName', 'email', 'roleName', 'isActive', 'createdDate', 'actions'];
  dataSource = new MatTableDataSource<User>();
  fields = USER_FIELDS;
  exportColumns = USER_COLUMNS;

  totalElements = signal(0);
  loading = signal(false);
  pageSize = 10;
  pageIndex = 0;
  sortField = 'createdDate';
  sortDir: 'asc' | 'desc' = 'desc';
  currentQuery: QueryRequest = { conditions: [] };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private userService: UserService,
    private notification: NotificationService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const sortParam = `${this.sortField},${this.sortDir}`;
    const load$ = this.currentQuery.conditions.length > 0
      ? this.userService.query(this.currentQuery, this.pageIndex, this.pageSize, sortParam)
      : this.userService.getAll(this.pageIndex, this.pageSize, sortParam);

    load$.subscribe({
      next: (page) => {
        this.dataSource.data = page.content;
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load users');
        this.loading.set(false);
      },
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  onSort(sort: Sort): void {
    this.sortField = sort.active || 'createdDate';
    this.sortDir = (sort.direction || 'desc') as 'asc' | 'desc';
    this.loadData();
  }

  onSearch(query: QueryRequest): void {
    this.currentQuery = query;
    this.pageIndex = 0;
    this.loadData();
  }

  onReset(): void {
    this.currentQuery = { conditions: [] };
    this.pageIndex = 0;
    this.loadData();
  }

  toggleStatus(user: User): void {
    this.userService.changeStatus(user.id, !user.isActive).subscribe({
      next: () => {
        this.notification.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
        this.loadData();
      },
      error: () => this.notification.error('Failed to change status'),
    });
  }

  deleteUser(user: User): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete ${user.firstName} ${user.lastName}?`,
        confirmText: 'Delete',
        color: 'warn',
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.userService.delete(user.id).subscribe({
        next: () => {
          this.notification.success('User deleted');
          this.loadData();
        },
        error: () => this.notification.error('Failed to delete user'),
      });
    });
  }

  openExport(): void {
    const ref = this.dialog.open(ExportDialogComponent, {
      data: { columns: this.exportColumns },
      width: '400px',
    });
    ref.afterClosed().subscribe((result: ExportDialogResult | null) => {
      if (!result) return;
      this.userService.export({
        queryRequest: this.currentQuery,
        ...result,
      }).subscribe({
        next: (blob) => this.downloadBlob(blob, `users.${result.format === 'EXCEL' ? 'xlsx' : 'pdf'}`),
        error: () => this.notification.error('Export failed'),
      });
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
