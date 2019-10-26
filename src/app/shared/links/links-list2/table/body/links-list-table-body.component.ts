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

@Component({
  selector: '[links-list-table-body]',
  templateUrl: './links-list-table-body.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksListTableBodyComponent {
  @Input()
  public columns: LinkColumn[];

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public rows: LinkRow[];

  @ViewChildren('tableRow')
  public tableRows: QueryList<LinksListTableRowComponent>;

  @ViewChild(HiddenInputComponent, {static: false})
  public hiddenInputComponent: HiddenInputComponent;

  private dataRowFocusService: DataRowFocusService;

  constructor(private store$: Store<AppState>) {
    this.dataRowFocusService = new DataRowFocusService(
      () => this.columns.length,
      () => this.rows.length,
      () => this.tableRows.toArray(),
      () => this.hiddenInputComponent
    );
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
    return `${row.document.collectionId || row.document.id}:${(row.linkInstance &&
      (row.linkInstance.correlationId || row.linkInstance.id)) ||
      ''}`;
  }
}
