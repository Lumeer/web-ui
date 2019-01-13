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

import {BehaviorSubject, Subject, Subscription} from 'rxjs';
import {UiRow} from './ui-row';
import {Attribute, Collection} from '../store/collections/collection';
import {DocumentModel} from '../store/documents/document.model';
import {Store} from '@ngrx/store';
import {AppState} from '../store/app.state';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NotificationService} from '../notifications/notification.service';
import {selectDocumentById} from '../store/documents/documents.state';
import {selectCollectionById} from '../store/collections/collections.state';
import {debounceTime, filter} from 'rxjs/operators';
import {CorrelationIdGenerator} from '../store/correlation-id.generator';
import {isNullOrUndefined, isUndefined} from 'util';
import {DocumentsAction} from '../store/documents/documents.action';
import {CollectionsAction} from '../store/collections/collections.action';

export class DocumentUi {
  public rows$ = new BehaviorSubject<UiRow[]>([]);
  public summary$ = new BehaviorSubject<string>('');
  public favorite$ = new BehaviorSubject<boolean>(false);

  private rows: UiRow[] = [];
  private addedRows: UiRow[] = [];

  private summary: string = '';
  private favorite: boolean = null;
  private favoriteChange$ = new Subject<boolean>();

  private subscriptions = new Subscription();

  constructor(
    private collection: Collection,
    private document: DocumentModel,
    private store: Store<AppState>,
    private i18n: I18n,
    private notificationService: NotificationService
  ) {
    if (this.collection && this.document) {
      this.subscribe();
    }
  }

  public destroy(): void {
    this.subscriptions.unsubscribe();
    this.saveChanges();
    this.rows = [];
    this.addedRows = [];
    this.rowsChanged();
  }

  public trackRows(index: number, row: UiRow): string {
    return row.correlationId || row.id;
  }

  private subscribe(): void {
    this.subscriptions.add(
      this.store.select(selectDocumentById(this.document.id)).subscribe(doc => {
        this.document = doc;
        this.refreshRows();
      })
    );
    this.subscriptions.add(
      this.store.select(selectCollectionById(this.collection.id)).subscribe(col => {
        this.collection = col;
        this.refreshRows();
      })
    );
    this.subscriptions.add(
      this.favoriteChange$
        .pipe(
          debounceTime(2000),
          filter(favorite => favorite !== this.favorite)
        )
        .subscribe(favorite => {
          this.favorite = null;
          this.saveFavoriteChange(favorite, false);
        })
    );
  }

  private prepareUpdatedDocument(): DocumentModel {
    const updatedDocument = {...this.document};

    let dirty = this.patchNewAttributes(updatedDocument);
    dirty = dirty || this.patchExistingAttributes(updatedDocument);
    dirty = dirty || this.patchAttributeRename(updatedDocument);
    dirty = dirty || this.patchReusedAttributes(updatedDocument);
    dirty = dirty || this.patchDeletedAttributes(updatedDocument);

    return dirty ? updatedDocument : null;
  }

  // we have brand new attributes with both attr name and value
  private patchNewAttributes(document: DocumentModel): boolean {
    let dirty = false;

    const newData: {[attributeName: string]: any} = this.addedRows
      .filter(row => row.name && !this.alreadyInCollection(row.name))
      .reduce((acc: {[attributeName: string]: any}, row) => {
        dirty = true;
        acc[row.name] = {value: row.value, correlationId: row.correlationId};
        return acc;
      }, {});

    document.newData = newData;

    return dirty;
  }

  // value has changed and attr name remained the same
  private patchExistingAttributes(document: DocumentModel): boolean {
    let dirty = false;
    this.rows
      .filter(row => !isUndefined(row.newValue) && row.name === this.getCollectionAttributeById(row.id).name)
      .forEach(row => {
        dirty = true;
        document.data[row.id] = row.newValue;
      });

    return dirty;
  }

  private patchAttributeRename(document: DocumentModel): boolean {
    let dirty = false;

    this.rows
      .filter(row => row.newName)
      .forEach(row => {
        dirty = true;
        const attr = this.getCollectionAttributeByName(row.newName);

        if (attr) {
          // renamed to existing attribute
          if (!document.data[attr.id]) {
            // but the name was not used in the document
            delete document.data[row.id];
            document.data[attr.id] = row.newValue || row.value;
            row.id = attr.id;
            row.correlationId = undefined;
          } else if (document.data[attr.id] && this.getRemovableRowByName(row.newName) && !row.remove) {
            // or was marked for deletion
            const originalRow = this.getRemovableRowByName(row.newName);
            originalRow.id = row.id;
            document.data[attr.id] = row.newValue || row.value;
            row.id = attr.id;
            row.correlationId = undefined;
          }
        } else {
          // renamed to a completely new name
          delete document.data[row.id];
          row.id = null;
          row.correlationId = CorrelationIdGenerator.generate();
          document.newData[row.newName] = {value: row.newValue || row.value, correlationId: row.correlationId};
          delete document.data[row.name];
        }
      });

    return dirty;
  }

  // patch those that are defined in collection but were unused
  private patchReusedAttributes(document: DocumentModel): boolean {
    let dirty = false;
    this.addedRows
      .filter(row => row.name && this.alreadyInCollection(row.name))
      .forEach(row => {
        dirty = true;
        const attr = this.getCollectionAttributeByName(row.name);

        row.id = attr.id;
        row.correlationId = undefined;
        document.data[attr.id] = row.value;
      });

    return dirty;
  }

  private patchDeletedAttributes(document: DocumentModel): boolean {
    let dirty = false;

    this.collection.attributes.forEach(attr => {
      const row = this.getRowById(attr.id);
      if (!isUndefined(document.data[attr.id]) && row && row.remove) {
        dirty = true;
        delete document.data[attr.id];
      }
    });

    return dirty;
  }

  private alreadyInCollection(attrName: string): boolean {
    return this.collection.attributes.findIndex(attr => attr.name === attrName) >= 0;
  }

  private getCollectionAttributeById(id: string): Attribute {
    return this.collection.attributes.find(attr => attr.id === id);
  }

  private getCollectionAttributeByName(name: string): Attribute {
    return this.collection.attributes.find(attr => attr.name === name);
  }

  private getAddedRowIndexByCorrelationId(correlationId: string): number {
    return this.addedRows.findIndex(row => row.correlationId === correlationId);
  }

  private getAddedRowIndexByName(name: string): number {
    return this.addedRows.findIndex(row => row.name === name);
  }

  private getRemovableRowByName(name: string): UiRow {
    if (name) {
      return this.rows.filter(row => row.remove).find(row => row.name === name);
    }

    return null;
  }

  private getRowById(id: string): UiRow {
    if (id) {
      return this.rows.find(row => row.id === id);
    }

    return null;
  }

  private saveChanges(): void {
    if (this.document) {
      const updatedDocument = this.prepareUpdatedDocument();

      if (updatedDocument) {
        const documentUpdateAction = new DocumentsAction.UpdateData({document: updatedDocument});

        if (updatedDocument.newData && Object.getOwnPropertyNames(updatedDocument.newData).length > 0) {
          const newAttributes = Object.keys(updatedDocument.newData).map(name => ({
            name,
            correlationId: updatedDocument.newData[name].correlationId,
          }));

          this.store.dispatch(
            new CollectionsAction.CreateAttributes({
              collectionId: this.document.collectionId,
              attributes: newAttributes,
              nextAction: documentUpdateAction,
            })
          );
        } else {
          this.store.dispatch(documentUpdateAction);
        }
      }
    }
  }

  private refreshRows(): void {
    if (this.collection && this.document) {
      this.summary = this.getDocumentSummary();
      this.summary$.next(this.summary);

      this.favorite$.next(this.document.favorite);

      this.rows = [];

      this.collection.attributes.forEach(attr => {
        if (attr.correlationId) {
          const idx = this.getAddedRowIndexByCorrelationId(attr.correlationId);
          if (idx >= 0) {
            this.addedRows.splice(idx, 1);
          }
        }

        const rowByName = this.getAddedRowIndexByName(attr.name);
        if (rowByName >= 0) {
          this.addedRows.splice(rowByName, 1);
        }

        if (attr.usageCount > 0 && this.document.data[attr.id] !== undefined) {
          this.rows.push({
            id: attr.id,
            correlationId: attr.correlationId,
            name: attr.name,
            value: this.document.data[attr.id] || '',
          });
        }
      });

      this.rowsChanged();
    } else {
      this.summary = '';
      this.summary$.next(this.summary);

      this.favorite$.next(false);
      this.rows = [];
      this.addedRows = [];
      this.rowsChanged();
    }
  }

  private getDocumentSummary(): string {
    if (this.collection && this.collection.defaultAttributeId && this.document) {
      return this.document.data[this.collection.defaultAttributeId];
    }

    if (this.collection && this.document && this.collection.attributes.length > 0) {
      for (const attr of this.collection.attributes) {
        if (this.document.data[attr.id]) {
          return this.document.data[attr.id];
        }
      }
    }

    return null;
  }

  private rowsChanged(): void {
    this.rows$.next([...this.rows, ...this.addedRows]);
  }

  public onAddRow(): void {
    this.addedRows.push({
      name: '',
      value: '',
      correlationId: CorrelationIdGenerator.generate(),
      warning: this.getEmptyWarning(),
    });
    this.rowsChanged();
  }

  public onUpdateRow(idx: number, keyValue: string[]): void {
    if (idx < this.rows.length) {
      this.updateExistingRow(idx, keyValue);
    } else {
      this.updateAddedRow(idx - this.rows.length, keyValue);
    }

    this.rowsChanged();
    this.saveChanges();
  }

  private updateExistingRow(idx: number, keyValue: string[]): void {
    const collision = this.getRowByName(keyValue[0]);

    if (collision && collision !== this.rows[idx]) {
      this.rows[idx].warning = this.getCollisionWarning();
    } else {
      this.rows[idx].newName = keyValue[0];
      this.rows[idx].newValue = keyValue[1];

      if (this.rows[idx].name === this.rows[idx].newName) {
        delete this.rows[idx].newName;
      }

      if (this.rows[idx].value === this.rows[idx].newValue) {
        delete this.rows[idx].newValue;
      }

      if (!keyValue[0]) {
        this.rows[idx].warning = this.getEmptyWarning();
      } else {
        delete this.rows[idx].warning;
      }
    }
  }

  private updateAddedRow(idx: number, keyValue: string[]): void {
    const collision = this.getRowByName(keyValue[0]);
    const collisionNew = this.getAddedRowByName(keyValue[0]);

    if (collision || (collisionNew && collisionNew !== this.addedRows[idx])) {
      this.addedRows[idx].warning = this.getCollisionWarning();
    } else {
      this.addedRows[idx].name = keyValue[0];
      this.addedRows[idx].value = keyValue[1];

      if (!keyValue[0]) {
        this.addedRows[idx].warning = this.getEmptyWarning();
      } else {
        delete this.addedRows[idx].warning;
      }
    }
  }

  private getRowByName(name: string): UiRow {
    if (name) {
      return this.rows.filter(row => !row.remove).find(row => row.name === name);
    }

    return null;
  }

  private getAddedRowByName(name: string): UiRow {
    if (name) {
      return this.addedRows.filter(row => !row.remove).find(row => row.name === name);
    }

    return null;
  }

  private getEmptyWarning(): string {
    return this.i18n({id: 'shared.document.detail.attribute.empty', value: 'The attribute name cannot be empty.'});
  }

  private getCollisionWarning(): string {
    return this.i18n({
      id: 'shared.document.detail.attribute.collision',
      value: 'The attribute name is already used in this record.',
    });
  }

  public onRemoveRow(idx: number): void {
    if (idx < this.rows.length) {
      const message = this.i18n({
        id: 'document.detail.attribute.remove.confirm',
        value: 'Are you sure you want to delete this row?',
      });
      const title = this.i18n({id: 'resource.delete.dialog.title', value: 'Delete?'});
      const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
      const noButtonText = this.i18n({id: 'button.no', value: 'No'});

      this.notificationService.confirm(message, title, [
        {text: noButtonText},
        {text: yesButtonText, action: () => this.removeRow(idx), bold: false},
      ]);
    } else {
      this.removeRow(idx);
    }
  }

  private removeRow(idx: number) {
    if (idx >= this.rows.length) {
      this.addedRows.splice(idx - this.rows.length, 1);
    } else {
      this.rows[idx].value = undefined;
      this.rows[idx].remove = true;
    }

    this.rowsChanged();
    this.saveChanges();
  }

  private saveFavoriteChange(favorite: boolean, onlyStore: boolean) {
    if (onlyStore) {
      if (favorite) {
        this.store.dispatch(new DocumentsAction.AddFavoriteSuccess({documentId: this.document.id}));
      } else {
        this.store.dispatch(new DocumentsAction.RemoveFavoriteSuccess({documentId: this.document.id}));
      }
    } else {
      if (favorite) {
        this.store.dispatch(
          new DocumentsAction.AddFavorite({
            collectionId: this.document.collectionId,
            documentId: this.document.id,
          })
        );
      } else {
        this.store.dispatch(
          new DocumentsAction.RemoveFavorite({
            collectionId: this.document.collectionId,
            documentId: this.document.id,
          })
        );
      }
    }
  }

  public onToggleFavorite(): void {
    if (isNullOrUndefined(this.favorite)) {
      this.favorite = this.document.favorite;
    }

    const value = !this.document.favorite;
    this.favoriteChange$.next(value);
    this.saveFavoriteChange(value, true);
  }
}
