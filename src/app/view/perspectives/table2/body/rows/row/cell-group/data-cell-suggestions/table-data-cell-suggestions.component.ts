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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {AppState} from '../../../../../../../../core/store/app.state';
import {DocumentModel} from '../../../../../../../../core/store/documents/document.model';
import {selectDocumentsByCustomQuery} from '../../../../../../../../core/store/documents/documents.state';
import {LinkInstanceModel} from '../../../../../../../../core/store/link-instances/link-instance.model';
import {LinkInstancesAction} from '../../../../../../../../core/store/link-instances/link-instances.action';
import {QueryModel} from '../../../../../../../../core/store/navigation/query.model';
import {TableBodyCursor} from '../../../../../../../../core/store/tables/table-cursor';
import {TableModel, TableSingleColumn} from '../../../../../../../../core/store/tables/table.model';
import {findTableRow, splitRowPath} from '../../../../../../../../core/store/tables/table.utils';
import {TablesAction} from '../../../../../../../../core/store/tables/tables.action';
import {TABLE_ROW_HEIGHT} from '../../../../../shared/pipes/column-height.pipe';

@Component({
  selector: 'table-data-cell-suggestions',
  templateUrl: './table-data-cell-suggestions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.position]': `'relative'`,
    '[style.top.px]': 'tableRowHeight'
  }
})
export class TableDataCellSuggestionsComponent implements OnChanges {

  @Input()
  public column: TableSingleColumn;

  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public table: TableModel;

  @Input()
  public value: string;

  @Output()
  public linkCreate = new EventEmitter();

  public readonly tableRowHeight = TABLE_ROW_HEIGHT;

  public documents$: Observable<DocumentModel[]>;

  public constructor(private store: Store<AppState>) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('value')) {
      this.bindDocuments();
    }
  }

  private bindDocuments() {
    const query: QueryModel = {
      collectionIds: [this.table.parts[this.cursor.partIndex].collectionId],
      fulltext: this.value
    };

    const {parentPath} = splitRowPath(this.cursor.rowPath);
    const linkedDocumentIds = findTableRow(this.table.rows, parentPath).linkedRows
      .reduce<string[]>((ids, row) => ids.concat(...row.documentIds), []);

    this.documents$ = this.store.select(selectDocumentsByCustomQuery(query)).pipe(
      map(documents => documents.filter(document =>
        document.data.hasOwnProperty(this.column.attributeId) &&
        !linkedDocumentIds.includes(document.id)
      ))
    );
  }

  public onCreateLink(document: DocumentModel) {
    this.linkCreate.emit();

    const {parentPath} = splitRowPath(this.cursor.rowPath);
    const part = this.table.parts[this.cursor.partIndex - 1];
    const previousRow = findTableRow(this.table.rows, parentPath);

    const linkInstance: LinkInstanceModel = {
      linkTypeId: part.linkTypeId,
      documentIds: [previousRow.documentIds[0], document.id]
    };
    this.store.dispatch(new LinkInstancesAction.Create({
      linkInstance,
      callback: () => this.expandLinkedRow()
    }));
  }

  private expandLinkedRow() {
    const cursor = {...this.cursor, rowPath: this.cursor.rowPath.slice(0, -1)};
    this.store.dispatch(new TablesAction.ExpandRows({cursor}));
  }

}
