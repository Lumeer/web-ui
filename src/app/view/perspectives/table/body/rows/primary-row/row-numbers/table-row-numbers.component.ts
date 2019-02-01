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
import {TableBodyCursor} from '../../../../../../../core/store/tables/table-cursor';
import {TableConfigRow} from '../../../../../../../core/store/tables/table.model';
import {countLinkedRows, getTableElement} from '../../../../../../../core/store/tables/table.utils';

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

  public rowIndexes: number[] = [];

  private resizeObserver: ResizeObserver;

  constructor(private element: ElementRef) {}

  public ngOnInit() {
    if (window['ResizeObserver']) {
      this.resizeObserver = new ResizeObserver(entries => this.onElementResize(entries));
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
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
    const rowNumberColumnWidth = Number(
      (tableElement.style.getPropertyValue('--row-number-column-width') || '0px').slice(0, -2)
    );

    if (width > rowNumberColumnWidth) {
      tableElement.style.setProperty('--row-number-column-width', `${width}px`);
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
}

function createRowIndexes(row: TableConfigRow): number[] {
  return Array.from(Array(countLinkedRows(row)).keys());
}
