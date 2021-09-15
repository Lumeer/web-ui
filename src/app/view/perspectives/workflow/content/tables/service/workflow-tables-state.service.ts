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
import {BehaviorSubject} from 'rxjs';
import {
  EditedTableCell,
  SelectedTableCell,
  TABLE_COLUMN_WIDTH,
  TableCell,
  TableCellType,
  TableModel,
} from '../../../../../../shared/table/model/table-model';
import {TableColumn} from '../../../../../../shared/table/model/table-column';
import {Collection} from '../../../../../../core/store/collections/collection';
import {AllowedPermissions, ResourcesPermissions} from '../../../../../../core/model/allowed-permissions';
import {Query} from '../../../../../../core/store/navigation/query/query';
import {ViewSettings} from '../../../../../../core/store/views/view';
import {
  deepObjectCopy,
  isNotNullOrUndefined,
  objectsByIdMap,
  objectValues,
} from '../../../../../../shared/utils/common.utils';
import {TableRow} from '../../../../../../shared/table/model/table-row';
import {moveItemsInArray} from '../../../../../../shared/utils/array.utils';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {addAttributeToSettings, moveAttributeInSettings} from '../../../../../../shared/settings/settings.util';
import {WorkflowConfig} from '../../../../../../core/store/workflows/workflow';
import {WorkflowTable} from '../../../model/workflow-table';
import {queryAttributePermissions} from '../../../../../../core/model/query-attribute';
import {AttributesResourceType} from '../../../../../../core/model/resource';
import {ConstraintData, DocumentsAndLinksData} from '@lumeer/data-filters';

@Injectable()
export class WorkflowTablesStateService {
  public readonly selectedCell$ = new BehaviorSubject<SelectedTableCell>(null);
  public readonly editedCell$ = new BehaviorSubject<EditedTableCell>(null);
  public readonly tables$ = new BehaviorSubject<WorkflowTable[]>([]);

  private currentCollectionsMap: Record<string, Collection>;
  private currentLinkTypesMap: Record<string, LinkType>;
  private currentData: DocumentsAndLinksData;
  private currentQuery: Query;
  private currentViewSettings: ViewSettings;
  private currentConfig: WorkflowConfig;
  private currentPermissions: ResourcesPermissions;
  private currentConstraintData: ConstraintData;
  private currentCanManageConfig: boolean;

  private initiallySelected: boolean;

  public updateData(
    collections: Collection[],
    linkTypes: LinkType[],
    data: DocumentsAndLinksData,
    config: WorkflowConfig,
    permissions: ResourcesPermissions,
    query: Query,
    viewSettings: ViewSettings,
    constraintData: ConstraintData,
    canManageConfig: boolean
  ) {
    this.currentCollectionsMap = objectsByIdMap(collections);
    this.currentLinkTypesMap = objectsByIdMap(linkTypes);
    this.currentData = data;
    this.currentConfig = config;
    this.currentPermissions = permissions;
    this.currentQuery = query;
    this.currentViewSettings = viewSettings;
    this.currentConstraintData = constraintData;
    this.currentCanManageConfig = canManageConfig;
  }

  public setTables(tables: WorkflowTable[]) {
    this.tables$.next(tables);
  }

  public get tables(): WorkflowTable[] {
    return this.tables$.value;
  }

  public get selectedCell(): SelectedTableCell {
    return {...this.selectedCell$.value};
  }

  public get editedCell(): SelectedTableCell {
    return {...this.editedCell$.value};
  }

  public get collections(): Collection[] {
    return objectValues(this.currentCollectionsMap || {});
  }

  public get collectionsMap(): Record<string, Collection> {
    return this.currentCollectionsMap;
  }

  public get linkTypes(): LinkType[] {
    return objectValues(this.currentLinkTypesMap || {});
  }

  public get linkTypesMap(): Record<string, LinkType> {
    return this.currentLinkTypesMap;
  }

  public get query(): Query {
    return this.currentQuery;
  }

  public get config(): WorkflowConfig {
    return this.currentConfig;
  }

  public get permissions(): ResourcesPermissions {
    return this.currentPermissions;
  }

  public get constraintData(): ConstraintData {
    return this.currentConstraintData;
  }

  public get canManageConfig(): boolean {
    return this.currentCanManageConfig;
  }

  public get viewSettings(): ViewSettings {
    return this.currentViewSettings;
  }

  public get data(): DocumentsAndLinksData {
    return this.currentData;
  }

  public performInitialSelection(cell: TableCell) {
    if (this.initiallySelected || this.isSelected() || this.isEditing()) {
      return;
    }
    this.initiallySelected = true;
    this.setSelectedCellWithDelay(cell);
  }

  public columns(tableId: string): TableColumn[] {
    return [...(this.findTable(tableId)?.columns || [])];
  }

  public getColumnPermissions(column: TableColumn): AllowedPermissions {
    if (column.collectionId) {
      return queryAttributePermissions(
        {
          resourceId: column.collectionId,
          resourceType: AttributesResourceType.Collection,
        },
        this.currentPermissions
      );
    } else if (column.linkTypeId) {
      return queryAttributePermissions(
        {
          resourceId: column.linkTypeId,
          resourceType: AttributesResourceType.LinkType,
        },
        this.currentPermissions
      );
    }
    return {};
  }

  public isEditing(): boolean {
    return isNotNullOrUndefined(this.editedCell$.value) && Object.keys(this.editedCell$.value).length > 0;
  }

  public isEditingCell(cell: TableCell): boolean {
    return this.isEditing() && cellsAreSame(cell, this.editedCell$.value);
  }

  public isSelected(): boolean {
    return isNotNullOrUndefined(this.selectedCell$.value) && Object.keys(this.selectedCell$.value).length > 0;
  }

  public isCellSelected(cell: TableCell): boolean {
    return this.isSelected() && cellsAreSame(cell, this.selectedCell$.value);
  }

  public isRowSelected(row: TableRow): boolean {
    return this.isSelected() && this.selectedCell.rowId === row.id && this.selectedCell.tableId === row.tableId;
  }

  public resetSelection() {
    this.resetSelectedCell();
    this.resetEditedCell();
  }

  public resetSelectedCell() {
    if (this.isSelected()) {
      this.selectedCell$.next(null);
    }
  }

  public resetEditedCell() {
    if (this.isEditing()) {
      this.editedCell$.next(null);
    }
  }

  public setEditedCell(cell: TableCell, inputValue?: any) {
    const column = this.findTableColumn(cell.tableId, cell.columnId);
    const row = this.findTableRow(cell.tableId, cell.rowId);
    if (canEditCell(cell, column, row)) {
      this.selectedCell$.next(null);
      this.editedCell$.next({...cell, inputValue});
    }
  }

  private setSelectedCellWithDelay(cell: TableCell) {
    setTimeout(() => this.setSelectedCell(cell));
  }

  public setSelectedCell(cell: TableCell) {
    const column = this.findTableColumn(cell.tableId, cell.columnId);
    if (canSelectCell(cell, column)) {
      this.selectedCell$.next(cell);
      this.editedCell$.next(null);
      this.initiallySelected = true;
    }
  }

  public findTableColumn(tableId: string, columnId: string): TableColumn {
    return this.findTableColumns(tableId).find(column => column.id === columnId);
  }

  public findTableColumns(tableId: string): TableColumn[] {
    return this.tables.find(t => t.id === tableId)?.columns || [];
  }

  public findTableRow(tableId: string, rowId: string): TableRow {
    const table = this.tables.find(t => t.id === tableId);
    return table?.rows.find(row => row.id === rowId);
  }

  public findColumnResourcesByColumn(column: TableColumn): {collection: Collection; linkType: LinkType} {
    return {
      collection: this.currentCollectionsMap?.[column.collectionId],
      linkType: this.currentLinkTypesMap?.[column.linkTypeId],
    };
  }

  public findColumnResourcesByColumns(columns: TableColumn[]): {collection: Collection; linkType: LinkType} {
    const collectionId = columns.find(column => column.collectionId)?.collectionId;
    const linkTypeId = columns.find(column => column.linkTypeId)?.linkTypeId;

    return {
      collection: this.currentCollectionsMap?.[collectionId],
      linkType: this.currentLinkTypesMap?.[linkTypeId],
    };
  }

  public selectCell(
    tableIndex: number,
    rowIndex: number | null,
    columnIndex: number,
    type: TableCellType = TableCellType.Body
  ) {
    const table = this.tables[tableIndex];
    if (table) {
      const column = table.columns[columnIndex];
      const row = type === TableCellType.Body ? table.rows[rowIndex] : null;
      if (column && (row || type !== TableCellType.Body)) {
        this.setSelectedCell({
          tableId: table.id,
          columnId: column.id,
          rowId: row?.id,
          documentId: row?.documentId,
          type,
          linkId: row?.linkInstanceId,
        });
      }
    }
  }

  public moveSelectionDownFromEdited() {
    const {tableIndex, rowIndex, columnIndex} = this.getCellIndexes(this.editedCell);
    if (this.numberOfRowsInTable(tableIndex) - 1 === rowIndex) {
      this.setSelectedCell(this.editedCell);
    } else {
      this.selectCell(tableIndex, rowIndex + 1, columnIndex);
      this.resetEditedCell();
    }
  }

  private numberOfRowsInTable(tableIndex: number): number {
    return this.tables[tableIndex]?.rows?.length || 0;
  }

  public getCellIndexes(
    cell: TableCell
  ): {tableIndex: number; rowIndex: number; columnIndex: number; type: TableCellType} {
    const tableIndex = this.tables.findIndex(table => table.id === cell.tableId);
    const tableByIndex = this.tables[tableIndex];
    const columnIndex = tableByIndex?.columns.findIndex(column => column.id === cell.columnId);
    const rowIndex = cell.type === TableCellType.Body ? tableByIndex?.rows.findIndex(row => row.id === cell.rowId) : 0;
    return {tableIndex, columnIndex, rowIndex, type: cell.type};
  }

  private setColumnProperty(
    table: TableModel,
    column: TableColumn,
    properties: Partial<Record<keyof TableColumn, any>>
  ) {
    const newTables = [...this.tables];
    for (let i = 0; i < newTables.length; i++) {
      const newTable = newTables[i];
      if (tablesAreSame(table, newTable)) {
        const columnIndex = newTable.columns.findIndex(col => col.id === column.id);

        if (columnIndex !== -1) {
          const columns = [...newTable.columns];
          columns[columnIndex] = setObjectProperties(newTable.columns[columnIndex], properties);
          newTables[i] = {...newTable, columns};
        }
      }
    }

    this.setTables(newTables);
  }

  private setRowProperty(tableId: string, rowId: string, properties: Partial<Record<keyof TableRow, any>>) {
    const newTables = [...this.tables];
    const tableIndex = newTables.findIndex(table => table.id === tableId);
    if (tableIndex !== -1) {
      const rows = [...newTables[tableIndex].rows];
      const rowIndex = rows.findIndex(r => r.id === rowId);
      if (rowIndex !== -1) {
        rows[rowIndex] = setObjectProperties(rows[rowIndex], properties);
        newTables[tableIndex] = {...newTables[tableIndex], rows};

        this.setTables(newTables);
      }
    }
  }

  public deleteColumn(column: TableColumn) {
    const newTables = [...this.tables];
    const table = this.findTableByColumn(column);
    for (let i = 0; i < newTables.length; i++) {
      const newTable = newTables[i];
      if (tablesAreSame(table, newTable)) {
        const columnIndex = newTable.columns.findIndex(col => col.id === column.id);

        if (columnIndex !== -1) {
          const columns = [...newTable.columns];
          const deletedColumn = columns.splice(columnIndex, 1)[0];
          newTables[i] = {...newTable, columns, width: newTable.width - deletedColumn.width};
        }
      }
    }

    this.setTables(newTables);
  }

  public addColumnToEnd(table: TableModel, column: TableColumn) {
    const firstColumnIndex = table?.columns.findIndex(col => col.collectionId);
    const columnIndex = firstColumnIndex !== -1 ? firstColumnIndex : 0;
    this.addColumnToPosition(table, column, columnIndex);
  }

  public moveColumnToPosition(table: TableModel, column: TableColumn, columnId: string, direction: number) {
    const columnIndex = table?.columns.findIndex(col => col.id === columnId);
    if (columnIndex > -1) {
      this.addColumnToPosition(table, column, columnIndex + direction);
    }
  }

  private addColumnToPosition(table: TableModel, column: TableColumn, position: number) {
    const newTables = [...this.tables];

    for (let i = 0; i < newTables.length; i++) {
      const newTable = newTables[i];
      if (tablesAreSame(table, newTable)) {
        const columns = [...newTable.columns];
        columns.splice(position, 0, {...column, tableId: newTable.id, width: TABLE_COLUMN_WIDTH});
        newTables[i] = {...newTable, columns, width: newTable.width + TABLE_COLUMN_WIDTH};
      }
    }

    this.setTables(newTables);
  }

  public setRowValue(row: TableRow, column: TableColumn, value: any) {
    this.setRowProperty(column.tableId, row.id, {[`data.${column.id}`]: value});
  }

  public removeRow(row: TableRow) {
    const tableIndex = this.findTableIndexByRow(row);
    const rowIndex = this.tables[tableIndex]?.rows.findIndex(r => r.id === row.id);
    if (rowIndex > -1) {
      const newTables = [...this.tables];
      const rows = [...newTables[tableIndex].rows];
      rows.splice(rowIndex, 1);
      newTables[tableIndex] = {...newTables[tableIndex], rows};

      this.setTables(newTables);
    }
  }

  public startColumnCreating(column: TableColumn, name: string) {
    const table = this.findTableByColumn(column);
    this.setColumnProperty(table, column, {name, creating: true});
  }

  public endColumnCreating(column: TableColumn) {
    const table = this.findTableByColumn(column);
    this.setColumnProperty(table, column, {creating: false});
  }

  public addRow(tableId: string, newRow: TableRow) {
    const tableIndex = this.findTableIndexById(tableId);
    if (tableIndex >= 0) {
      const table = this.tables[tableIndex];
      const newTables = [...this.tables];
      const rows = [...newTables[tableIndex].rows, newRow];
      newTables[tableIndex] = {...newTables[tableIndex], rows};

      this.setTables(newTables);

      const columnIndex = table.columns.findIndex(column => column.default);
      setTimeout(() => this.selectCell(tableIndex, rows.length - 1, Math.max(columnIndex, 0)));
    }
  }

  public startRowCreatingWithValue(row: TableRow, column: TableColumn, value: any) {
    this.setRowProperty(row.tableId, row.id, {creating: true, [`data.${column.id}`]: value});
  }

  public startRowCreating(row: TableRow, data: Record<string, any>, documentId: string) {
    this.setRowProperty(row.tableId, row.id, {creating: true, data, documentId});
  }

  public endRowCreating(row: TableRow) {
    this.setRowProperty(row.tableId, row.id, {creating: false});
  }

  public resizeColumn(changedTable: TableModel, column: TableColumn, width: number) {
    this.setColumnProperty(changedTable, column, {width});
  }

  public addColumn(column: TableColumn, position: number) {
    // prevent from detect change for settings
    this.syncColumnSettingsAfterAdd(column, position);
  }

  private syncColumnSettingsAfterAdd(column: TableColumn, position: number) {
    const {collection, linkType} = this.findColumnResourcesByColumn(column);
    this.currentViewSettings = addAttributeToSettings(
      this.currentViewSettings,
      column.attribute.id,
      position,
      collection,
      linkType
    );
  }

  public moveColumns(changedTable: TableModel, from: number, to: number) {
    const newTables = [...this.tables];
    for (let i = 0; i < newTables.length; i++) {
      const table = newTables[i];
      if (tablesAreSame(table, changedTable)) {
        const newColumns = moveItemsInArray(table.columns, from, to);
        newTables[i] = {...table, columns: newColumns};
      }
    }

    this.setTables(newTables);
  }

  public syncColumnSettingsBeforeMove(column: TableColumn, from: number, to: number) {
    if (column?.attribute) {
      const {collection, linkType} = this.findColumnResourcesByColumn(column);
      this.currentViewSettings = moveAttributeInSettings(this.currentViewSettings, from, to, collection, linkType);
    }
  }

  public findTableByColumn(column: TableColumn): WorkflowTable {
    return this.findTable(column.tableId);
  }

  public findTable(id: string): WorkflowTable {
    return this.tables.find(table => table.id === id);
  }

  private findTableIndexByRow(row: TableRow): number {
    return this.findTableIndexById(row.tableId);
  }

  private findTableIndexById(id: string): number {
    return this.tables.findIndex(table => table.id === id);
  }
}

function setObjectProperties<T>(object: T, properties: Record<string, any>): T {
  const copy = deepObjectCopy<T>(object);
  Object.keys(properties).forEach(property => {
    let currentObject = copy;
    const parts = property.split('.');

    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      currentObject[key] = currentObject[key] || {};
      currentObject = currentObject[key];
    }

    currentObject[parts[parts.length - 1]] = properties[property];
  });
  return copy;
}

function tablesAreSame(t1: TableModel, t2: TableModel): boolean {
  return t1.collectionId === t2.collectionId;
}

function cellsAreSame(c1: TableCell, c2: TableCell): boolean {
  const columnAndTableAreSame = c1.type === c2.type && c1.tableId === c2.tableId && c1.columnId === c2.columnId;
  if (c1.type === TableCellType.Body) {
    return columnAndTableAreSame && c1.rowId === c2.rowId && c1.linkId === c2.linkId;
  }
  return columnAndTableAreSame;
}

function canEditCell(cell: TableCell, column: TableColumn, row?: TableRow): boolean {
  if (column.hidden) {
    return false;
  }
  if (cell.type === TableCellType.Header) {
    return column.permissions?.roles?.AttributeEdit && !column.creating;
  } else if (cell.type === TableCellType.Body) {
    const rowEditable = column.collectionId ? row?.documentEditable : row?.linkEditable;
    return column.editable && rowEditable;
  }
  return false;
}

function canSelectCell(cell: TableCell, column: TableColumn): boolean {
  if (column.hidden) {
    return false;
  }
  return true;
}
