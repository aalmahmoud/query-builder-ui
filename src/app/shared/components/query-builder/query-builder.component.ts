import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { QueryCondition, QueryRequest, QUERY_OPERATIONS, QueryOperation } from '../../../core/models/query.model';

export interface FieldDef {
  field: string;
  label: string;
  type: string;
}

interface ConditionRow {
  field: string;
  operation: QueryOperation;
  value: string;
  values: string;
  startValue: string;
  endValue: string;
}

@Component({
  selector: 'app-query-builder',
  standalone: true,
  imports: [
    FormsModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatTooltipModule,
  ],
  templateUrl: './query-builder.component.html',
  styleUrl: './query-builder.component.scss',
})
export class QueryBuilderComponent {
  @Input() fields: readonly FieldDef[] = [];
  @Output() search = new EventEmitter<QueryRequest>();
  @Output() reset = new EventEmitter<void>();

  operations = QUERY_OPERATIONS;
  rows: ConditionRow[] = [];

  addCondition(): void {
    this.rows.push({
      field: this.fields[0]?.field ?? '',
      operation: 'CONTAINS_IGNORE_CASE',
      value: '',
      values: '',
      startValue: '',
      endValue: '',
    });
  }

  removeCondition(i: number): void {
    this.rows.splice(i, 1);
  }

  clearAll(): void {
    this.rows = [];
    this.reset.emit();
  }

  doSearch(): void {
    const conditions: QueryCondition[] = this.rows
      .filter(r => r.field)
      .map(r => {
        const c: QueryCondition = { field: r.field, operation: r.operation };
        if (this.isBetween(r.operation)) {
          c.startValue = r.startValue;
          c.endValue = r.endValue;
        } else if (this.isMultiValue(r.operation)) {
          c.values = r.values.split(',').map(v => v.trim()).filter(Boolean);
        } else if (!this.isNoValue(r.operation)) {
          c.value = r.value;
        }
        return c;
      });
    this.search.emit({ conditions });
  }

  isBetween(op: string): boolean {
    return op === 'BETWEEN' || op === 'NOT_BETWEEN';
  }

  isMultiValue(op: string): boolean {
    return op === 'IN' || op === 'NOT_IN';
  }

  isNoValue(op: string): boolean {
    return ['IS_NULL', 'IS_NOT_NULL', 'IS_TRUE', 'IS_FALSE'].includes(op);
  }

  getFieldType(field: string): string {
    return (this.fields.find(f => f.field === field)?.type) ?? 'string';
  }
}
