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

import {AppState} from '../store/app.state';
import {Store} from '@ngrx/store';
import {CollectionModel} from '../store/collections/collection.model';
import {DocumentModel} from '../store/documents/document.model';
import {UiRow} from './ui-row';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NotificationService} from '../notifications/notification.service';
import {Injectable} from '@angular/core';
import {DocumentUi} from './document-ui';

@Injectable({
  providedIn: 'root'
})
export class DocumentUiService {

  private state: { [key: string]: DocumentUi } = {};

  constructor(private store: Store<AppState>,
              private i18n: I18n,
              private notificationService: NotificationService) {
  }

  public init(collection: CollectionModel, document: DocumentModel): void {
    this.destroy(collection, document);

    let key = DocumentUiService.getKey(collection, document);
    if (key) {
      this.state[key] = new DocumentUi(collection, document, this.store, this.i18n, this.notificationService);
    }
  }

  public destroy(collection: CollectionModel, document: DocumentModel): void {
    let key = DocumentUiService.getKey(collection, document);
    if (key) {
      let state = this.state[key];
      if (state) {
        state.destroy();
      }

      delete this.state[key];
    }
  }

  public getRows$(collection: CollectionModel, document: DocumentModel): BehaviorSubject<UiRow[]> {
    let key = DocumentUiService.getKey(collection, document);
    return key ? (this.state[key] ? this.state[key].rows$ : null) : null;
  }

  public getSummary$(collection: CollectionModel, document: DocumentModel): BehaviorSubject<string> {
    let key = DocumentUiService.getKey(collection, document);
    return key ? (this.state[key] ? this.state[key].summary$ : null) : null;
  }

  public getFavorite$(collection: CollectionModel, document: DocumentModel): BehaviorSubject<boolean> {
    let key = DocumentUiService.getKey(collection, document);
    return key ? (this.state[key] ? this.state[key].favorite$ : null) : null;
  }

  public getTrackBy(collection: CollectionModel, document: DocumentModel): (index: number, row: UiRow) => string {
    let key = DocumentUiService.getKey(collection, document);
    return key ? (this.state[key] ? this.state[key].trackRows : null) : null;
  }

  public onAddRow(collection: CollectionModel, document: DocumentModel): void {
    let key = DocumentUiService.getKey(collection, document);
    if (key) {
      let state = this.state[key];
      if (state) {
        state.onAddRow();
      }
    }
  }

  public onUpdateRow(collection: CollectionModel, document: DocumentModel, idx: number, keyValue: [string, string]): void {
    let key = DocumentUiService.getKey(collection, document);
    if (key) {
      let state = this.state[key];
      if (state) {
        state.onUpdateRow(idx, keyValue);
      }
    }
  }

  public onRemoveRow(collection: CollectionModel, document: DocumentModel, idx: number): void {
    let key = DocumentUiService.getKey(collection, document);
    if (key) {
      let state = this.state[key];
      if (state) {
        state.onRemoveRow(idx);
      }
    }
  }

  public onToggleFavorite(collection: CollectionModel, document: DocumentModel): void {
    let key = DocumentUiService.getKey(collection, document);
    if (key) {
      let state = this.state[key];
      if (state) {
        state.onToggleFavorite();
      }
    }
  }

  private static getKey(collection: CollectionModel, document: DocumentModel): string {
    return (collection && document) ? collection.id + ':' + (document.correlationId || document.id) : null;
  }
}
