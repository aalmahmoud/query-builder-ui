import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';

export interface ExportDialogData {
  columns: { key: string; label: string }[];
}

export interface ExportDialogResult {
  format: 'EXCEL' | 'PDF';
  selectedColumns: string[];
  friendlyHeaders: Record<string, string>;
}

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatCheckboxModule, MatRadioModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Export Data</h2>
    <mat-dialog-content>
      <div class="format-section">
        <label>Format:</label>
        <mat-radio-group [(ngModel)]="format">
          <mat-radio-button value="EXCEL">Excel (.xlsx)</mat-radio-button>
          <mat-radio-button value="PDF">PDF</mat-radio-button>
        </mat-radio-group>
      </div>
      <div class="columns-section">
        <label>Columns:</label>
        <div class="column-list">
          @for (col of data.columns; track col.key) {
            <mat-checkbox [checked]="isSelected(col.key)" (change)="toggle(col.key)">
              {{ col.label }}
            </mat-checkbox>
          }
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(null)">Cancel</button>
      <button mat-flat-button color="primary" (click)="confirm()" [disabled]="selected.size === 0">
        Export
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .format-section, .columns-section { margin-bottom: 16px; }
    .format-section label, .columns-section label {
      display: block; font-weight: 500; margin-bottom: 8px;
    }
    mat-radio-button { margin-right: 16px; }
    .column-list { display: flex; flex-direction: column; gap: 4px; }
  `],
})
export class ExportDialogComponent {
  format: 'EXCEL' | 'PDF' = 'EXCEL';
  selected: Set<string>;

  constructor(
    public ref: MatDialogRef<ExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData
  ) {
    this.selected = new Set<string>(data.columns.map(c => c.key));
  }

  isSelected(key: string): boolean {
    return this.selected.has(key);
  }

  toggle(key: string): void {
    if (this.selected.has(key)) this.selected.delete(key);
    else this.selected.add(key);
  }

  confirm(): void {
    const friendlyHeaders: Record<string, string> = {};
    const selectedColumns = this.data.columns
      .filter(c => this.selected.has(c.key))
      .map(c => { friendlyHeaders[c.key] = c.label; return c.key; });
    this.ref.close({ format: this.format, selectedColumns, friendlyHeaders } as ExportDialogResult);
  }
}
