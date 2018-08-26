/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {AppState} from '../../../../../../../core/store/app.state';
import {DocumentModel} from '../../../../../../../core/store/documents/document.model';
import {selectDocumentsByIds} from '../../../../../../../core/store/documents/documents.state';
import {LinkInstanceModel} from '../../../../../../../core/store/link-instances/link-instance.model';
import {selectLinkInstancesByIds} from '../../../../../../../core/store/link-instances/link-instances.state';
import {areTableRowCursorsEqual, TableBodyCursor, TableCursor} from '../../../../../../../core/store/tables/table-cursor';
import {TableColumn, TableColumnType, TableCompoundColumn, TableHiddenColumn, TableModel, TableRow} from '../../../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../../../core/store/tables/tables.action';
import {selectTableCursor, selectTablePartLeafColumns} from '../../../../../../../core/store/tables/tables.state';

@Component({
  selector: 'table-cell-group',
  templateUrl: './table-cell-group.component.html',
  styleUrls: ['./table-cell-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableCellGroupComponent implements OnInit {

  @Input()
  public table: TableModel;

  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public row: TableRow;

  public documents$: Observable<DocumentModel[]>;
  public linkInstances$: Observable<LinkInstanceModel[]>;

  public columns$: Observable<TableColumn[]>;
  public selectedCursor$: Observable<TableCursor>;

  private rowSelected: boolean;

  public constructor(private store$: Store<AppState>) {
  }

  public ngOnInit() {
    this.bindColumns();
    this.bindSelectedCursor();
    this.bindData();
  }

  private bindColumns() {
    this.columns$ = this.store$.select(selectTablePartLeafColumns(this.cursor.tableId, this.cursor.partIndex));
  }

  private bindSelectedCursor() {
    this.selectedCursor$ = this.store$.select(selectTableCursor).pipe(
      filter(selectedCursor => {
        const rowBeingSelected = areTableRowCursorsEqual(this.cursor, selectedCursor);
        if (!this.rowSelected && !rowBeingSelected) {
          return false;
        }

        this.rowSelected = rowBeingSelected;
        return true;
      })
    );
  }

  private bindData() {
    const part = this.table.parts[this.cursor.partIndex];

    if (part.collectionId) {
      this.bindDocuments(part.collectionId);
    }
    if (part.linkTypeId) {
      this.bindLinkInstances(part.linkTypeId);
    }
  }

  private bindDocuments(collectionId: string) {
    this.documents$ = this.store$.select(selectDocumentsByIds(this.row.documentIds)).pipe(
      map(documents => documents && documents.length ? documents : [{collectionId, data: {}}])
    );
  }

  private bindLinkInstances(linkTypeId: string) {
    // TODO what if it does not exist?
    this.linkInstances$ = this.store$.select(selectLinkInstancesByIds(this.row.linkInstanceIds));
  }

  public trackByAttributeIds(index: number, column: TableColumn): string {
    if (column.type === TableColumnType.COMPOUND) {
      const {parent} = column as TableCompoundColumn;
      return parent.attributeId || parent.attributeName;
    }
    if (column.type === TableColumnType.HIDDEN) {
      return (column as TableHiddenColumn).attributeIds.join('-');
    }
  }

  public onMouseDown(event: MouseEvent, columnIndex: number) {
    const cursor: TableBodyCursor = {...this.cursor, columnIndex};
    this.store$.dispatch(new TablesAction.SetCursor({cursor}));
    event.stopPropagation();
  }

}
