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
  OnInit,
  ViewChild,
  OnDestroy,
  EventEmitter,
  Output,
  ElementRef,
} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {TableColumn} from './model/table-column';
import {moveItemInArray} from '@angular/cdk/drag-drop';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {CdkScrollable, ScrollDispatcher} from '@angular/cdk/overlay';
import {filter} from 'rxjs/operators';
import {TableRow} from './model/table-row';

@Component({
  selector: 'lmr-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent implements OnInit, OnDestroy {
  @Input()
  public columns: TableColumn[];

  @Input()
  public rows: TableRow[];

  @Output()
  public columnChange = new EventEmitter<TableColumn[]>();

  @ViewChild(CdkVirtualScrollViewport, {static: true})
  public viewPort: CdkVirtualScrollViewport;

  public scrollDisabled$ = new BehaviorSubject(false);

  private subscriptions = new Subscription();

  constructor(private scrollDispatcher: ScrollDispatcher, private element: ElementRef<HTMLElement>) {}

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToScrolling());
  }

  private subscribeToScrolling(): Subscription {
    return this.scrollDispatcher
      .scrolled()
      .pipe(filter(scrollable => !!scrollable && this.isScrollableInsideComponent(scrollable)))
      .subscribe((scrollable: CdkScrollable) => {
        const left = scrollable.measureScrollOffset('left');

        Array.from(this.scrollDispatcher.scrollContainers.keys())
          .filter(
            otherScrollable =>
              otherScrollable !== scrollable &&
              otherScrollable.measureScrollOffset('left') !== left &&
              this.isScrollableInsideComponent(otherScrollable)
          )
          .forEach(otherScrollable => otherScrollable.scrollTo({left}));
      });
  }

  private isScrollableInsideComponent(scrollable: CdkScrollable): boolean {
    return this.element.nativeElement.contains(scrollable.getElementRef().nativeElement);
  }

  public onResizeColumn(data: {index: number; width: number}) {
    const columns = [...this.columns];
    columns[data.index] = {...columns[data.index], width: data.width};
    this.columnChange.emit(columns);
  }

  public onMoveColumn(data: {fromIndex: number; toIndex: number}) {
    const columns = [...this.columns];
    moveItemInArray(columns, data.fromIndex, data.toIndex);
    this.columnChange.emit(columns);
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public trackByRow(index: number, row: TableRow): string {
    return row.documentId;
  }
}
