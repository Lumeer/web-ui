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
  HostListener,
  ViewChildren,
  QueryList,
  ElementRef,
  ViewChild,
  EventEmitter,
  Output,
} from '@angular/core';
import {Query} from '../../../../../core/store/navigation/query/query';
import {Collection} from '../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {AttributeSortType, ViewSettings} from '../../../../../core/store/views/view';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {Observable} from 'rxjs';
import {WorkflowTablesService} from './service/workflow-tables.service';
import {
  EditedTableCell,
  SelectedTableCell,
  TableCell,
  TableCellType,
  TableModel,
} from '../../../../../shared/table/model/table-model';
import {ConstraintData} from '../../../../../core/model/data/constraint';
import {AppState} from '../../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {distinctUntilChanged} from 'rxjs/operators';
import {deepObjectsEquals, preventEvent} from '../../../../../shared/utils/common.utils';
import {HiddenInputComponent} from '../../../../../shared/input/hidden-input/hidden-input.component';
import {DataInputSaveAction} from '../../../../../shared/data-input/data-input-save-action';
import {TableRow} from '../../../../../shared/table/model/table-row';
import {TableColumn, TableContextMenuItem} from '../../../../../shared/table/model/table-column';
import {WorkflowTablesMenuService} from './service/workflow-tables-menu.service';
import {WorkflowTablesDataService} from './service/workflow-tables-data.service';
import {WorkflowTablesStateService} from './service/workflow-tables-state.service';
import {WorkflowTablesKeyboardService} from './service/workflow-tables-keyboard.service';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../../core/store/link-instances/link.instance';
import {WorkflowConfig, WorkflowStemConfig} from '../../../../../core/store/workflows/workflow';
import {WorkflowTable} from '../../model/workflow-table';
import {DataInputConfiguration} from '../../../../../shared/data-input/data-input-configuration';

@Component({
  selector: 'workflow-tables',
  templateUrl: './workflow-tables.component.html',
  styleUrls: ['./workflow-tables.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    WorkflowTablesService,
    WorkflowTablesMenuService,
    WorkflowTablesDataService,
    WorkflowTablesStateService,
    WorkflowTablesKeyboardService,
  ],
})
export class WorkflowTablesComponent implements OnChanges {
  @Input()
  public viewSettings: ViewSettings;

  @Input()
  public query: Query;

  @Input()
  public permissions: Record<string, AllowedPermissions>;

  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public linkInstances: LinkInstance[];

  @Input()
  public documents: DocumentModel[];

  @Input()
  public config: WorkflowConfig;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public canManageConfig: boolean;

  @Output()
  public configChange = new EventEmitter<WorkflowConfig>();

  @ViewChildren('lmrTable', {read: ElementRef})
  public tableComponents: QueryList<ElementRef>;

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
    if (this.onlyViewSettingsChanged(changes)) {
      this.tablesService.onUpdateSettings(this.viewSettings);
    } else if (
      changes.collections ||
      changes.query ||
      changes.permissions ||
      changes.viewSettings ||
      changes.documents ||
      changes.linkTypes ||
      changes.linkInstances ||
      changes.config ||
      changes.constraintData
    ) {
      this.tablesService.onUpdateData(
        this.collections,
        this.documents,
        this.linkTypes,
        this.linkInstances,
        this.config,
        this.permissions,
        this.query,
        this.viewSettings,
        this.constraintData
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

  public onClickOutsideTables(event: Event) {
    this.checkClickOutsideTables(event);
  }

  public onClickInsideTables(event: MouseEvent) {
    this.checkClickOutsideTables(event);
  }

  @HostListener('document:click', ['$event'])
  private onDocumentClick(event: MouseEvent) {
    this.checkClickOutsideTables(event);
  }

  private checkClickOutsideTables(event: Event) {
    if (!this.tableComponents.some(component => component.nativeElement.contains(event.target))) {
      this.tablesService.resetSelection();
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

  public onColumnMenuSelected(data: {column: TableColumn; item: TableContextMenuItem}) {
    this.tablesService.onColumnMenuSelected(data.column, data.item);
  }

  public onRowMenuSelected(data: {
    row: TableRow;
    column: TableColumn;
    item: TableContextMenuItem;
    cellType: TableCellType;
  }) {
    this.tablesService.onRowMenuSelected(data.row, data.column, data.item, data.cellType);
  }

  public onColumnHiddenMenuSelected(columns: TableColumn[]) {
    this.tablesService.onColumnHiddenMenuSelected(columns);
  }

  public onColumnSortChanged(data: {column: TableColumn; type: AttributeSortType | null}) {
    this.tablesService.onColumnSortChanged(data.column, data.type);
  }

  public onStemConfigChange(stemConfig: WorkflowStemConfig, index: number) {
    const stemsConfigs = [...this.config.stemsConfigs];
    stemsConfigs.splice(index, 1, stemConfig);
    const newConfig = {...this.config, stemsConfigs};
    this.configChange.emit(newConfig);
  }

  public onRowDetail(row: TableRow) {
    this.tablesService.onRowDetail(row);
  }

  public onTableResize(table: WorkflowTable, height: number) {
    this.tablesService.onTableResize(table, height);
  }

  public onRowNewClick(table: WorkflowTable) {
    this.tablesService.onNewRow(table);
  }
}
