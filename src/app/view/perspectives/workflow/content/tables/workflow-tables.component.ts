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
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {Query} from '../../../../../core/store/navigation/query/query';
import {Collection} from '../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {AttributeSortType, View, ViewSettings} from '../../../../../core/store/views/view';
import {ResourcesPermissions} from '../../../../../core/model/allowed-permissions';
import {Observable} from 'rxjs';
import {WorkflowTablesService} from './service/workflow-tables.service';
import {
  EditedTableCell,
  SelectedTableCell,
  TableCell,
  TableCellType,
  TableModel,
} from '../../../../../shared/table/model/table-model';
import {AppState} from '../../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {distinctUntilChanged} from 'rxjs/operators';
import {deepObjectsEquals} from '../../../../../shared/utils/common.utils';
import {HiddenInputComponent} from '../../../../../shared/input/hidden-input/hidden-input.component';
import {DataInputSaveAction} from '../../../../../shared/data-input/data-input-save-action';
import {TableRow} from '../../../../../shared/table/model/table-row';
import {TableColumn} from '../../../../../shared/table/model/table-column';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {WorkflowConfig, WorkflowStemConfig} from '../../../../../core/store/workflows/workflow';
import {WorkflowTable} from '../../model/workflow-table';
import {DataInputConfiguration} from '../../../../../shared/data-input/data-input-configuration';
import {TableComponent} from '../../../../../shared/table/table.component';
import {clickedInsideElement} from '../../../../../shared/utils/html-modifier';
import {APP_NAME_SELECTOR} from '../../../../../core/constants';
import {WORKFLOW_SIDEBAR_SELECTOR} from './service/workflow-utils';
import {MenuItem} from '../../../../../shared/menu/model/menu-item';
import {ConditionType, ConditionValue, ConstraintData, DocumentsAndLinksData} from '@lumeer/data-filters';
import {queryStemsAreSame} from '../../../../../core/store/navigation/query/query.util';
import {WorkflowPerspectiveConfiguration} from '../../../perspective-configuration';

@Component({
  selector: 'workflow-tables',
  templateUrl: './workflow-tables.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowTablesComponent implements OnChanges {
  @Input()
  public viewSettings: ViewSettings;

  @Input()
  public query: Query;

  @Input()
  public permissions: ResourcesPermissions;

  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public data: DocumentsAndLinksData;

  @Input()
  public config: WorkflowConfig;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public selectedDocumentId: string;

  @Input()
  public dataLoaded: boolean;

  @Input()
  public workflowId: string;

  @Input()
  public currentView: View;

  @Input()
  public perspectiveConfiguration: WorkflowPerspectiveConfiguration;

  @Output()
  public configChange = new EventEmitter<WorkflowConfig>();

  @ViewChildren('lmrTable')
  public tableComponents: QueryList<TableComponent>;

  @ViewChild(HiddenInputComponent)
  public hiddenInputComponent: HiddenInputComponent;

  public readonly configuration: DataInputConfiguration = {color: {limitWidth: true}};

  public tables$: Observable<WorkflowTable[]>;
  public selectedCell$: Observable<SelectedTableCell>;
  public editedCell$: Observable<EditedTableCell>;

  constructor(private store$: Store<AppState>, private tablesService: WorkflowTablesService) {
    this.tablesService.setHiddenComponent(() => this.hiddenInputComponent);
    this.tables$ = this.tablesService.tables$.pipe(distinctUntilChanged((a, b) => deepObjectsEquals(a, b)));
    this.selectedCell$ = this.tablesService.selectedCell$.pipe(distinctUntilChanged((a, b) => deepObjectsEquals(a, b)));
    this.editedCell$ = this.tablesService.editedCell$.pipe(distinctUntilChanged((a, b) => deepObjectsEquals(a, b)));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.currentView) {
      this.tablesService.setCurrentView(this.currentView);
    }
    if (changes.workflowId) {
      this.tablesService.setWorkflowId(this.workflowId);
    }
    if (this.onlyViewSettingsChanged(changes)) {
      this.tablesService.onUpdateSettings(this.viewSettings);
    } else if (
      changes.collections ||
      changes.query ||
      changes.permissions ||
      changes.viewSettings ||
      changes.data ||
      changes.linkTypes ||
      changes.config ||
      changes.constraintData ||
      changes.canManageConfig ||
      changes.perspectiveConfiguration
    ) {
      this.tablesService.onUpdateData(
        this.collections,
        this.linkTypes,
        this.data,
        this.config,
        this.permissions,
        this.query,
        this.viewSettings,
        this.constraintData,
        this.canManageConfig,
        this.perspectiveConfiguration
      );
    }
  }

  private onlyViewSettingsChanged(changes: SimpleChanges): boolean {
    return changes.viewSettings && Object.keys(changes).length === 1;
  }

  public trackByTable(index: number, table: TableModel): string {
    return table.id;
  }

  public trackByStem(index: number, stemConfig: WorkflowStemConfig): string {
    const allIds = [stemConfig.stem.collectionId, ...(stemConfig.stem.linkTypeIds || [])];
    return allIds.join('');
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    this.tablesService.onKeyDown(event);
  }

  public onColumnMove(table: TableModel, data: {from: number; to: number}) {
    this.tablesService.onColumnMove(table, data.from, data.to);
  }

  public onColumnResize(table: TableModel, data: {column: TableColumn; width: number}) {
    this.tablesService.onColumnResize(table, data.column, data.width);
  }

  public onTableCellClick(cell: TableCell) {
    this.tablesService.onCellClick(cell);
  }

  public onTableCellDoubleClick(cell: TableCell) {
    this.tablesService.onCellDoubleClick(cell);
  }

  public onClickInsideTables(event: MouseEvent) {
    if (event.isTrusted) {
      this.checkClickOutsideTables(event);
    }
  }

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent) {
    if (event.isTrusted) {
      this.checkClickOutsideTables(event);
    }
  }

  private checkClickOutsideTables(event: MouseEvent) {
    const isInsideApp = clickedInsideElement(event, APP_NAME_SELECTOR);
    const isInsideTables = this.tableComponents.some(component => component.containsElement(event.target));
    if (isInsideApp && !isInsideTables) {
      this.tablesService.resetSelection();
    }

    const isInsideSidebar = clickedInsideElement(event, WORKFLOW_SIDEBAR_SELECTOR);
    if (isInsideApp && !isInsideTables && !isInsideSidebar && this.perspectiveConfiguration?.showSidebar) {
      this.tablesService.resetSidebar();
    }
  }

  public onTableCellCancel(data: {cell: TableCell; action?: DataInputSaveAction}) {
    this.tablesService.resetCellSelection(data.cell, data.action);
  }

  public onNewHiddenInput(input: string) {
    this.tablesService.newHiddenInput(input);
  }

  public onRowNewValue(data: {
    row: TableRow;
    column: TableColumn;
    value: any;
    action: DataInputSaveAction;
    cellType: TableCellType;
  }) {
    this.tablesService.onRowNewValue(data.row, data.column, data.value, data.action, data.cellType);
  }

  public onColumnRename(data: {column: TableColumn; name: string}) {
    this.tablesService.onColumnRename(data.column, data.name);
  }

  public onColumnMenuSelected(data: {column: TableColumn; item: MenuItem}) {
    this.tablesService.onColumnMenuSelected(data.column, data.item);
  }

  public onRowMenuSelected(data: {row: TableRow; column: TableColumn; item: MenuItem; cellType: TableCellType}) {
    this.tablesService.onRowMenuSelected(data.row, data.column, data.item, data.cellType);
  }

  public onColumnHiddenMenuSelected(columns: TableColumn[]) {
    this.tablesService.onColumnHiddenMenuSelected(columns);
  }

  public onColumnSortChanged(data: {column: TableColumn; type: AttributeSortType | null}) {
    this.tablesService.onColumnSortChanged(data.column, data.type);
  }

  public onColumnFilterChanged(data: {
    column: TableColumn;
    index: number;
    condition: ConditionType;
    values: ConditionValue[];
    new?: boolean;
  }) {
    this.tablesService.onColumnFilterChanged(data.column, data.index, data.condition, data.values, data.new);
  }

  public onColumnFilterRemoved(data: {column: TableColumn; index: number}) {
    this.tablesService.onColumnFilterRemoved(data.column, data.index);
  }

  public onStemConfigChange(newStemConfig: WorkflowStemConfig, index: number) {
    const stemsConfigs = [...this.config.stemsConfigs];
    for (let i = 0; i < stemsConfigs.length; i++) {
      const stemConfig = stemsConfigs[i];
      if (queryStemsAreSame(stemConfig.stem, newStemConfig.stem)) {
        stemsConfigs[i] = {...newStemConfig, stem: stemConfig.stem};
      }
    }
    const newConfig = {...this.config, stemsConfigs};
    this.configChange.emit(newConfig);
  }

  public onRowDetail(row: TableRow) {
    this.tablesService.onRowDetail(row);
  }

  public onRowHierarchyToggle(row: TableRow) {
    this.tablesService.onHierarchyToggle(row);
  }

  public onTableResize(table: WorkflowTable, height: number) {
    this.tablesService.onTableResize(table, height);
  }

  public onRowNewClick(table: WorkflowTable) {
    this.tablesService.onNewRow(table);
  }

  public onRowLinkedDocumentSelect(data: {row: TableRow; document: DocumentModel}) {
    this.tablesService.onRowLinkedDocumentSelect(data.row, data.document);
  }

  public onCopy() {
    this.tablesService.onCopy();
  }
}
