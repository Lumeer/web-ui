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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, OnInit} from '@angular/core';
import {Query} from '../../../../core/store/navigation/query/query';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {ViewSettings} from '../../../../core/store/views/view';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {Observable} from 'rxjs';
import {WorkflowTablesService} from './workflow-tables-service';
import {EditedTableCell, SelectedTableCell, TableCell, TableModel} from '../../../../shared/table/model/table-model';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectConstraintData} from '../../../../core/store/constraint-data/constraint-data.state';

@Component({
  selector: 'workflow-perspective-content',
  templateUrl: './workflow-perspective-content.component.html',
  styleUrls: ['./workflow-perspective-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowPerspectiveContentComponent implements OnInit, OnChanges {
  @Input()
  public viewSettings: ViewSettings;

  @Input()
  public query: Query;

  @Input()
  public permissions: Record<string, AllowedPermissions>;

  @Input()
  public collections: Collection[];

  @Input()
  public documents: DocumentModel[];

  private tablesService: WorkflowTablesService;

  public tables$: Observable<TableModel[]>;
  public constraintData$: Observable<ConstraintData>;
  public selectedCell$: Observable<SelectedTableCell>;
  public editedCell$: Observable<EditedTableCell>;

  constructor(private store$: Store<AppState>) {
    this.tablesService = new WorkflowTablesService();
    this.tables$ = this.tablesService.tables$.asObservable();
    this.selectedCell$ = this.tablesService.selectedCell$.asObservable();
    this.editedCell$ = this.tablesService.editedCell$.asObservable();
  }

  public ngOnInit() {
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collections || changes.query || changes.permissions || changes.viewSettings || changes.documents) {
      this.tablesService.onUpdateData(
        this.collections,
        this.documents,
        this.permissions,
        this.query,
        this.viewSettings
      );
    }
  }

  public trackByTable(index: number, table: TableModel): string {
    return table.id;
  }

  public onColumnMove(table: TableModel, data: {from: number; to: number}) {
    // TODO send to attributes settings
    this.tablesService.onColumnMove(table, data.from, data.to);
  }

  public onColumnResize(table: TableModel, data: {id: string; width: number}) {
    this.tablesService.onColumnResize(table, data.id, data.width);
  }

  public onTableCellClick(cell: TableCell) {
    this.tablesService.onCellClick(cell);
  }

  public onTableCellDoubleClick(cell: TableCell) {
    this.tablesService.onCellDoubleClick(cell);
  }
}
