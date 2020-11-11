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

import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {
  EditedTableCell,
  SelectedTableCell,
  TableCell,
  TableCellType,
  TableModel,
  TableNewRow,
} from '../../../../../../shared/table/model/table-model';
import {Collection} from '../../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {Query} from '../../../../../../core/store/navigation/query/query';
import {AttributeSortType, ViewSettings} from '../../../../../../core/store/views/view';
import {TableColumn, TableContextMenuItem} from '../../../../../../shared/table/model/table-column';
import {TableRow} from '../../../../../../shared/table/model/table-row';
import {DataRowHiddenComponent} from '../../../../../../shared/data/data-row-component';
import {distinctUntilChanged, skip} from 'rxjs/operators';
import {DataInputSaveAction} from '../../../../../../shared/data-input/data-input-save-action';
import {HeaderMenuId, RowMenuId} from './workflow-tables-menu.service';
import {WorkflowTablesDataService} from './workflow-tables-data.service';
import {WorkflowTablesStateService} from './workflow-tables-state.service';
import {WorkflowTablesKeyboardService} from './workflow-tables-keyboard.service';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../../../core/store/link-instances/link.instance';
import {WorkflowConfig} from '../../../../../../core/store/workflows/workflow';
import {ConstraintData} from '../../../../../../core/model/data/constraint';
import {WorkflowTable} from '../../../model/workflow-table';

@Injectable()
export class WorkflowTablesService {
  private hiddenComponent?: () => DataRowHiddenComponent;

  constructor(
    private stateService: WorkflowTablesStateService,
    private keyboardService: WorkflowTablesKeyboardService,
    private dataService: WorkflowTablesDataService
  ) {
    this.stateService.selectedCell$.pipe(skip(1), distinctUntilChanged()).subscribe(() => {
      if (this.isSelected()) {
        this.hiddenComponent()?.focus();
      } else {
        this.hiddenComponent()?.blur();
      }
    });
  }

  public get selectedCell$(): Observable<SelectedTableCell> {
    return this.stateService.selectedCell$.asObservable();
  }

  public get editedCell$(): Observable<EditedTableCell> {
    return this.stateService.editedCell$.asObservable();
  }

  public get tables$(): Observable<WorkflowTable[]> {
    return this.stateService.tables$.asObservable();
  }

  public setHiddenComponent(hiddenComponent?: () => DataRowHiddenComponent) {
    this.hiddenComponent = hiddenComponent;
  }

  public onRowMenuSelected(
    row: TableRow,
    column: TableColumn,
    item: TableContextMenuItem,
    type: TableCellType = TableCellType.Body
  ) {
    switch (item.id) {
      case RowMenuId.Edit:
        this.stateService.setEditedCell({
          rowId: row.id,
          columnId: column.id,
          tableId: column.tableId,
          linkId: row.linkInstanceId,
          type,
        });
        break;
      case RowMenuId.Detail:
        this.dataService.showRowDetail(row, column);
        break;
      case RowMenuId.Delete:
        this.dataService.removeRow(row, column);
        break;
      case RowMenuId.Unlink:
        this.dataService.unlinkRow(row, column);
        break;
    }
  }

  public onRowDetail(row: TableRow) {
    this.dataService.showRowDocumentDetail(row);
  }

  public onColumnHiddenMenuSelected(columns: TableColumn[]) {
    this.dataService.showColumns(columns);
  }

  public onColumnSortChanged(column: TableColumn, sort: AttributeSortType) {
    this.dataService.changeSort(column, sort);
  }

  public onColumnMenuSelected(column: TableColumn, item: TableContextMenuItem) {
    switch (item.id) {
      case HeaderMenuId.Edit:
        this.stateService.setEditedCell({
          columnId: column.id,
          tableId: column.tableId,
          type: TableCellType.Header,
          linkId: undefined,
        });
        break;
      case HeaderMenuId.Type:
        this.dataService.showAttributeType(column);
        break;
      case HeaderMenuId.Function:
        this.dataService.showAttributeFunction(column);
        break;
      case HeaderMenuId.Delete:
        this.deleteColumn(column);
        break;
      case HeaderMenuId.Displayed:
        this.setDisplayedAttribute(column);
        break;
      case HeaderMenuId.Hide:
        this.dataService.hideColumn(column);
        break;
      case HeaderMenuId.AddToRight:
        this.copyColumnToPosition(column, 1);
        break;
      case HeaderMenuId.AddToLeft:
        this.copyColumnToPosition(column, 0);
        break;
      case HeaderMenuId.AddLinkColumn:
        this.addLinkColumn(column);
        break;
    }
  }

  private addLinkColumn(column: TableColumn) {
    const table = this.stateService.findTableByColumn(column);
    const newColumn = this.dataService.createEmptyLinkColumn(table);
    this.stateService.addColumnToEnd(table, newColumn);
  }

  private copyColumnToPosition(column: TableColumn, direction: number) {
    const table = this.stateService.findTableByColumn(column);
    const newColumn = this.dataService.copyTableColumn(table, column);
    this.stateService.moveColumnToPosition(table, newColumn, column.id, direction);
  }

  private setDisplayedAttribute(column: TableColumn) {
    if (column?.collectionId && column?.attribute?.id) {
      this.dataService.setDisplayedAttribute(column);
    }
  }

  private deleteColumn(column: TableColumn) {
    if (column.attribute) {
      this.dataService.deleteAttribute(column);
    } else {
      this.stateService.deleteColumn(column);
    }
  }

  public onRowNewValue(
    row: TableRow,
    column: TableColumn,
    value: any,
    action: DataInputSaveAction,
    cellType: TableCellType
  ) {
    if (row.documentId) {
      this.dataService.saveRowNewValue(row, column, value);
    } else if (cellType === TableCellType.NewRow) {
      this.dataService.createNewDocument(<TableNewRow>row, column, value);
    }

    const cell = {rowId: row.id, columnId: column.id, type: TableCellType.Body, tableId: column.tableId};
    this.onCellSave(cell, action);
  }

  public resetSelection() {
    this.dataService.resetSidebar();
    this.stateService.resetSelection();
  }

  public newHiddenInput(value: string) {
    if (this.isSelected()) {
      this.stateService.setEditedCell(this.stateService.selectedCell, value);
    }
  }

  public resetCellSelection(cell: TableCell, action: DataInputSaveAction) {
    if (action === DataInputSaveAction.Enter) {
      return;
    }
    if (this.isEditing() && this.isEditingCell(cell)) {
      this.stateService.setSelectedCell({...cell});
    } else if (this.isSelected() && this.isCellSelected(cell)) {
      this.stateService.resetSelectedCell();
    }
  }

  public onKeyDown(event: KeyboardEvent) {
    this.keyboardService.onKeyDown(event);
  }

  private isEditing(): boolean {
    return this.stateService.isEditing();
  }

  private isEditingCell(cell: TableCell): boolean {
    return this.stateService.isEditingCell(cell);
  }

  private isSelected(): boolean {
    return this.stateService.isSelected();
  }

  private isCellSelected(cell: TableCell): boolean {
    return this.stateService.isCellSelected(cell);
  }

  public onCellClick(cell: TableCell) {
    this.stateService.setSelectedCell({...cell});
  }

  public onCellSave(cell: TableCell, action: DataInputSaveAction) {
    if (this.isEditingCell(cell)) {
      if ([DataInputSaveAction.Button, DataInputSaveAction.Select].includes(action)) {
        this.stateService.setSelectedCell({...cell});
      } else if (DataInputSaveAction.Direct === action) {
        this.stateService.moveSelectionDownFromEdited();
      }
    }
  }

  public onCellDoubleClick(cell: TableCell) {
    this.stateService.setEditedCell(cell);
  }

  public onColumnRename(column: TableColumn, name: string) {
    if (column?.attribute) {
      this.dataService.renameAttribute(column, name);
    } else {
      this.dataService.createAttribute(column, name);
    }
  }

  public onColumnResize(changedTable: TableModel, column: TableColumn, width: number) {
    this.dataService.resizeColumn(changedTable, column, width);
  }

  public onColumnMove(changedTable: TableModel, from: number, to: number) {
    this.dataService.moveColumns(changedTable, from, to);
  }

  public onUpdateSettings(viewSettings: ViewSettings) {
    this.dataService.checkSettingsChange(viewSettings);
  }

  public onUpdateData(
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    config: WorkflowConfig,
    permissions: Record<string, AllowedPermissions>,
    query: Query,
    viewSettings: ViewSettings,
    constraintData: ConstraintData
  ) {
    this.dataService.createAndSyncTables(
      collections,
      documents,
      linkTypes,
      linkInstances,
      config,
      permissions,
      query,
      viewSettings,
      constraintData
    );
  }

  public onTableResize(table: WorkflowTable, height: number) {
    this.dataService.resizeTable(table, height);
  }

  public onNewRow(table: WorkflowTable) {
    this.dataService.createNewRow(table.id);
  }
}
