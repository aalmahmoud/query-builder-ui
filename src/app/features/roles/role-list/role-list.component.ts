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
import { RoleService } from '../../../core/services/role.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Role, ROLE_COLUMNS } from '../../../core/models/role.model';
import { FieldMeta, QueryRequest } from '../../../core/models/query.model';
import { QueryBuilderComponent } from '../../../shared/components/query-builder/query-builder.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ExportDialogComponent, ExportDialogResult } from '../../../shared/components/export-dialog/export-dialog.component';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatTooltipModule, MatMenuModule,
    MatProgressBarModule, RouterLink, DatePipe, QueryBuilderComponent,
  ],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss',
})
export class RoleListComponent implements OnInit {
  displayedColumns = ['name', 'description', 'permissionNames', 'isActive', 'createdDate', 'actions'];
  dataSource = new MatTableDataSource<Role>();
  fields: FieldMeta[] = [];
  exportColumns = ROLE_COLUMNS;

  totalElements = signal(0);
  loading = signal(false);
  pageSize = 10;
  pageIndex = 0;
  sortField = 'name';
  sortDir: 'asc' | 'desc' = 'asc';
  currentQuery: QueryRequest = { conditions: [] };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private roleService: RoleService,
    private notification: NotificationService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.roleService.metadata().subscribe({
      next: (md) => (this.fields = md.fields),
      error: () => this.notification.error('Failed to load query metadata'),
    });
    this.loadData();
  }

  private hasFilters(): boolean {
    return (this.currentQuery.conditions?.length ?? 0) > 0
      || (this.currentQuery.groups?.length ?? 0) > 0;
  }

  loadData(): void {
    this.loading.set(true);
    const sortParam = `${this.sortField},${this.sortDir}`;
    const load$ = this.hasFilters()
      ? this.roleService.query(this.currentQuery, this.pageIndex, this.pageSize, sortParam)
      : this.roleService.getAll(this.pageIndex, this.pageSize, sortParam);

    load$.subscribe({
      next: (page) => {
        this.dataSource.data = page.content;
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => { this.notification.error('Failed to load roles'); this.loading.set(false); },
    });
  }

  onPage(event: PageEvent): void { this.pageIndex = event.pageIndex; this.pageSize = event.pageSize; this.loadData(); }
  onSort(sort: Sort): void { this.sortField = sort.active || 'name'; this.sortDir = (sort.direction || 'asc') as 'asc' | 'desc'; this.loadData(); }
  onSearch(query: QueryRequest): void { this.currentQuery = query; this.pageIndex = 0; this.loadData(); }
  onReset(): void { this.currentQuery = { conditions: [] }; this.pageIndex = 0; this.loadData(); }

  deleteRole(role: Role): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Role', message: `Delete role "${role.name}"?`, confirmText: 'Delete', color: 'warn' },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.roleService.delete(role.id).subscribe({
        next: () => { this.notification.success('Role deleted'); this.loadData(); },
        error: () => this.notification.error('Failed to delete role'),
      });
    });
  }

  openExport(): void {
    const ref = this.dialog.open(ExportDialogComponent, { data: { columns: this.exportColumns }, width: '400px' });
    ref.afterClosed().subscribe((result: ExportDialogResult | null) => {
      if (!result) return;
      this.roleService.export({ queryRequest: this.currentQuery, ...result }).subscribe({
        next: (blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `roles.${result.format === 'EXCEL' ? 'xlsx' : 'pdf'}`; a.click(); },
        error: () => this.notification.error('Export failed'),
      });
    });
  }
}
