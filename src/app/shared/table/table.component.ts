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
  ViewChildren,
  QueryList,
  HostListener,
} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {TableColumn} from './model/table-column';
import {moveItemInArray} from '@angular/cdk/drag-drop';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {CdkScrollable, ScrollDispatcher} from '@angular/cdk/overlay';
import {filter} from 'rxjs/operators';
import {TableRow} from './model/table-row';
import {DataRowFocusService} from '../data/data-row-focus-service';
import {HiddenInputComponent} from '../input/hidden-input/hidden-input.component';
import {TableRowComponent} from './content/row/table-row.component';
import {ConstraintData} from '../../core/model/data/constraint';
import {DocumentsAction} from '../../core/store/documents/documents.action';
import {LinkInstancesAction} from '../../core/store/link-instances/link-instances.action';
import {DocumentModel} from '../../core/store/documents/document.model';
import {LinkInstance} from '../../core/store/link-instances/link.instance';
import {AppState} from '../../core/store/app.state';
import {Store} from '@ngrx/store';

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

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public columnChange = new EventEmitter<TableColumn[]>();

  @ViewChild(CdkVirtualScrollViewport, {static: false})
  public viewPort: CdkVirtualScrollViewport;

  @ViewChildren('tableRow')
  public tableRows: QueryList<TableRowComponent>;

  @ViewChild(HiddenInputComponent)
  public hiddenInputComponent: HiddenInputComponent;

  public scrollDisabled$ = new BehaviorSubject(false);

  private subscriptions = new Subscription();
  private dataRowFocusService: DataRowFocusService;

  constructor(
    private scrollDispatcher: ScrollDispatcher,
    private element: ElementRef<HTMLElement>,
    private store$: Store<AppState>
  ) {
    this.dataRowFocusService = new DataRowFocusService(
      () => this.columns.length,
      () => this.rows.length,
      () => this.tableRows.toArray(),
      () => this.hiddenInputComponent
    );
  }

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

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    this.dataRowFocusService.onKeyDown(event);
  }

  public onNewHiddenInput(value: string) {
    this.dataRowFocusService.newHiddenInput(value);
  }

  public onEdit(row: number, column: number) {
    const offset = this.viewPort?.getRenderedRange().start || 0;
    this.dataRowFocusService.edit(row - offset, column);
  }

  public onFocus(row: number, column: number) {
    const offset = this.viewPort?.getRenderedRange().start || 0;
    this.dataRowFocusService.focus(row - offset, column);
  }

  public onResetFocusAndEdit(row: number, column: number) {
    const offset = this.viewPort?.getRenderedRange().start || 0;
    this.dataRowFocusService.resetFocusAndEdit(row - offset, column);
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

  public onNewValue(row: number, data: {column: number; value: any}) {
    const linkRow = this.rows[row];
    const column = this.columns[data.column];
    if (linkRow && column) {
      const patchData = {[column.attribute.id]: data.value};
      if (column.collectionId && linkRow.documentId) {
        const document: DocumentModel = {id: linkRow.documentId, collectionId: column.collectionId, data: patchData};
        this.store$.dispatch(new DocumentsAction.PatchData({document}));
      } else if (column.linkTypeId && linkRow.linkInstanceId) {
        const linkInstance: LinkInstance = {
          id: linkRow.linkInstanceId,
          linkTypeId: column.linkTypeId,
          data: patchData,
          documentIds: ['', ''],
        };
        this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance}));
      }
    }
  }

  public onClickOutside() {
    this.dataRowFocusService.checkAndResetFocusAndEdit();
  }
}
