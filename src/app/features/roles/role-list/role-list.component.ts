import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { RoleService } from '../../../core/services/role.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Role, ROLE_COLUMNS } from '../../../core/models/role.model';
import {
  AggregationRequest, AggregationResult, FieldMeta, QueryRequest, SavedQuery,
} from '../../../core/models/query.model';
import { QueryBuilderComponent } from '../../../shared/components/query-builder/query-builder.component';
import { AggregationPanelComponent } from '../../../shared/components/aggregation-panel/aggregation-panel.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ExportDialogComponent, ExportDialogResult } from '../../../shared/components/export-dialog/export-dialog.component';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatTooltipModule, MatMenuModule, MatCheckboxModule,
    MatFormFieldModule, MatInputModule, MatProgressBarModule, FormsModule, RouterLink, DatePipe,
    QueryBuilderComponent, AggregationPanelComponent,
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

  selectedColumns: string[] = [];
  projectedRows: Record<string, unknown>[] = [];
  aggregateMode = signal(false);
  aggResult: AggregationResult | null = null;
  savedQueries: SavedQuery[] = [];
  saveName = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(QueryBuilderComponent) builder?: QueryBuilderComponent;

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
    this.loadSavedQueries();
    this.loadData();
  }

  private hasFilters(): boolean {
    return (this.currentQuery.conditions?.length ?? 0) > 0
      || (this.currentQuery.groups?.length ?? 0) > 0;
  }

  get projecting(): boolean { return this.selectedColumns.length > 0; }

  loadData(): void {
    this.loading.set(true);
    const sortParam = `${this.sortField},${this.sortDir}`;
    if (this.projecting) {
      const req: QueryRequest = { ...this.currentQuery, select: this.selectedColumns };
      this.roleService.queryProjected(req, this.pageIndex, this.pageSize, sortParam).subscribe({
        next: (page) => { this.projectedRows = page.content; this.totalElements.set(page.totalElements); this.loading.set(false); },
        error: () => { this.notification.error('Failed to load roles'); this.loading.set(false); },
      });
      return;
    }
    const load$ = this.hasFilters()
      ? this.roleService.query(this.currentQuery, this.pageIndex, this.pageSize, sortParam)
      : this.roleService.getAll(this.pageIndex, this.pageSize, sortParam);
    load$.subscribe({
      next: (page) => { this.dataSource.data = page.content; this.totalElements.set(page.totalElements); this.loading.set(false); },
      error: () => { this.notification.error('Failed to load roles'); this.loading.set(false); },
    });
  }

  onPage(event: PageEvent): void { this.pageIndex = event.pageIndex; this.pageSize = event.pageSize; this.loadData(); }
  onSort(sort: Sort): void { this.sortField = sort.active || 'name'; this.sortDir = (sort.direction || 'asc') as 'asc' | 'desc'; this.loadData(); }
  onSearch(query: QueryRequest): void { this.currentQuery = query; this.pageIndex = 0; this.loadData(); }
  onReset(): void { this.currentQuery = { conditions: [] }; this.pageIndex = 0; this.loadData(); }

  toggleColumn(name: string, checked: boolean): void {
    this.selectedColumns = checked ? [...this.selectedColumns, name] : this.selectedColumns.filter(c => c !== name);
    this.pageIndex = 0; this.loadData();
  }
  clearProjection(): void { this.selectedColumns = []; this.pageIndex = 0; this.loadData(); }
  cell(row: Record<string, unknown>, col: string): unknown { return row[col]; }

  toggleAggregate(): void { this.aggregateMode.set(!this.aggregateMode()); if (!this.aggregateMode()) this.aggResult = null; }
  onAggregate(req: AggregationRequest): void {
    req.filter = this.hasFilters() ? this.currentQuery : undefined;
    this.roleService.aggregate(req).subscribe({
      next: (res) => (this.aggResult = res),
      error: () => this.notification.error('Aggregation failed'),
    });
  }

  loadSavedQueries(): void {
    this.roleService.getSavedQueries().subscribe({ next: (l) => (this.savedQueries = l), error: () => {} });
  }
  saveCurrentQuery(): void {
    const name = this.saveName.trim();
    if (!name) return;
    this.roleService.createSavedQuery({ name, queryRequest: this.currentQuery }).subscribe({
      next: () => { this.notification.success('Query saved'); this.saveName = ''; this.loadSavedQueries(); },
      error: () => this.notification.error('Failed to save query'),
    });
  }
  loadSaved(sq: SavedQuery): void {
    this.currentQuery = sq.queryRequest;
    this.selectedColumns = sq.queryRequest.select ?? [];
    this.builder?.setFromRequest(sq.queryRequest);
    this.pageIndex = 0; this.loadData();
  }
  deleteSaved(sq: SavedQuery): void {
    this.roleService.deleteSavedQuery(sq.id).subscribe({
      next: () => { this.notification.success('Saved query deleted'); this.loadSavedQueries(); },
      error: () => this.notification.error('Failed to delete'),
    });
  }

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
