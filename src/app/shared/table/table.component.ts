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
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {CdkScrollable, ScrollDispatcher} from '@angular/cdk/overlay';
import {filter} from 'rxjs/operators';
import {TableRow} from './model/table-row';
import {HiddenInputComponent} from '../input/hidden-input/hidden-input.component';
import {TableRowComponent} from './content/row/table-row.component';
import {ConstraintData} from '../../core/model/data/constraint';
import {EditedTableCell, SelectedTableCell, TableCell, TableCellType, TableModel} from './model/table-model';

@Component({
  selector: 'lmr-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent implements OnInit, OnDestroy {
  @Input()
  public tableModel: TableModel;

  @Input()
  public selectedCell: SelectedTableCell;

  @Input()
  public editedCell: EditedTableCell;

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public onCellClick = new EventEmitter<TableCell>();

  @Output()
  public onCellDoubleClick = new EventEmitter<TableCell>();

  @Output()
  public columnResize = new EventEmitter<{id: string; width: number}>();

  @Output()
  public columnMove = new EventEmitter<{from: number; to: number}>();

  @ViewChild(CdkVirtualScrollViewport, {static: false})
  public viewPort: CdkVirtualScrollViewport;

  @ViewChildren('tableRow')
  public tableRows: QueryList<TableRowComponent>;

  @ViewChild(HiddenInputComponent)
  public hiddenInputComponent: HiddenInputComponent;

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
    const column = this.tableModel?.columns?.[data.index];
    if (column) {
      this.columnResize.emit({id: column.id, width: data.width});
    }
  }

  public onMoveColumn(data: {fromIndex: number; toIndex: number}) {
    this.columnMove.emit({from: data.fromIndex, to: data.toIndex});
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public trackByRow(index: number, row: TableRow): string {
    return row.id;
  }

  public onNewValue(row: number, data: {column: number; value: any}) {
    // const linkRow = this.rows[row];
    // const column = this.columns[data.column];
    // if (linkRow && column) {
    //   const patchData = {[column.attribute.id]: data.value};
    //   if (column.collectionId && linkRow.documentId) {
    //     const document: DocumentModel = {id: linkRow.documentId, collectionId: column.collectionId, data: patchData};
    //     this.store$.dispatch(new DocumentsAction.PatchData({document}));
    //   } else if (column.linkTypeId && linkRow.linkInstanceId) {
    //     const linkInstance: LinkInstance = {
    //       id: linkRow.linkInstanceId,
    //       linkTypeId: column.linkTypeId,
    //       data: patchData,
    //       documentIds: ['', ''],
    //     };
    //     this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance}));
    //   }
    // }
  }

  public onBodyCellClick(rowId: string, columnId: string) {
    this.onCellClick.emit({tableId: this.tableModel.id, rowId, columnId, type: TableCellType.Body});
  }

  public onBodyCellDoubleClick(rowId: string, columnId: string) {
    this.onCellDoubleClick.emit({tableId: this.tableModel.id, rowId, columnId, type: TableCellType.Body});
  }
}
