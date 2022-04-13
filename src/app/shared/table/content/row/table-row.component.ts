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
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {DataInputConfiguration} from '../../../data-input/data-input-configuration';
import {TableColumn, TableColumnGroup} from '../../model/table-column';
import {TableRow} from '../../model/table-row';
import {
  computeElementPositionInParent,
  isNotNullOrUndefined,
  isNullOrUndefinedOrEmpty,
  preventEvent,
} from '../../../utils/common.utils';
import {EditedTableCell, SelectedTableCell, TableCellType} from '../../model/table-model';
import {BehaviorSubject} from 'rxjs';
import {DataInputSaveAction} from '../../../data-input/data-input-save-action';
import {isKeyPrintable, keyboardEventCode, KeyCode} from '../../../key-code';
import {Direction} from '../../../direction';
import {DocumentHintsComponent} from '../../../document-hints/document-hints.component';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {MenuItem} from '../../../menu/model/menu-item';
import {StaticMenuComponent} from '../../../menu/static-menu/static-menu.component';
import {ConstraintData, ConstraintType, DataValue, UnknownConstraint} from '@lumeer/data-filters';
import {initForceTouch} from '../../../utils/html-modifier';
import {animateOpacityEnterLeave} from '../../../animations';

@Component({
  selector: '[table-row]',
  templateUrl: './table-row.component.html',
  styleUrls: ['./table-row.component.scss', '../common/table-cell.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [animateOpacityEnterLeave],
})
export class TableRowComponent implements OnInit, OnChanges {
  @Input()
  public columnGroups: TableColumnGroup[];

  @Input()
  public row: TableRow;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public selectedCell: SelectedTableCell;

  @Input()
  public editedCell: EditedTableCell;

  @Input()
  public detailColumnId: string;

  @Input()
  public cellType: TableCellType = TableCellType.Body;

  @Input()
  public collectionId: string;

  @Input()
  public linkTypeId: string;

  @Input()
  public viewId: string;

  @Output()
  public onClick = new EventEmitter<string>();

  @Output()
  public onDetail = new EventEmitter();

  @Output()
  public onCancel = new EventEmitter<{columnId: string; action: DataInputSaveAction}>();

  @Output()
  public onDoubleClick = new EventEmitter<string>();

  @Output()
  public newValue = new EventEmitter<{columnId: string; value: any; action: DataInputSaveAction}>();

  @Output()
  public linkedDocumentSelect = new EventEmitter<DocumentModel>();

  @Output()
  public menuSelected = new EventEmitter<{row: TableRow; column: TableColumn; item: MenuItem}>();

  @ViewChild(StaticMenuComponent)
  public menuComponent: StaticMenuComponent;

  @ViewChild(DocumentHintsComponent)
  public suggestions: DocumentHintsComponent;

  public readonly constraintType = ConstraintType;
  public readonly configuration: DataInputConfiguration = {
    common: {allowRichText: true},
    boolean: {center: true},
    user: {allowCenterOnlyIcon: true},
    action: {center: true},
  };

  public editedValue: DataValue;
  public suggestedColumn: TableColumn;
  public canSuggestDocuments: boolean;

  public suggesting$ = new BehaviorSubject<DataValue>(null);
  public mouseHoverColumnId$ = new BehaviorSubject(null);

  constructor(public element: ElementRef) {}

  public ngOnInit() {
    initForceTouch(this.element.nativeElement, event => this.onContextMenu(this.selectedCell?.columnId, event));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.row) {
      this.canSuggestDocuments =
        this.row?.suggestDetail || ((this.row?.linkInstanceId || this.row?.linkedDocumentId) && this.row?.suggestLinks);
    }
    if (changes.row || changes.editedCell) {
      this.checkEdited();
    }
  }

  private checkEdited() {
    if (this.isEditing()) {
      const column = this.columnById(this.editedCell.columnId);
      if (this.isColumnEditable(column)) {
        this.editedValue = this.createDataValue(column, this.editedCell.inputValue, true);
        if (this.canSuggestInColumn(column)) {
          this.suggestedColumn = column;
          this.suggesting$.next(this.editedValue);
        } else {
          this.suggestedColumn = null;
        }
      } else {
        this.suggestedColumn = null;
      }
    } else {
      this.suggestedColumn = null;
    }

    if (!this.suggestedColumn) {
      this.endSuggesting();
    }
  }

  private isColumnEditable(column: TableColumn): boolean {
    if (column?.collectionId) {
      return this.row.cellsMap?.[column.id]?.editable && this.row?.documentEditable;
    } else if (column?.linkTypeId) {
      return this.row.cellsMap?.[column.id]?.editable && this.row?.linkEditable;
    }
    return false;
  }

  private canSuggestInColumn(column: TableColumn): boolean {
    if (this.row?.suggestDetail) {
      return !!column.collectionId && column?.attribute?.suggestValues;
    } else if (this.row?.suggestLinks) {
      return !!column.collectionId;
    }
    return false;
  }

  private isEditing(): boolean {
    if (this.isBodyCell()) {
      return this.editedCell?.rowId === this.row?.id && this.editedCell?.tableId === this.row?.tableId;
    }
    return this.editedCell?.type === this.cellType && this.editedCell?.tableId === this.row?.tableId;
  }

  private createDataValue(column: TableColumn, value?: any, typed?: boolean): DataValue {
    const constraint = column.attribute?.constraint || new UnknownConstraint();
    if (typed) {
      return constraint.createInputDataValue(value, this.columnValue(column), this.constraintData);
    }
    const initialValue = isNotNullOrUndefined(value) ? value : this.columnValue(column);
    return constraint.createDataValue(initialValue, this.constraintData);
  }

  private columnById(columnId: string): TableColumn {
    return this.columnGroups.find(group => group.column?.id === columnId)?.column;
  }

  private columnValue(column: TableColumn): any {
    if (column?.attribute) {
      if (column?.collectionId) {
        return this.row.cellsMap?.[column.id]?.data;
      } else if (column?.linkTypeId) {
        return this.row.cellsMap?.[column.id]?.data;
      }
    }
    return null;
  }

  public onNewValue(column: TableColumn, data: {action?: DataInputSaveAction; dataValue: DataValue}) {
    this.editedValue = null;
    if (this.suggestions?.isSelected()) {
      this.suggestions.useSelection();
    } else if (!this.suggestions?.isSelectionConfirmed()) {
      this.saveData(column, data);
    }
    this.suggestions?.close();
  }

  private saveData(column: TableColumn, data: {action?: DataInputSaveAction; dataValue: DataValue}) {
    if (!this.isColumnEditable(column)) {
      this.onDataInputCancel(column, DataInputSaveAction.Direct);
      return;
    }

    const value = data.dataValue.serialize();
    const currentValue = this.columnValue(column);
    if (
      this.isBodyCell() &&
      (currentValue === value || (isNullOrUndefinedOrEmpty(value) && isNullOrUndefinedOrEmpty(currentValue)))
    ) {
      this.onDataInputCancel(column, data.action);
    } else {
      this.newValue.emit({columnId: column.id, value, action: data.action});
    }
  }

  private isBodyCell(): boolean {
    return this.cellType === TableCellType.Body;
  }

  public onDataInputDblClick(column: TableColumn, event: MouseEvent) {
    if (column && !this.isEditingColumn(column)) {
      event.preventDefault();
      this.onDoubleClick.emit(column.id);
    }
  }

  private isEditingColumn(column: TableColumn): boolean {
    return this.isEditing() && this.editedCell?.columnId === column.id;
  }

  public onDataInputCancel(column: TableColumn, action?: DataInputSaveAction) {
    if (column) {
      this.onCancel.emit({columnId: column.id, action});
    }
  }

  public onDataInputClick(column: TableColumn, event: MouseEvent) {
    if (column && !this.isEditingColumn(column)) {
      this.onClick.emit(column.id);
    }
  }

  public trackByColumn(index: number, column: TableColumnGroup): string {
    return column.id;
  }

  public onContextMenu(columnId: string, event: MouseEvent) {
    const columnIndex = columnId && this.columnGroups?.findIndex(group => group.column?.id === columnId);
    const column = this.columnGroups[columnIndex]?.column;
    if (column) {
      this.menuComponent.id = columnId;
      this.menuComponent.items = column.collectionId ? this.row.documentMenuItems : this.row.linkMenuItems;

      const {x, y} = computeElementPositionInParent(event, 'tr');
      this.menuComponent.open(x, y);
    }

    preventEvent(event);
  }

  public onMenuSelected(row: TableRow, columnId: string, item: MenuItem) {
    const column = this.columnGroups?.find(group => group.column?.id === columnId)?.column;
    if (column) {
      this.menuSelected.emit({row, column, item});
    }
  }

  public onDetailClick(event: MouseEvent) {
    preventEvent(event);
    this.onDetail.emit();
  }

  public onUseHint(data: {document: DocumentModel; external: boolean}) {
    this.endSuggesting(!data.external);
    if (this.row?.suggestLinks) {
      this.linkedDocumentSelect.emit(data.document);
    }
  }

  public onValueChange(dataValue: DataValue) {
    this.suggesting$.next(dataValue);
  }

  public onDataInputKeyDown(event: KeyboardEvent) {
    switch (keyboardEventCode(event)) {
      case KeyCode.ArrowDown:
        event.preventDefault();
        this.suggestions?.moveSelection(Direction.Down);
        return;
      case KeyCode.ArrowUp:
        event.preventDefault();
        this.suggestions?.moveSelection(Direction.Up);
        return;
    }

    if (isKeyPrintable(event) && this.suggestions) {
      return this.suggestions.clearSelection();
    }
  }

  public onEnterInvalid() {
    if (this.suggestions?.isSelected()) {
      this.suggestions.useSelection();
    }
  }

  private endSuggesting(cancel = false) {
    if (cancel) {
      this.onDataInputCancel(this.suggestedColumn);
    }
    this.suggesting$.next(null);
    this.suggestedColumn = null;
  }

  public onMouseEnter(columnId: string) {
    this.mouseHoverColumnId$.next(columnId);
  }

  public onMouseLeave(columnId: string) {
    if (this.mouseHoverColumnId$.value === columnId) {
      this.mouseHoverColumnId$.next(null);
    }
  }
}
