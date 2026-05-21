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

import { PermissionService } from '../../../core/services/permission.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Permission, PERMISSION_COLUMNS } from '../../../core/models/permission.model';
import { FieldMeta, QueryRequest } from '../../../core/models/query.model';
import { QueryBuilderComponent } from '../../../shared/components/query-builder/query-builder.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ExportDialogComponent, ExportDialogResult } from '../../../shared/components/export-dialog/export-dialog.component';

@Component({
  selector: 'app-permission-list',
  standalone: true,
  imports: [
    MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatTooltipModule, MatMenuModule,
    MatProgressBarModule, RouterLink, QueryBuilderComponent,
  ],
  templateUrl: './permission-list.component.html',
  styleUrl: './permission-list.component.scss',
})
export class PermissionListComponent implements OnInit {
  displayedColumns = ['name', 'resource', 'action', 'description', 'isActive', 'actions'];
  dataSource = new MatTableDataSource<Permission>();
  fields: FieldMeta[] = [];
  exportColumns = PERMISSION_COLUMNS;

  totalElements = signal(0);
  loading = signal(false);
  pageSize = 10;
  pageIndex = 0;
  sortField = 'resource';
  sortDir: 'asc' | 'desc' = 'asc';
  currentQuery: QueryRequest = { conditions: [] };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private permissionService: PermissionService,
    private notification: NotificationService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.permissionService.metadata().subscribe({
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
      ? this.permissionService.query(this.currentQuery, this.pageIndex, this.pageSize, sortParam)
      : this.permissionService.getAll(this.pageIndex, this.pageSize, sortParam);

    load$.subscribe({
      next: (page) => {
        this.dataSource.data = page.content;
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => { this.notification.error('Failed to load permissions'); this.loading.set(false); },
    });
  }

  onPage(event: PageEvent): void { this.pageIndex = event.pageIndex; this.pageSize = event.pageSize; this.loadData(); }
  onSort(sort: Sort): void { this.sortField = sort.active || 'resource'; this.sortDir = (sort.direction || 'asc') as 'asc' | 'desc'; this.loadData(); }
  onSearch(query: QueryRequest): void { this.currentQuery = query; this.pageIndex = 0; this.loadData(); }
  onReset(): void { this.currentQuery = { conditions: [] }; this.pageIndex = 0; this.loadData(); }

  deletePermission(p: Permission): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Permission', message: `Delete permission "${p.name}"?`, confirmText: 'Delete', color: 'warn' },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.permissionService.delete(p.id).subscribe({
        next: () => { this.notification.success('Permission deleted'); this.loadData(); },
        error: () => this.notification.error('Failed to delete permission'),
      });
    });
  }

  openExport(): void {
    const ref = this.dialog.open(ExportDialogComponent, { data: { columns: this.exportColumns }, width: '400px' });
    ref.afterClosed().subscribe((result: ExportDialogResult | null) => {
      if (!result) return;
      this.permissionService.export({ queryRequest: this.currentQuery, ...result }).subscribe({
        next: (blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `permissions.${result.format === 'EXCEL' ? 'xlsx' : 'pdf'}`; a.click(); },
        error: () => this.notification.error('Export failed'),
      });
    });
  }
}
