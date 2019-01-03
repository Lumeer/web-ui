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

import {Injectable} from '@angular/core';

import {AppState} from '../store/app.state';
import {Store} from '@ngrx/store';
import {CollectionModel} from '../store/collections/collection.model';
import {DocumentModel} from '../store/documents/document.model';
import {UiRow} from './ui-row';
import {BehaviorSubject} from 'rxjs';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {DocumentUi} from './document-ui';
import {NotificationService} from '../notifications/notification.service';

@Injectable({
  providedIn: 'root',
})
export class DocumentUiService {
  private state: {[key: string]: DocumentUi} = {};

  constructor(private store: Store<AppState>, private i18n: I18n, private notificationService: NotificationService) {}

  public init(collection: CollectionModel, document: DocumentModel): void {
    this.destroy(collection, document);

    const key = DocumentUiService.getKey(collection, document);
    if (key) {
      this.state[key] = new DocumentUi(collection, document, this.store, this.i18n, this.notificationService);
    }
  }

  public isInited(collection: CollectionModel, document: DocumentModel): boolean {
    const key = DocumentUiService.getKey(collection, document);
    return !!this.state[key];
  }

  public destroy(collection: CollectionModel, document: DocumentModel): void {
    const key = DocumentUiService.getKey(collection, document);
    if (key) {
      const state = this.state[key];
      if (state) {
        state.destroy();
      }

      delete this.state[key];
    }
  }

  public getRows$(collection: CollectionModel, document: DocumentModel): BehaviorSubject<UiRow[]> {
    const key = DocumentUiService.getKey(collection, document);
    return key ? (this.state[key] ? this.state[key].rows$ : null) : null;
  }

  public getSummary$(collection: CollectionModel, document: DocumentModel): BehaviorSubject<string> {
    const key = DocumentUiService.getKey(collection, document);
    return key ? (this.state[key] ? this.state[key].summary$ : null) : null;
  }

  public getFavorite$(collection: CollectionModel, document: DocumentModel): BehaviorSubject<boolean> {
    const key = DocumentUiService.getKey(collection, document);
    return key ? (this.state[key] ? this.state[key].favorite$ : null) : null;
  }

  public getTrackBy(collection: CollectionModel, document: DocumentModel): (index: number, row: UiRow) => string {
    const key = DocumentUiService.getKey(collection, document);
    return key ? (this.state[key] ? this.state[key].trackRows : null) : null;
  }

  public onAddRow(collection: CollectionModel, document: DocumentModel): void {
    const key = DocumentUiService.getKey(collection, document);
    if (key) {
      const state = this.state[key];
      if (state) {
        state.onAddRow();
      }
    }
  }

  public onUpdateRow(
    collection: CollectionModel,
    document: DocumentModel,
    idx: number,
    keyValue: [string, string]
  ): void {
    const key = DocumentUiService.getKey(collection, document);
    if (key) {
      const state = this.state[key];
      if (state) {
        state.onUpdateRow(idx, keyValue);
      }
    }
  }

  public onRemoveRow(collection: CollectionModel, document: DocumentModel, idx: number): void {
    const key = DocumentUiService.getKey(collection, document);
    if (key) {
      const state = this.state[key];
      if (state) {
        state.onRemoveRow(idx);
      }
    }
  }

  public onToggleFavorite(collection: CollectionModel, document: DocumentModel): void {
    const key = DocumentUiService.getKey(collection, document);
    if (key) {
      const state = this.state[key];
      if (state) {
        state.onToggleFavorite();
      }
    }
  }

  private static getKey(collection: CollectionModel, document: DocumentModel): string {
    return collection && document ? collection.id + ':' + (document.correlationId || document.id) : null;
  }
}
