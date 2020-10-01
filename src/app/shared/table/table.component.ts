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
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
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
import {TableScrollService} from './service/table-scroll.service';
import {DocumentModel} from '../../core/store/documents/document.model';
import {DocumentsAction} from '../../core/store/documents/documents.action';
import {LinkInstance} from '../../core/store/link-instances/link.instance';
import {LinkInstancesAction} from '../../core/store/link-instances/link-instances.action';
import {AppState} from '../../core/store/app.state';
import {Store} from '@ngrx/store';
import {DataInputSaveAction} from '../data-input/data-input-save-action';

@Component({
  selector: 'lmr-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent implements OnInit, OnChanges, OnDestroy {
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
  public onCancel = new EventEmitter<{cell: TableCell; action: DataInputSaveAction}>();

  @Output()
  public onSave = new EventEmitter<{cell: TableCell; action: DataInputSaveAction}>();

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
  private tableScrollService: TableScrollService;

  constructor(
    private scrollDispatcher: ScrollDispatcher,
    private element: ElementRef<HTMLElement>,
    private store$: Store<AppState>
  ) {
    this.tableScrollService = new TableScrollService(() => this.viewPort);
  }

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToScrolling());
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedCell && this.selectedCell) {
      this.checkScrollPositionForSelectedCell();
    }
  }

  private checkScrollPositionForSelectedCell() {
    const {top, left} = this.tableScrollService.computeScrollOffsets(this.tableModel, this.selectedCell);
    this.viewPort.scrollTo({top, left, behavior: 'smooth'});
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

  public onNewValue(rowId: string, data: {columnId: string; value: any; action: DataInputSaveAction}) {
    const tableRow = this.tableModel?.rows?.find(row => row.id === rowId);
    const tableColumn = this.tableModel?.columns?.find(column => column.id === data.columnId);
    if (tableRow && tableColumn) {
      const patchData = {[tableColumn.attribute.id]: data.value};
      if (tableColumn.collectionId && tableRow.documentId) {
        const document: DocumentModel = {
          id: tableRow.documentId,
          collectionId: tableColumn.collectionId,
          data: patchData,
        };
        this.store$.dispatch(new DocumentsAction.PatchData({document}));
      } else if (tableColumn.linkTypeId && tableRow.linkInstanceId) {
        const linkInstance: LinkInstance = {
          id: tableRow.linkInstanceId,
          linkTypeId: tableColumn.linkTypeId,
          data: patchData,
          documentIds: ['', ''],
        };
        this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance}));
      }
    }

    const cell = {rowId, columnId: data.columnId, type: TableCellType.Body, tableId: this.tableModel.id};
    this.onSave.emit({cell, action: data.action});
  }

  public onBodyCellClick(rowId: string, columnId: string) {
    this.onCellClick.emit({tableId: this.tableModel.id, rowId, columnId, type: TableCellType.Body});
  }

  public onBodyCellDoubleClick(rowId: string, columnId: string) {
    this.onCellDoubleClick.emit({tableId: this.tableModel.id, rowId, columnId, type: TableCellType.Body});
  }

  public onHeaderCellClick(columnId: string) {
    this.onCellClick.emit({tableId: this.tableModel.id, rowId: null, columnId, type: TableCellType.Header});
  }

  public onHeaderCellDoubleClick(columnId: string) {
    this.onCellDoubleClick.emit({tableId: this.tableModel.id, rowId: null, columnId, type: TableCellType.Header});
  }

  public onBodyCancel(rowId: string, data: {action: DataInputSaveAction; columnId: string}) {
    const cell = {tableId: this.tableModel.id, rowId, columnId: data.columnId, type: TableCellType.Body};
    this.onCancel.emit({cell, action: data.action});
  }
}
