/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  SimpleChanges,
  EventEmitter,
  Output,
  SimpleChange, OnDestroy, ViewChildren, QueryList
} from '@angular/core';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {DataRow, DataRowService} from '../../../data/data-row.service';
import {Query} from '../../../../core/store/navigation/query/query';
import {KeyCode} from '../../../key-code';
import {DocumentDataRowComponent} from './row/document-data-row.component';
import {isNotNullOrUndefined, isNullOrUndefined} from '../../../utils/common.utils';

@Component({
  selector: 'document-data',
  templateUrl: './document-data.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DataRowService],
})
export class DocumentDataComponent implements OnChanges, OnDestroy {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public defaultAttribute: Attribute;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public query: Query;

  @Output()
  public attributeTypeClick = new EventEmitter<Attribute>();

  @Output()
  public attributeFunctionCLick = new EventEmitter<Attribute>();

  @ViewChildren(DocumentDataRowComponent)
  public rows: QueryList<DocumentDataRowComponent>;

  private focused: { row?: number, column?: number } = {};

  constructor(public dataRowService: DataRowService) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.objectChanged(changes.collection) || this.objectChanged(changes.document)) {
      if (this.collection && this.document) {
        this.dataRowService.init(this.collection, this.document);
      }
    }
  }

  private objectChanged(change: SimpleChange): boolean {
    return change && (!change.previousValue || change.previousValue.id !== change.currentValue.id);
  }

  public onNewKey(value: string, index: number) {
    this.dataRowService.updateRow(index, value);
  }

  public onNewValue(value: any, row: DataRow, index: number) {
    this.dataRowService.updateRow(index, null, value);
  }

  public ngOnDestroy() {
    this.dataRowService.destroy();
  }

  public onRemoveRow(index: number) {
    this.dataRowService.deleteRow(index);
  }

  public onCreateRow() {
    this.dataRowService.addRow();
  }

  public onAttributeFunction(row: DataRow) {
    if (row.attribute) {
      this.attributeFunctionCLick.emit(row.attribute);
    }
  }

  public onAttributeType(row: DataRow) {
    if (row.attribute) {
      this.attributeTypeClick.emit(row.attribute);
    }
  }

  public onInputKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.ArrowDown:
      case KeyCode.ArrowUp:
      case KeyCode.ArrowLeft:
      case KeyCode.ArrowRight:
        event.preventDefault();
        event.stopPropagation();
        const x = event.code === KeyCode.ArrowRight ? 1 : event.code === KeyCode.ArrowLeft ? -1 : 0;
        const y = event.code === KeyCode.ArrowUp ? -1 : event.code === KeyCode.ArrowDown ? 1 : 0;
        this.moveFocus(x, y);
        return;
      case KeyCode.Tab:
        event.preventDefault();
        event.stopPropagation();
        const column = this.focused.column;
        const row = this.focused.row;
        let xTab = 0;
        let yTab = 0;
        if (event.shiftKey) {
          xTab = isNotNullOrUndefined(column) ? (column === 0 ? (row > 0 ? 1 : 0) : -1) : 0;
          yTab = isNotNullOrUndefined(column) ? (column === 0 ? -1 : 0) : 0;
        } else {
          const maxRowIndex = this.dataRowService.rows$.value.length - 1;
          xTab = isNotNullOrUndefined(column) ? (column === 0 ? 1 : (row < maxRowIndex ? -1 : 0)) : 0;
          yTab = isNotNullOrUndefined(column) ? (column === 0 ? 0 : 1) : 0;
        }

        this.moveFocus(xTab, yTab);
        return;
      case KeyCode.NumpadEnter:
      case KeyCode.Enter:
      case KeyCode.F2:
        event.preventDefault();
        event.stopPropagation();
        this.emitEdit();
        return;
    }
  }

  private moveFocus(x: number, y: number) {
    const {row, column} = this.focused;
    if (isNullOrUndefined(row) || isNullOrUndefined(column)) {
      return;
    }

    const maxRowIndex = this.dataRowService.rows$.value.length - 1;
    const maxColumnIndex = 1;

    const newRow = Math.max(0, Math.min(row + y, maxRowIndex));
    const newColumn = Math.max(0, Math.min(column + x, maxColumnIndex));

    if (newRow !== row || newColumn !== column) {
      this.emitFocus(newRow, newColumn);
    }

  }

  public onFocus(row: number, column: number) {
    this.emitFocus(row, column);
  }

  private emitFocus(row: number, column: number) {
    this.focused = {row, column};
    this.rows.forEach((component, index) => {
      if (index === row) {
        component.focusKey(column === 0);
        component.focusValue(column === 1);
      } else {
        component.focusKey(false);
        component.focusValue(false);
      }
    })
  }

  public emitEdit() {
    const {row, column} = this.focused;
    if (isNullOrUndefined(row) || isNullOrUndefined(column)) {
      return;
    }

    this.focused = {};
    const documentDataRowComponent = this.rows.toArray()[row];
    if (documentDataRowComponent) {
      if (column === 0) {
        documentDataRowComponent.startKeyEditing();
      } else if (column === 1) {
        documentDataRowComponent.startValueEditing();
      }
    }

  }

  public resetFocus() {
    this.focused = {};
  }

  public trackByRow(index: number, row: DataRow): string {
    return row.id;
  }
}
