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
  TableCell,
  TableCellType,
  TableModel,
} from '../../../../../../shared/table/model/table-model';
import {TableColumn} from '../../../../../../shared/table/model/table-column';
import {Collection} from '../../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {Query} from '../../../../../../core/store/navigation/query/query';
import {ViewSettings} from '../../../../../../core/store/views/view';
import {deepObjectCopy, isNotNullOrUndefined, objectsByIdMap} from '../../../../../../shared/utils/common.utils';
import {TableRow} from '../../../../../../shared/table/model/table-row';
import {moveItemsInArray} from '../../../../../../shared/utils/array.utils';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {addAttributeToSettings, moveAttributeInSettings} from '../../../../../../shared/settings/settings.util';
import {LinkInstance} from '../../../../../../core/store/link-instances/link.instance';
import {WorkflowConfig} from '../../../../../../core/store/workflows/workflow';
import {ConstraintData} from '../../../../../../core/model/data/constraint';
import {WorkflowTable} from '../../../model/workflow-table';
import {queryAttributePermissions} from '../../../../../../core/model/query-attribute';
import {AttributesResourceType} from '../../../../../../core/model/resource';

@Injectable()
export class WorkflowTablesStateService {
  public readonly selectedCell$ = new BehaviorSubject<SelectedTableCell>(null);
  public readonly editedCell$ = new BehaviorSubject<EditedTableCell>(null);
  public readonly tables$ = new BehaviorSubject<WorkflowTable[]>([]);

  private currentCollectionsMap: Record<string, Collection>;
  private currentLinkTypesMap: Record<string, LinkType>;
  private currentDocuments: DocumentModel[];
  private currentLinkInstances: LinkInstance[];
  private currentQuery: Query;
  private currentViewSettings: ViewSettings;
  private currentConfig: WorkflowConfig;
  private currentPermissions: Record<string, AllowedPermissions>;
  private currentConstraintData: ConstraintData;

  public updateData(
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
    this.currentCollectionsMap = objectsByIdMap(collections);
    this.currentLinkTypesMap = objectsByIdMap(linkTypes);
    this.currentDocuments = documents;
    this.currentLinkInstances = linkInstances;
    this.currentConfig = config;
    this.currentPermissions = permissions;
    this.currentQuery = query;
    this.currentViewSettings = viewSettings;
    this.currentConstraintData = constraintData;
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
    return Object.values(this.currentCollectionsMap || {});
  }

  public get collectionsMap(): Record<string, Collection> {
    return this.currentCollectionsMap;
  }

  public get linkTypes(): LinkType[] {
    return Object.values(this.currentLinkTypesMap || {});
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

  public get permissions(): Record<string, AllowedPermissions> {
    return this.currentPermissions;
  }

  public get constraintData(): ConstraintData {
    return this.currentConstraintData;
  }

  public get viewSettings(): ViewSettings {
    return this.currentViewSettings;
  }

  public get documents(): DocumentModel[] {
    return this.currentDocuments;
  }

  public get linkInstances(): LinkInstance[] {
    return this.currentLinkInstances;
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
        this.currentPermissions,
        this.linkTypesMap
      );
    } else if (column.linkTypeId) {
      return queryAttributePermissions(
        {
          resourceId: column.linkTypeId,
          resourceType: AttributesResourceType.LinkType,
        },
        this.currentPermissions,
        this.linkTypesMap
      );
    }
    return {};
  }

  public isEditing(): boolean {
    return isNotNullOrUndefined(this.editedCell$.value);
  }

  public isEditingCell(cell: TableCell): boolean {
    return this.isEditing() && cellsAreSame(cell, this.editedCell$.value);
  }

  public isSelected(): boolean {
    return isNotNullOrUndefined(this.selectedCell$.value);
  }

  public isCellSelected(cell: TableCell): boolean {
    return this.isSelected() && cellsAreSame(cell, this.selectedCell$.value);
  }

  public resetSelection() {
    this.resetSelectedCell();
    this.resetEditedCell();
  }

  public resetSelectedCell() {
    this.selectedCell$.next(null);
  }

  public resetEditedCell() {
    this.editedCell$.next(null);
  }

  public setEditedCell(cell: TableCell, inputValue?: any) {
    const column = this.findTableColumn(cell.tableId, cell.columnId);
    if (canEditCell(cell, column)) {
      this.selectedCell$.next(null);
      this.editedCell$.next({...cell, inputValue});
    }
  }

  public setSelectedCell(cell: TableCell) {
    const column = this.findTableColumn(cell.tableId, cell.columnId);
    if (canSelectCell(cell, column)) {
      this.selectedCell$.next(cell);
      this.editedCell$.next(null);
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
      const row = isNotNullOrUndefined(rowIndex) ? table.rows[rowIndex] : null;
      if (column && (row || type !== TableCellType.Body)) {
        this.setSelectedCell({tableId: table.id, columnId: column.id, rowId: row?.id, type});
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
    const rowIndex = tableByIndex?.rows.findIndex(row => row.id === cell.rowId);
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

  private setRowProperty(tableId: string, row: TableRow, properties: Partial<Record<keyof TableRow, any>>) {
    const newTables = [...this.tables];
    const tableIndex = newTables.findIndex(table => table.id === tableId);
    if (tableIndex !== -1) {
      const rows = [...newTables[tableIndex].rows];
      const rowIndex = rows.findIndex(r => r.id === row.id);
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
          columns.splice(columnIndex, 1);
          newTables[i] = {...newTable, columns};
        }
      }
    }

    this.setTables(newTables);
  }

  public addColumnToPosition(columnId: string, column: TableColumn, direction: number) {
    const table = this.findTableByColumn(column);
    const columnIndex = table?.columns.findIndex(col => col.id === columnId);
    if (columnIndex > -1) {
      const newTables = [...this.tables];

      for (let i = 0; i < newTables.length; i++) {
        const newTable = newTables[i];
        if (tablesAreSame(table, newTable)) {
          const columns = [...newTable.columns];
          columns.splice(columnIndex + direction, 0, {...column, tableId: newTable.id});
          newTables[i] = {...newTable, columns};
        }
      }

      this.setTables(newTables);
    }
  }

  public setRowValue(row: TableRow, column: TableColumn, value: any) {
    this.setRowProperty(column.tableId, row, {[`data.${column.id}`]: value});
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

  public startRowCreating(row: TableRow, column: TableColumn, value) {
    this.setRowProperty(row.tableId, row, {creating: true, [`data.${column.id}`]: value});
  }

  public endRowCreating(row: TableRow) {
    this.setRowProperty(row.tableId, row, {creating: false});
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

  public syncColumnSettingsBeforeMove(table: TableModel, from: number, to: number) {
    const column = table.columns[from];
    if (column) {
      const {collection, linkType} = this.findColumnResourcesByColumn(column);
      this.currentViewSettings = moveAttributeInSettings(this.currentViewSettings, from, to, collection, linkType);
    }
  }

  public findTableByColumn(column: TableColumn): TableModel {
    return this.findTable(column.tableId);
  }

  public findTable(id: string): TableModel {
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
    return columnAndTableAreSame && c1.rowId === c2.rowId;
  }
  return columnAndTableAreSame;
}

function canEditCell(cell: TableCell, column: TableColumn): boolean {
  if (column.hidden) {
    return false;
  }
  if (cell.type === TableCellType.Header) {
    return column.manageable && !column.creating;
  } else if (cell.type === TableCellType.Body) {
    return column.editable;
  }
  return false;
}

function canSelectCell(cell: TableCell, column: TableColumn): boolean {
  if (column.hidden) {
    return false;
  }
  return true;
}
