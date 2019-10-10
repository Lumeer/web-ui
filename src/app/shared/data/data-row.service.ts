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

import {Injectable} from '@angular/core';
import {Attribute, Collection} from '../../core/store/collections/collection';
import {BehaviorSubject, combineLatest, Subscription} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NotificationService} from '../../core/notifications/notification.service';
import {DocumentModel} from '../../core/store/documents/document.model';
import {selectDocumentById} from '../../core/store/documents/documents.state';
import {selectCollectionById} from '../../core/store/collections/collections.state';
import {debounce, debounceTime, skip} from 'rxjs/operators';
import {generateCorrelationId} from '../utils/resource.utils';
import {DocumentsAction} from '../../core/store/documents/documents.action';
import {getDefaultAttributeId} from '../../core/store/collections/collection.util';
import {isNotNullOrUndefined} from '../utils/common.utils';

export interface DataRow {
  id: string;
  attribute?: Attribute;
  key?: string;
  value: any;
  isDefault?: boolean;
  creating?: boolean;
}

@Injectable()
export class DataRowService {

  public rows$ = new BehaviorSubject<DataRow[]>([]);

  private collection: Collection;
  private document: DocumentModel;

  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>,
              private i18n: I18n,
              private notificationService: NotificationService
  ) {
  }

  public init(collection: Collection, document: DocumentModel) {
    this.collection = collection;
    this.document = document;
    this.refreshSubscription();
  }

  private refreshSubscription() {
    this.destroy();
    this.subscriptions = new Subscription();
    this.subscriptions.add(
      combineLatest([
        this.store$.pipe(select(selectDocumentById(this.document.id))),
        this.store$.pipe(select(selectCollectionById(this.collection.id)))
      ]).pipe(
        debounceTime(100)
      ).subscribe(([document, collection]) => {
        this.document = document;
        this.collection = collection;
        this.refreshRows();
      })
    );

  }

  public createDataRows(): DataRow[] {
    const defaultAttributeId = getDefaultAttributeId(this.collection);
    const attributes = (this.collection && this.collection.attributes || []);
    const data = this.document && this.document.data || {};
    const dataKeys = Object.keys(data);
    const rows = [];

    for (const attribute of attributes) {
      if (dataKeys.includes(attribute.id)) {
        const row: DataRow = {
          id: attribute.id,
          attribute,
          isDefault: attribute.id === defaultAttributeId,
          value: data[attribute.id]
        };
        rows.push(row);
      }
    }
    return rows;
  }

  private refreshRows() {
    const rows = this.createDataRows();
    const rowNames = rows.map(row => row.key);

    for (let i = 0; i < this.rows$.getValue().length; i++) {
      const row = this.rows$.getValue()[i];
      if (!rowNames.includes(row.key)) {
        if (i < rows.length) {
          rows.splice(i, 0, row);
        } else {
          rows.push(row);
        }
      }
    }

    this.rows$.next(rows);
  }

  public addRow() {
    const newRow: DataRow = {id: generateCorrelationId(), key: '', value: ''};
    this.rows$.next([...this.rows$.getValue(), newRow]);
  }

  public deleteRow(index: number) {
    const row = this.rows$.getValue()[index];
    if (row && row.attribute) {
      const data = {...this.document.data};
      delete data[row.attribute.id];
      const action = new DocumentsAction.UpdateData({document: {...this.document, data}});

      const message = this.i18n({
        id: 'document.detail.attribute.remove.confirm',
        value: 'Are you sure you want to delete this row?',
      });
      const title = this.i18n({id: 'resource.delete.dialog.title', value: 'Delete?'});
      const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
      const noButtonText = this.i18n({id: 'button.no', value: 'No'});

      this.notificationService.confirm(message, title, [
        {text: noButtonText},
        {text: yesButtonText, action: () => this.store$.dispatch(action), bold: false},
      ]);


    }
  }

  public updateRow(index: number, key?: string, value?: any) {
    const row = this.rows$.getValue()[index];
    if (row) {
      if ((key || '').trim().length > 0) {
        this.updateAttribute(row, key.trim());
      } else if (isNotNullOrUndefined(value)) {
        this.updateValue(row, value);
      }
    }
  }

  private updateAttribute(row: DataRow, name: string) {

  }

  private updateValue(row: DataRow, value: any) {

  }

  public destroy() {
    this.subscriptions.unsubscribe();
  }


}
