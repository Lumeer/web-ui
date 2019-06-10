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
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {combineLatest, Observable, Subscription} from 'rxjs';
import {debounceTime, filter, map, tap} from 'rxjs/operators';
import {AppState} from '../../../../../core/store/app.state';
import {selectDocumentsByCustomQuery} from '../../../../../core/store/common/permissions.selectors';
import {DocumentsAction} from '../../../../../core/store/documents/documents.action';
import {Query} from '../../../../../core/store/navigation/query';
import {TableBodyCursor, TableCursor} from '../../../../../core/store/tables/table-cursor';
import {TableConfigRow} from '../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../core/store/tables/tables.action';
import {selectTableCursor, selectTableRows} from '../../../../../core/store/tables/tables.selector';

@Component({
  selector: 'table-rows',
  templateUrl: './table-rows.component.html',
  styleUrls: ['./table-rows.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableRowsComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public query: Query;

  @Input()
  public canManageConfig: boolean;

  @Output()
  public horizontalScroll = new EventEmitter<number>();

  @ViewChild(CdkVirtualScrollViewport)
  public virtualScrollViewport: CdkVirtualScrollViewport;

  private scrollLeft = 0;

  public rows$: Observable<TableConfigRow[]>;

  private subscriptions = new Subscription();

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
    this.rows$ = combineLatest(
      this.store$.pipe(select(selectTableRows(cursor.tableId))),
      this.store$.pipe(
        select(selectDocumentsByCustomQuery(query, false, true)),
        map(documents => new Set(documents.filter(document => document.id).map(document => document.id)))
      )
    ).pipe(
      debounceTime(10), // fixes not shown linked records after linked part is added
      map(([rows, existingDocumentIds]) => {
        return rows.filter(row => (row.documentId ? existingDocumentIds.has(row.documentId) : row.correlationId));
      }),
      tap(() => this.store$.dispatch(new TablesAction.SyncPrimaryRows({cursor, query})))
    );
  }

  private retrieveDocuments(query: Query) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
  }

  public ngAfterViewInit() {
    this.subscriptions.add(this.subscribeToSelectedCursor());
  }

  private subscribeToSelectedCursor(): Subscription {
    return this.store$
      .pipe(
        select(selectTableCursor),
        filter(cursor => cursor && cursor.tableId === this.cursor.tableId)
      )
      .subscribe(cursor => this.scrollLeftIfFirstCellSelected(cursor));
  }

  private scrollLeftIfFirstCellSelected(cursor: TableCursor) {
    const element = this.virtualScrollElement;
    if (cursor.partIndex === 0 && cursor.columnIndex === 0 && element && element.scrollLeft !== 0) {
      element.scrollLeft = 0;
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  @HostListener('click', ['$event'])
  public onClick(event: MouseEvent) {
    if (event.target === this.element.nativeElement) {
      this.unsetCursor();
    }
  }

  public trackByDocumentId(index: number, row: TableConfigRow): string {
    return row.correlationId || row.documentId;
  }

  public unsetCursor() {
    this.store$.dispatch(new TablesAction.SetCursor({cursor: null}));
  }

  public onScroll(event: UIEvent) {
    const scrollLeft: number = event.target['scrollLeft'];
    if (scrollLeft !== this.scrollLeft) {
      this.scrollLeft = scrollLeft;
      this.horizontalScroll.emit(scrollLeft);
    }
  }

  public scroll(scrollLeft: number) {
    if (this.virtualScrollElement) {
      this.virtualScrollElement.scrollLeft = scrollLeft;
    }
  }

  public get virtualScrollElement(): HTMLElement {
    return (
      this.virtualScrollViewport &&
      this.virtualScrollViewport.elementRef &&
      this.virtualScrollViewport.elementRef.nativeElement
    );
  }
}
