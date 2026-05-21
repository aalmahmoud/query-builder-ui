import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AggregationFn, AggregationRequest, AggregationResult, FieldMeta,
} from '../../../core/models/query.model';

interface MetricRow {
  fn: AggregationFn;
  field: string | null;
}

const FUNCTIONS: AggregationFn[] = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];

@Component({
  selector: 'app-aggregation-panel',
  standalone: true,
  imports: [
    FormsModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule, MatTooltipModule,
  ],
  templateUrl: './aggregation-panel.component.html',
  styleUrl: './aggregation-panel.component.scss',
})
export class AggregationPanelComponent {
  @Input() fields: readonly FieldMeta[] = [];
  @Input() result: AggregationResult | null = null;
  @Output() run = new EventEmitter<AggregationRequest>();

  readonly functions = FUNCTIONS;
  groupBy: string[] = [];
  metrics: MetricRow[] = [{ fn: 'COUNT', field: null }];

  get groupableFields(): readonly FieldMeta[] {
    return this.fields.filter(f => f.filterable);
  }

  /** SUM/AVG/MIN/MAX need numeric fields; COUNT can use any (or none). */
  numericFields(): readonly FieldMeta[] {
    return this.fields.filter(f => f.type === 'number');
  }

  needsField(fn: AggregationFn): boolean {
    return fn !== 'COUNT';
  }

  addMetric(): void {
    this.metrics.push({ fn: 'COUNT', field: null });
  }

  removeMetric(i: number): void {
    this.metrics.splice(i, 1);
  }

  onFnChange(m: MetricRow): void {
    // COUNT may have no field; the others require a numeric field.
    if (m.fn === 'COUNT') {
      return;
    }
    if (!m.field || !this.numericFields().some(f => f.name === m.field)) {
      m.field = this.numericFields()[0]?.name ?? null;
    }
  }

  canRun(): boolean {
    return this.metrics.length > 0
      && this.metrics.every(m => m.fn === 'COUNT' || !!m.field);
  }

  doRun(): void {
    this.run.emit({
      groupBy: [...this.groupBy],
      metrics: this.metrics.map(m => ({ fn: m.fn, field: m.fn === 'COUNT' ? m.field : m.field })),
    });
  }

  // ---- result rendering ----

  get groupColumns(): string[] {
    const first = this.result?.rows?.[0];
    return first ? Object.keys(first.group) : [];
  }

  get metricColumns(): string[] {
    const first = this.result?.rows?.[0];
    return first ? Object.keys(first.metrics) : [];
  }

  groupValue(row: { group: Record<string, unknown> }, col: string): unknown {
    return row.group[col];
  }

  metricValue(row: { metrics: Record<string, unknown> }, col: string): unknown {
    return row.metrics[col];
  }
}
