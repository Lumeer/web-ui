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
import {debounceTime, delay, filter, map, switchMap, take, tap} from 'rxjs/operators';
import {AppState} from '../../../../../core/store/app.state';
import {selectDocumentsByViewAndCustomQuery} from '../../../../../core/store/common/permissions.selectors';
import {Query} from '../../../../../core/store/navigation/query/query';
import {TableBodyCursor} from '../../../../../core/store/tables/table-cursor';
import {TableConfigRow} from '../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../core/store/tables/tables.action';
import {selectTableRows} from '../../../../../core/store/tables/tables.selector';
import {TABLE_ROW_MIN_HEIGHT} from '../../../../../core/constants';
import {selectQueryDataResourcesLoaded} from '../../../../../core/store/data-resources/data-resources.state';
import {TablePerspectiveConfiguration} from '../../../perspective-configuration';
import {View} from '../../../../../core/store/views/view';
import {getTableElementFromInnerElement} from '../../../../../core/store/tables/table.utils';

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
  public view: View;

  @Input()
  public tableId: string;

  @Input()
  public correlationId: string;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public perspectiveConfiguration: TablePerspectiveConfiguration;

  @ViewChild(CdkVirtualScrollViewport)
  public virtualScrollViewport: CdkVirtualScrollViewport;

  public loaded$: Observable<boolean>;
  public rows$: Observable<TableConfigRow[]>;

  public readonly tableRowHeight = TABLE_ROW_MIN_HEIGHT;

  public constructor(public element: ElementRef, private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.cursor || changes.query || changes.view) {
      this.bindRows(this.cursor, this.query, this.view);
    }
  }

  private bindRows(cursor: TableBodyCursor, query: Query, view: View) {
    this.rows$ = combineLatest([
      this.store$.pipe(select(selectTableRows(cursor.tableId))),
      this.store$.pipe(
        select(selectDocumentsByViewAndCustomQuery(view, query, false)),
        map(documents => new Set(documents.filter(document => document.id).map(document => document.id)))
      ),
    ]).pipe(
      debounceTime(10), // fixes not shown linked records after linked part is added
      map(([rows, existingDocumentIds]) => {
        return rows.filter(row => (row.documentId ? existingDocumentIds.has(row.documentId) : row.correlationId));
      }),
      tap(() => this.store$.dispatch(new TablesAction.SyncPrimaryRows({cursor, query, view}))),
      tap(() => setTimeout(() => this.setScrollbarWidth()))
    );
    this.loaded$ = this.rows$.pipe(
      switchMap(() =>
        this.store$.pipe(
          delay(1000), // we need to wait while rows are created
          select(selectQueryDataResourcesLoaded(query)),
          filter(loaded => loaded),
          take(1)
        )
      )
    );
  }

  public setScrollbarWidth() {
    const element = this.virtualScrollViewport.elementRef.nativeElement;
    const scrollbarWidth = element.offsetWidth - element.clientWidth;

    const tableElement = getTableElementFromInnerElement(this.element.nativeElement, this.cursor.tableId);
    if (tableElement) {
      tableElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
    }
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
