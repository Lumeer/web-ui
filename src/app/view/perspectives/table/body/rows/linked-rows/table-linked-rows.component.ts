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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {LinkInstance} from '../../../../../../core/store/link-instances/link.instance';
import {selectLinkInstancesByDocumentIds} from '../../../../../../core/store/link-instances/link-instances.state';
import {TableBodyCursor} from '../../../../../../core/store/tables/table-cursor';
import {TableConfigRow} from '../../../../../../core/store/tables/table.model';
import {createEmptyTableRow} from '../../../../../../core/store/tables/table.utils';
import {TablesAction} from '../../../../../../core/store/tables/tables.action';

@Component({
  selector: 'table-linked-rows',
  templateUrl: './table-linked-rows.component.html',
  styleUrls: ['./table-linked-rows.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableLinkedRowsComponent implements OnChanges {
  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public rows: TableConfigRow[];

  @Input()
  public canManageConfig: boolean;

  @Input()
  public striped: boolean;

  public linkedRows$: Observable<TableConfigRow[]>;
  public emptyLinkedRow = createEmptyTableRow();

  constructor(private store$: Store<{}>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.rows && this.rows) {
      this.linkedRows$ = this.bindLinkedRows(this.rows, this.cursor);
    }
  }

  private bindLinkedRows(rows: TableConfigRow[], cursor: TableBodyCursor): Observable<TableConfigRow[]> {
    const documentIds = rows.map(row => row.documentId);
    const linkedRows = rows.reduce((allLinkedRows, row) => allLinkedRows.concat(row.linkedRows), []);
    return this.store$.pipe(
      select(selectLinkInstancesByDocumentIds(documentIds)),
      map(linkInstances => filterRowsByExistingLinkInstance(linkedRows, linkInstances)),
      tap(() =>
        this.store$.dispatch(
          new TablesAction.SyncLinkedRows({
            cursor: {...cursor, partIndex: cursor.partIndex + 1},
          })
        )
      )
    );
  }

  public onToggle() {
    this.store$.dispatch(new TablesAction.ToggleLinkedRows({cursor: this.cursor}));
  }

  public trackByLinkInstanceId(index: number, linkedRow: TableConfigRow): string | object {
    return linkedRow.correlationId || linkedRow.linkInstanceId;
  }
}

function filterRowsByExistingLinkInstance(rows: TableConfigRow[], linkInstances: LinkInstance[]): TableConfigRow[] {
  return rows
    ? rows.reduce((existingRows, linkedRow) => {
        const exists =
          !linkedRow.linkInstanceId || linkInstances.some(linkInstance => linkInstance.id === linkedRow.linkInstanceId);
        return exists ? existingRows.concat(linkedRow) : existingRows;
      }, [])
    : [];
}
