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

import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {combineLatest, Observable} from 'rxjs';
import {debounceTime, delay, filter, map, mergeMap, switchMap, take, tap} from 'rxjs/operators';
import {AppState} from '../../../../../core/store/app.state';
import {selectDocumentsByCustomQuery} from '../../../../../core/store/common/permissions.selectors';
import {DocumentsAction} from '../../../../../core/store/documents/documents.action';
import {Query} from '../../../../../core/store/navigation/query/query';
import {TableBodyCursor} from '../../../../../core/store/tables/table-cursor';
import {TableConfigRow} from '../../../../../core/store/tables/table.model';
import {getTableElement} from '../../../../../core/store/tables/table.utils';
import {TablesAction} from '../../../../../core/store/tables/tables.action';
import {selectTableRows} from '../../../../../core/store/tables/tables.selector';
import {
  selectCurrentQueryDocumentsLoaded,
  selectQueryDocumentsLoaded,
} from '../../../../../core/store/documents/documents.state';
import {LinkInstancesAction} from '../../../../../core/store/link-instances/link-instances.action';
import {
  selectCurrentQueryLinkInstancesLoaded,
  selectQueryLinkInstancesLoaded,
} from '../../../../../core/store/link-instances/link-instances.state';

@Component({
  selector: 'table-rows',
  templateUrl: './table-rows.component.html',
  styleUrls: ['./table-rows.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableRowsComponent implements OnChanges {
  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public query: Query;

  @Input()
  public canManageConfig: boolean;

  @ViewChild(CdkVirtualScrollViewport, {static: false})
  public virtualScrollViewport: CdkVirtualScrollViewport;

  public loaded$: Observable<boolean>;
  public rows$: Observable<TableConfigRow[]>;

  public constructor(public element: ElementRef, private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.query) {
      this.retrieveDocuments(this.query);
    }
    if (changes.cursor || changes.query) {
      this.bindRows(this.cursor, this.query);
    }
  }

  private bindRows(cursor: TableBodyCursor, query: Query) {
    this.rows$ = combineLatest([
      this.store$.pipe(select(selectTableRows(cursor.tableId))),
      this.store$.pipe(
        select(selectDocumentsByCustomQuery(query, false, true)),
        map(documents => new Set(documents.filter(document => document.id).map(document => document.id)))
      ),
    ]).pipe(
      debounceTime(10), // fixes not shown linked records after linked part is added
      map(([rows, existingDocumentIds]) => {
        return rows.filter(row => (row.documentId ? existingDocumentIds.has(row.documentId) : row.correlationId));
      }),
      tap(() => this.store$.dispatch(new TablesAction.SyncPrimaryRows({cursor, query}))),
      tap(() => setTimeout(() => this.setScrollbarWidth()))
    );
    this.loaded$ = this.rows$.pipe(
      switchMap(() =>
        this.store$.pipe(
          delay(1000), // we need to wait while rows are created
          select(selectQueryDocumentsLoaded(query)),
          filter(loaded => loaded),
          mergeMap(() => this.store$.pipe(select(selectQueryLinkInstancesLoaded(query)))),
          filter(loaded => loaded),
          take(1)
        )
      )
    );
  }

  public setScrollbarWidth() {
    const element = this.virtualScrollViewport.elementRef.nativeElement;
    const scrollbarWidth = element.offsetWidth - element.clientWidth;

    const tableElement = getTableElement(this.cursor.tableId);
    if (tableElement) {
      tableElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
    }
  }

  private retrieveDocuments(query: Query) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
    this.store$.dispatch(new LinkInstancesAction.Get({query}));
  }

  @HostListener('click', ['$event'])
  public onClick(event: MouseEvent) {
    if (event.target === this.virtualScrollViewport.elementRef.nativeElement) {
      this.unsetCursor();
    }
  }

  public trackByDocumentId(index: number, row: TableConfigRow): string {
    return row.correlationId || row.documentId;
  }

  public unsetCursor() {
    this.store$.dispatch(new TablesAction.SetCursor({cursor: null}));
  }
}
