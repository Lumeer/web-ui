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
  ViewChildren,
  QueryList,
  ViewChild,
  HostListener,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnInit,
} from '@angular/core';
import {LinkColumn} from '../../model/link-column';
import {ConstraintData} from '../../../../../core/model/data/constraint';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {LinkRow} from '../../model/link-row';
import {LinksListTableRowComponent} from './row/links-list-table-row.component';
import {DataRowFocusService} from '../../../../data/data-row-focus-service';
import {HiddenInputComponent} from '../../../../input/hidden-input/hidden-input.component';
import {AppState} from '../../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {DocumentsAction} from '../../../../../core/store/documents/documents.action';
import {LinkInstancesAction} from '../../../../../core/store/link-instances/link-instances.action';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {Collection} from '../../../../../core/store/collections/collection';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {generateCorrelationId} from '../../../../utils/resource.utils';
import {debounceTime} from 'rxjs/operators';
import {isNotNullOrUndefined} from '../../../../utils/common.utils';

@Component({
  selector: '[links-list-table-body]',
  templateUrl: './links-list-table-body.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksListTableBodyComponent implements OnInit, OnChanges {
  @Input()
  public columns: LinkColumn[];

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public rows: LinkRow[];

  @Input()
  public linkType: LinkType;

  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public preventEventBubble: boolean;

  @Input()
  public allowSelectDocument: boolean;

  @ViewChildren('tableRow')
  public tableRows: QueryList<LinksListTableRowComponent>;

  @ViewChild(HiddenInputComponent)
  public hiddenInputComponent: HiddenInputComponent;

  @Output()
  public columnFocus = new EventEmitter<number>();

  @Output()
  public unlink = new EventEmitter<LinkRow>();

  @Output()
  public detail = new EventEmitter<LinkRow>();

  @Output()
  public newLink = new EventEmitter<{column: LinkColumn; value: any; correlationId: string}>();

  private dataRowFocusService: DataRowFocusService;

  public newRows$ = new BehaviorSubject<LinkRow[]>([]);

  public attributeEditing$: Observable<{documentId?: string; attributeId?: string}>;

  private attributeEditingSubject = new Subject<{documentId?: string; attributeId?: string}>();

  constructor(private store$: Store<AppState>) {
    this.dataRowFocusService = new DataRowFocusService(
      () => this.columns.length,
      () => this.rows.length + this.newRows$.value.length,
      () => this.tableRows?.toArray(),
      () => this.hiddenInputComponent,
      (row, column) => this.columns[column]?.attribute?.constraint?.isDirectlyEditable
    );
  }

  public ngOnInit() {
    this.attributeEditing$ = this.attributeEditingSubject.asObservable().pipe(debounceTime(100));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.rows && this.rows) {
      const correlationIds = this.rows.map(row => row.correlationId).filter(correlationId => !!correlationId);
      const newRows = this.newRows$.value.filter(
        row => !row.correlationId || !correlationIds.includes(row.correlationId)
      );
      if (newRows.length !== this.newRows$.value.length) {
        this.newRows$.next(newRows);
      }
    }
    this.checkNewRow();
  }

  private checkNewRow() {
    if (this.permissions.writeWithView) {
      if (this.newRows$.value.length === 0) {
        this.newRows$.next([{correlationId: generateCorrelationId()}]);
      }
    }
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    this.dataRowFocusService.onKeyDown(event);
  }

  public onNewHiddenInput(value: string) {
    this.dataRowFocusService.newHiddenInput(value);
  }

  public onEdit(row: number, column: number) {
    this.dataRowFocusService.edit(row, column);
  }

  public onFocus(row: number, column: number) {
    this.dataRowFocusService.focus(row, column);
  }

  public onResetFocusAndEdit(row: number, column: number) {
    this.dataRowFocusService.resetFocusAndEdit(row, column);
  }

  public onNewValue(row: number, data: {column: number; value: any}) {
    const linkRow = this.rows[row];
    const column = this.columns[data.column];
    if (linkRow && column) {
      const patchData = {[column.attribute.id]: data.value};
      if (column.collectionId && linkRow.document) {
        const document = {...linkRow.document, data: patchData};
        this.store$.dispatch(new DocumentsAction.PatchData({document}));
      } else if (column.linkTypeId && linkRow.linkInstance) {
        const linkInstance = {...linkRow.linkInstance, data: patchData};
        this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance}));
      }
    }
  }

  public trackByRow(index: number, row: LinkRow): string {
    if (row.correlationId) {
      return row.correlationId;
    }

    return `${row.document.collectionId || row.document.id}:${
      (row.linkInstance && (row.linkInstance.correlationId || row.linkInstance.id)) || ''
    }`;
  }

  public onColumnEdit(row: LinkRow, columnIndex: number) {
    const column = isNotNullOrUndefined(columnIndex) ? this.columns[columnIndex] : null;
    if (column && column.collectionId && row.document) {
      this.attributeEditingSubject.next({documentId: row.document.id, attributeId: column.attribute.id});
    } else {
      this.attributeEditingSubject.next({});
    }
  }
}
