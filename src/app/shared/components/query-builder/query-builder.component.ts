import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  FieldMeta, LogicOperator, QueryCondition, QueryGroup, QueryOperation, QueryRequest, operationLabel,
} from '../../../core/models/query.model';

/** A single editable condition row (string-backed; the backend coerces types). */
interface ConditionRow {
  field: string;
  operation: QueryOperation;
  value: string;
  values: string;
  startValue: string;
  endValue: string;
}

/** A recursive editable boolean group mirroring the QueryGroup contract. */
interface GroupNode {
  logic: LogicOperator;
  conditions: ConditionRow[];
  groups: GroupNode[];
}

const NO_VALUE_OPS: QueryOperation[] = ['IS_NULL', 'IS_NOT_NULL', 'IS_TRUE', 'IS_FALSE'];

@Component({
  selector: 'app-query-builder',
  standalone: true,
  imports: [
    NgTemplateOutlet, FormsModule, MatFormFieldModule, MatSelectModule, MatInputModule,
    MatButtonModule, MatButtonToggleModule, MatIconModule, MatTooltipModule,
  ],
  templateUrl: './query-builder.component.html',
  styleUrl: './query-builder.component.scss',
})
export class QueryBuilderComponent {
  /** Field metadata from GET /{entity}/metadata — drives field & operation choices. */
  @Input() fields: readonly FieldMeta[] = [];
  @Output() search = new EventEmitter<QueryRequest>();
  @Output() reset = new EventEmitter<void>();

  operationLabel = operationLabel;
  root: GroupNode = emptyGroup();

  // ---- tree editing (mutates nodes in place; template recurses via ngTemplateOutlet) ----

  addCondition(group: GroupNode): void {
    const first = this.fields[0];
    group.conditions.push({
      field: first?.name ?? '',
      operation: this.defaultOp(first),
      value: '', values: '', startValue: '', endValue: '',
    });
  }

  removeCondition(group: GroupNode, i: number): void {
    group.conditions.splice(i, 1);
  }

  addGroup(group: GroupNode): void {
    group.groups.push(emptyGroup());
  }

  removeGroup(parentGroups: GroupNode[], i: number): void {
    parentGroups.splice(i, 1);
  }

  clearAll(): void {
    this.root = emptyGroup();
    this.reset.emit();
  }

  /** Reset to a single empty condition so the user has something to fill in. */
  start(): void {
    this.root = emptyGroup();
    this.addCondition(this.root);
  }

  doSearch(): void {
    this.search.emit(this.toRequest());
  }

  /** Repopulate the builder tree from an existing QueryRequest (e.g. a saved query). */
  setFromRequest(qr: QueryRequest): void {
    this.root = this.toNode(qr.logic ?? 'AND', qr.conditions ?? [], qr.groups ?? []);
  }

  private toNode(logic: LogicOperator, conditions: QueryCondition[], groups: QueryGroup[]): GroupNode {
    return {
      logic: logic ?? 'AND',
      conditions: conditions.map(c => this.toRow(c)),
      groups: groups.map(g => this.toNode(g.logic, g.conditions ?? [], g.groups ?? [])),
    };
  }

  private toRow(c: QueryCondition): ConditionRow {
    return {
      field: c.field,
      operation: c.operation ?? 'EQUALS',
      value: c.value != null ? String(c.value) : '',
      values: Array.isArray(c.values) ? c.values.map(v => String(v)).join(', ') : '',
      startValue: c.startValue != null ? String(c.startValue) : '',
      endValue: c.endValue != null ? String(c.endValue) : '',
    };
  }

  hasAnything(group: GroupNode = this.root): boolean {
    return group.conditions.some(c => c.field) || group.groups.some(g => this.hasAnything(g));
  }

  // ---- field/operation/value helpers (metadata-driven) ----

  fieldMeta(name: string): FieldMeta | undefined {
    return this.fields.find(f => f.name === name);
  }

  operationsFor(fieldName: string): QueryOperation[] {
    const meta = this.fieldMeta(fieldName);
    return meta?.operations?.length ? meta.operations : ['EQUALS', 'NOT_EQUALS', 'IS_NULL', 'IS_NOT_NULL'];
  }

  fieldType(fieldName: string): string {
    return this.fieldMeta(fieldName)?.type ?? 'string';
  }

  enumValues(fieldName: string): string[] {
    return this.fieldMeta(fieldName)?.enumValues ?? [];
  }

  inputType(fieldName: string): string {
    switch (this.fieldType(fieldName)) {
      case 'number': return 'number';
      case 'date': return 'date';
      case 'datetime': return 'datetime-local';
      default: return 'text';
    }
  }

  /** When a field changes, reset its operation to a valid default for the new type. */
  onFieldChange(row: ConditionRow): void {
    const ops = this.operationsFor(row.field);
    if (!ops.includes(row.operation)) {
      row.operation = ops[0];
    }
  }

  isBetween(op: QueryOperation): boolean { return op === 'BETWEEN' || op === 'NOT_BETWEEN'; }
  isMultiValue(op: QueryOperation): boolean { return op === 'IN' || op === 'NOT_IN'; }
  isNoValue(op: QueryOperation): boolean { return NO_VALUE_OPS.includes(op); }
  isEnum(fieldName: string): boolean { return this.fieldType(fieldName) === 'enum'; }
  isBoolean(fieldName: string): boolean { return this.fieldType(fieldName) === 'boolean'; }

  // ---- serialization to the v2 QueryRequest contract ----

  private toRequest(): QueryRequest {
    const g = this.toGroup(this.root);
    return { logic: g.logic, conditions: g.conditions, groups: g.groups };
  }

  private toGroup(node: GroupNode): QueryGroup {
    return {
      logic: node.logic,
      conditions: node.conditions.filter(r => r.field).map(r => this.toCondition(r)),
      groups: node.groups.map(g => this.toGroup(g)).filter(g => g.conditions.length || g.groups.length),
    };
  }

  private toCondition(r: ConditionRow): QueryCondition {
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
  }

  private defaultOp(meta: FieldMeta | undefined): QueryOperation {
    if (!meta?.operations?.length) return 'EQUALS';
    return meta.operations.includes('CONTAINS_IGNORE_CASE') ? 'CONTAINS_IGNORE_CASE' : meta.operations[0];
  }
}

function emptyGroup(): GroupNode {
  return { logic: 'AND', conditions: [], groups: [] };
}
