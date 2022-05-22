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
import {BehaviorSubject, Subject, Subscription} from 'rxjs';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {CdkScrollable, ScrollDispatcher} from '@angular/cdk/overlay';
import {filter, throttleTime} from 'rxjs/operators';
import {TableRow, TableRowWithData} from './model/table-row';
import {HiddenInputComponent} from '../input/hidden-input/hidden-input.component';
import {TableRowComponent} from './content/row/table-row.component';
import {
  EditedTableCell,
  SelectedTableCell,
  TABLE_BOTTOM_TOOLBAR_HEIGHT,
  TableCell,
  TableCellType,
  TableModel,
} from './model/table-model';
import {TableScrollService} from './service/table-scroll.service';
import {DataInputSaveAction} from '../data-input/data-input-save-action';
import {TableColumn} from './model/table-column';
import {AttributeSortType} from '../../core/store/views/view';
import {DocumentModel} from '../../core/store/documents/document.model';
import {MenuItem} from '../menu/model/menu-item';
import {ConditionType, ConditionValue, ConstraintData, ConstraintType} from '@lumeer/data-filters';
import {sortAndFilterTableRowsByHierarchy} from './model/table-hierarchy';

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

  @Input()
  public scrollId: string;

  @Input()
  public selectedDocumentId: string;

  @Input()
  public syncScrollIds: string[];

  @Input()
  public scrollToSelection: boolean;

  @Input()
  public detailPanel: boolean;

  @Input()
  public viewId: string;

  @Output()
  public columnResize = new EventEmitter<{column: TableColumn; width: number}>();

  @Output()
  public columnMove = new EventEmitter<{from: number; to: number}>();

  @Output()
  public columnRename = new EventEmitter<{column: TableColumn; name: string}>();

  @Output()
  public columnMenuSelected = new EventEmitter<{column: TableColumn; item: MenuItem}>();

  @Output()
  public columnFilterRemove = new EventEmitter<{column: TableColumn; index: number}>();

  @Output()
  public columnFilterChange = new EventEmitter<{
    column: TableColumn;
    index: number;
    condition: ConditionType;
    values: ConditionValue[];
    new?: boolean;
  }>();

  @Output()
  public columnHiddenMenuSelected = new EventEmitter<TableColumn[]>();

  @Output()
  public columnSortChanged = new EventEmitter<{column: TableColumn; type: AttributeSortType | null}>();

  @Output()
  public cellClick = new EventEmitter<TableCell>();

  @Output()
  public cellDoubleClick = new EventEmitter<TableCell>();

  @Output()
  public cellCancel = new EventEmitter<{cell: TableCell; action?: DataInputSaveAction}>();

  @Output()
  public rowNewValue = new EventEmitter<{
    row: TableRow;
    column: TableColumn;
    value: any;
    action: DataInputSaveAction;
    cellType: TableCellType;
  }>();

  @Output()
  public rowDetail = new EventEmitter<TableRow>();

  @Output()
  public rowHierarchyToggle = new EventEmitter<TableRow>();

  @Output()
  public rowLinkedDocumentSelect = new EventEmitter<{row: TableRow; document: DocumentModel}>();

  @Output()
  public rowNewClick = new EventEmitter();

  @Output()
  public rowMenuSelected = new EventEmitter<{
    row: TableRow;
    column: TableColumn;
    item: MenuItem;
    cellType: TableCellType;
  }>();

  @ViewChild(CdkVirtualScrollViewport, {static: false})
  public viewPort: CdkVirtualScrollViewport;

  @ViewChildren('tableRow')
  public tableRows: QueryList<TableRowComponent>;

  @ViewChild(HiddenInputComponent)
  public hiddenInputComponent: HiddenInputComponent;

  @ViewChild('table', {read: ElementRef})
  private table: ElementRef;

  @ViewChild('tableNewRow', {read: ElementRef})
  private tableNewRow: ElementRef;

  public readonly toolbarHeight = TABLE_BOTTOM_TOOLBAR_HEIGHT;

  public scrollDisabled$ = new BehaviorSubject(false);
  public detailColumnId: string;
  public hierarchyColumnId: string;
  public scrollOffsetLeft: number;
  public toolbarMarginBottom = 0;
  public toolbarMarginRight = 0;
  public rows: TableRowWithData[];

  private scrollOffsetTop: number;
  private subscriptions = new Subscription();
  private tableScrollService: TableScrollService;
  private scrollCheckSubject = new Subject();

  constructor(private scrollDispatcher: ScrollDispatcher, private element: ElementRef<HTMLElement>) {
    this.tableScrollService = new TableScrollService(() => this.viewPort);
  }

  public ngOnInit() {
    this.subscriptions.add(this.subscribeHorizontalScrolling());
    this.subscriptions.add(this.subscribeVerticalScrolling());
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (
      (changes.selectedCell || changes.editedCell || changes.scrollToSelection) &&
      (this.selectedCell || this.editedCell) &&
      this.scrollToSelection
    ) {
      this.checkScrollPositionForSelectedCell();
    }
    if (changes.tableModel) {
      this.scrollOffsetLeft = this.viewPort?.measureScrollOffset('left');
      this.viewPort?.checkViewportSize();
      const sortedRows = sortAndFilterTableRowsByHierarchy(this.tableModel?.rows);
      if (this.tableModel.bottomToolbar) {
        this.rows = [...sortedRows, null];
      } else {
        this.rows = sortedRows;
      }
      setTimeout(() => this.setScrollbarMargin());
    }
    if (changes.tableModel || changes.detailPanel) {
      this.detailColumnId =
        this.detailPanel && this.tableModel?.columns?.find(column => this.columnCanShowDetailIndicator(column))?.id;
      this.hierarchyColumnId = this.tableModel?.columns?.find(column =>
        this.columnCanShowHierarchyIndicator(column)
      )?.id;
    }
  }

  private columnCanShowDetailIndicator(column: TableColumn): boolean {
    const allowedTypes = [ConstraintType.User, ConstraintType.Text];
    return (
      !column.hidden &&
      (column.attribute?.constraint?.isTextRepresentation || allowedTypes.includes(column.attribute?.constraint?.type))
    );
  }

  private columnCanShowHierarchyIndicator(column: TableColumn): boolean {
    return !column.hidden;
  }

  private checkScrollPositionForSelectedCell() {
    const {top, left} = this.tableScrollService.computeScrollOffsets(
      this.tableModel,
      this.editedCell || this.selectedCell
    );
    this.viewPort?.scrollTo({top, left, behavior: 'smooth'});
  }

  private subscribeVerticalScrolling(): Subscription {
    return this.scrollCheckSubject.pipe(throttleTime(200)).subscribe(() => {
      const top = this.viewPort?.measureScrollOffset('top');
      if (top !== this.scrollOffsetTop && this.editedCell?.type === TableCellType.Header) {
        this.cellCancel.emit({cell: this.editedCell, action: DataInputSaveAction.Direct});
      }
      this.scrollOffsetTop = top;
    });
  }

  private setScrollbarMargin() {
    const element = this.viewPort.elementRef.nativeElement;
    this.toolbarMarginBottom = element.offsetHeight - element.clientHeight;
    this.toolbarMarginRight = element.offsetWidth - element.clientWidth;
  }

  private subscribeHorizontalScrolling(): Subscription {
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
              this.syncScrollIds?.includes(otherScrollable.getElementRef()?.nativeElement?.id)
          )
          .forEach(otherScrollable => otherScrollable.scrollTo({left}));
      });
  }

  private isScrollableInsideComponent(scrollable: CdkScrollable): boolean {
    return this.element.nativeElement.contains(scrollable.getElementRef().nativeElement);
  }

  public onMoveColumn(data: {fromIndex: number; toIndex: number}) {
    this.columnMove.emit({from: data.fromIndex, to: data.toIndex});
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public trackByRow(index: number, row: TableRow): string {
    return row?.id || String(index);
  }

  public onBodyRowNewValue(row: TableRow, data: {columnId: string; value: any; action: DataInputSaveAction}) {
    const column = this.tableModel?.columns?.find(col => col.id === data.columnId);
    if (row && column) {
      this.rowNewValue.emit({...data, row, column, cellType: TableCellType.Body});
    }
  }

  public onBodyCellClick(row: TableRow, columnId: string) {
    this.cellClick.emit({
      tableId: this.tableModel.id,
      documentId: row.documentId,
      linkId: row.linkInstanceId,
      rowId: row.id,
      columnId,
      type: TableCellType.Body,
    });
  }

  public onBodyCellDoubleClick(row: TableRow, columnId: string) {
    this.cellDoubleClick.emit({
      tableId: this.tableModel.id,
      documentId: row.documentId,
      linkId: row.linkInstanceId,
      rowId: row.id,
      columnId,
      type: TableCellType.Body,
    });
  }

  public onBodyCancel(row: TableRow, data: {action: DataInputSaveAction; columnId: string}) {
    const cell: TableCell = {
      tableId: this.tableModel.id,
      documentId: row.documentId,
      linkId: row.linkInstanceId,
      columnId: data.columnId,
      rowId: row.id,
      type: TableCellType.Body,
    };
    this.cellCancel.emit({cell, action: data.action});
  }

  public onHeaderCellClick(columnId: string) {
    this.cellClick.emit({tableId: this.tableModel.id, columnId, type: TableCellType.Header});
  }

  public onHeaderCellDoubleClick(columnId: string) {
    this.cellDoubleClick.emit({tableId: this.tableModel.id, columnId, type: TableCellType.Header});
  }

  public onHeaderCancel(columnId: string) {
    this.cellCancel.emit({cell: {tableId: this.tableModel.id, columnId, type: TableCellType.Header}});
  }

  public onScroll() {
    this.scrollCheckSubject.next(null);
  }

  public onBodyMenuSelected(data: {row: TableRow; column: TableColumn; item: MenuItem}) {
    this.rowMenuSelected.emit({...data, cellType: TableCellType.Body});
  }

  public onRowLinkedDocumentSelect(row: TableRow, document: DocumentModel) {
    this.rowLinkedDocumentSelect.emit({row, document});
  }

  public containsElement(element: any): boolean {
    if (this.table.nativeElement.contains(element)) {
      return true;
    }
    if (this.tableNewRow?.nativeElement.contains(element)) {
      return true;
    }

    return false;
  }
}
