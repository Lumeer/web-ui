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
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable} from 'rxjs';
import {distinctUntilChanged, map, mergeMap, switchMap, take} from 'rxjs/operators';
import {TableBodyCursor} from '../../../../../../../core/store/tables/table-cursor';
import {TableConfigRow} from '../../../../../../../core/store/tables/table.model';
import {countLinkedRows, getTableElement} from '../../../../../../../core/store/tables/table.utils';
import {TableRowNumberService} from '../../../../table-row-number.service';
import {ResizeObserverEntry, ResizeObserver} from '../../../../../../../shared/resize-observer';
import {ModalService} from '../../../../../../../shared/modal/modal.service';
import {selectDocumentById} from '../../../../../../../core/store/documents/documents.state';
import {selectCollectionById} from '../../../../../../../core/store/collections/collections.state';
import {AppState} from '../../../../../../../core/store/app.state';

declare let ResizeObserver: ResizeObserver;

@Component({
  selector: 'table-row-numbers',
  templateUrl: './table-row-numbers.component.html',
  styleUrls: ['./table-row-numbers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableRowNumbersComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public row: TableConfigRow;

  @ViewChildren('rowNumber')
  public rowNumberElements: QueryList<ElementRef>;

  public firstNumber$: Observable<number>;
  public rowIndexes: number[] = [];

  private cursor$ = new BehaviorSubject<TableBodyCursor>(null);

  private resizeObserver: ResizeObserver;

  constructor(
    private element: ElementRef,
    private store$: Store<AppState>,
    private tableRowsService: TableRowNumberService,
    private modalService: ModalService
  ) {}

  public ngOnInit() {
    if (window['ResizeObserver']) {
      this.resizeObserver = new ResizeObserver(entries =>
        window.requestAnimationFrame(() => {
          this.onElementResize(entries);
        })
      );
    }

    this.firstNumber$ = this.bindFirstNumber();
  }

  private bindFirstNumber(): Observable<number> {
    return this.cursor$.pipe(
      distinctUntilChanged(
        (a: TableBodyCursor, b: TableBodyCursor) => a.rowPath && b.rowPath && a.rowPath[0] === b.rowPath[0]
      ),
      switchMap(cursor => this.tableRowsService.observeRowNumber(cursor.rowPath[0]))
    );
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.cursor && this.cursor) {
      this.cursor$.next(this.cursor);
    }
    if (changes.row && this.row) {
      this.rowIndexes = createRowIndexes(this.row);
    }
  }

  public ngAfterViewInit() {
    if (window['ResizeObserver']) {
      this.resizeObserver.observe(this.element.nativeElement);
    } else {
      this.detectAndSetRowNumberColumnWidth();
    }
  }

  private onElementResize(entries: ResizeObserverEntry[]) {
    const {width} = entries[0].contentRect;
    this.setRowNumberColumnWidth(width);
  }

  private detectAndSetRowNumberColumnWidth() {
    const widths = this.rowNumberElements.map(element => element.nativeElement.clientWidth);
    const width = Math.max(...widths);

    this.setRowNumberColumnWidth(width);
  }

  private setRowNumberColumnWidth(width: number) {
    const tableElement = getTableElement(this.cursor.tableId);
    if (tableElement) {
      const rowNumberColumnWidth = Number(
        (tableElement.style.getPropertyValue('--row-number-column-width') || '0px').slice(0, -2)
      );

      if (width > rowNumberColumnWidth) {
        tableElement.style.setProperty('--row-number-column-width', `${width}px`);
      }
    }
  }

  public ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  public trackByIndex(index: number) {
    return index;
  }

  public onNumberClick() {
    this.store$
      .pipe(
        select(selectDocumentById(this.row?.documentId)),
        mergeMap(document =>
          this.store$.pipe(
            select(selectCollectionById(document?.collectionId)),
            map(collection => ({collection, document}))
          )
        ),
        take(1)
      )
      .subscribe(({collection, document}) => {
        if (collection && document) {
          this.modalService.showDataResourceDetail(document, collection);
        }
      });
  }
}

function createRowIndexes(row: TableConfigRow): number[] {
  return Array.from(Array(countLinkedRows(row)).keys());
}
