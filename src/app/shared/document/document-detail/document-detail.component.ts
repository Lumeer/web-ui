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

import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {I18n} from "@ngx-translate/i18n-polyfill";
import {NotificationService} from "../../../core/notifications/notification.service";
import {AttributeModel, CollectionModel} from "../../../core/store/collections/collection.model";
import {DocumentModel} from "../../../core/store/documents/document.model";
import {Subscription} from "rxjs/Subscription";
import {Store} from "@ngrx/store";
import {AppState} from "../../../core/store/app.state";
import {selectDocumentById} from "../../../core/store/documents/documents.state";
import {DocumentsAction} from "../../../core/store/documents/documents.action";
import {IntervalObservable} from "rxjs/observable/IntervalObservable";
import {selectCollectionById} from "../../../core/store/collections/collections.state";
import {selectUserById} from "../../../core/store/users/users.state";
import {filter, map, take} from "rxjs/operators";
import {isNullOrUndefined} from "util";
import {UsersAction} from "../../../core/store/users/users.action";
import {selectOrganizationByWorkspace} from "../../../core/store/organizations/organizations.state";
import {Observable} from "rxjs/Observable";
import {CorrelationIdGenerator} from "../../../core/store/correlation-id.generator";
import {CollectionsAction} from "../../../core/store/collections/collections.action";
import {DetailRow} from "../detail-row";

@Component({
  selector: 'document-detail',
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.scss']
})
export class DocumentDetailComponent implements OnInit, OnDestroy {

  @Input()
  public collection: CollectionModel;

  public _documentModel: DocumentModel;

  @Output()
  public documentUpdate = new EventEmitter<DocumentModel>();

  public rows: DetailRow[] = [];

  public createdBy$: Observable<string>;
  public updatedBy$: Observable<string>;

  private subscriptions = new Subscription();

  public summary: string;

  constructor(private i18n: I18n,
              private store: Store<AppState>,
              private notificationService: NotificationService) { }

  get documentModel(): DocumentModel {
    return this._documentModel;
  }

  @Input("document")
  set documentModel(model: DocumentModel) {
    this._documentModel = model;
    this.rows = [];
    this.encodeDocument();
  }

  public ngOnInit() {
    this.subscriptions.add(this.store.select(selectDocumentById(this._documentModel.id)).subscribe(doc => {
      this._documentModel = doc;
      this.encodeDocument();
    }));
    this.subscriptions.add(this.store.select(selectCollectionById(this.collection.id)).subscribe(col => {
      this.collection = col;
      this.encodeDocument();
    }));
    this.subscriptions.add(IntervalObservable.create(2000).subscribe(() => this.patchDocument()));

    this.createdBy$ = this.store.select(selectUserById(this._documentModel.createdBy))
      .pipe(filter(user => !isNullOrUndefined(user)), map(user => user.name || user.email || 'Guest'));
    this.updatedBy$ = this.store.select(selectUserById(this._documentModel.updatedBy))
      .pipe(filter(user => !isNullOrUndefined(user)), map(user => user.name || user.email || 'Guest'));

    this.subscriptions.add(this.store.select(selectOrganizationByWorkspace)
      .pipe(filter(org => !isNullOrUndefined(org)), take(1))
      .subscribe(org => this.store.dispatch(new UsersAction.Get({ organizationId: org.id} ))));

    this.encodeDocument();
  }

  private encodeDocument() {
    this.summary = this.getDocumentSummary();

    this.collection.attributes.forEach(attr => {
      if (attr.usageCount > 0 && this._documentModel.data[attr.id] !== undefined) {
        let row = this.getRowById(attr.id);
        if (row) {
          row.remove = false;
          if (row.name !== attr.name) {
            row.name = attr.name;
          }
          if (row.value !== this._documentModel.data[attr.id]) {
            row.value = this._documentModel.data[attr.id];
          }
        } else {
          row = this.getRowByCorrelationId(attr.correlationId);
          if (row) {
            row.remove = false;
            row.id = attr.id;
            if (row.name !== attr.name) {
              row.name = attr.name;
            }
            if (row.value !== this._documentModel.data[attr.id]) {
              row.value = this._documentModel.data[attr.id];
            }
          } else {
            this.rows.push({ id: attr.id, name: attr.name, value: this._documentModel.data[attr.id], correlationId: attr.correlationId });
          }
        }
      } else {
        this.removeRowById(attr.id);
      }
    });
  }

  private getRowById(id: string): DetailRow {
    if (id) {
      return this.rows.find(row => row.id === id);
    }

    return null;
  }

  private getRowByCorrelationId(correlationId: string): DetailRow {
    if (correlationId) {
      return this.rows.find(row => row.correlationId === correlationId);
    }

    return null;
  }

  private getRowByName(name: string): DetailRow {
    if (name) {
      return this.rows.filter(row => !row.remove).find(row => row.name === name);
    }

    return null;
  }

  private getRemovableRowByName(name: string): DetailRow {
    if (name) {
      return this.rows.filter(row => row.remove).find(row => row.name === name);
    }

    return null;
  }

  private removeRowById(id: string) {
    const idx = this.rows.indexOf(this.getRowById(id));
    if (idx >= 0 && (this.rows[idx].remove || !this._documentModel.data[id])) {
      this.rows.splice(idx, 1);
    }
  }

  private alreadyInCollection(attrName: string): boolean {
    return this.collection.attributes.findIndex(attr => attr.name === attr.name) != - 1;
  }

  private prepareUpdatedDocument(): DocumentModel {
    let updatedDocument = Object.assign({}, this._documentModel);

    let dirty = this.patchNewAttributes(updatedDocument);
    dirty = dirty || this.patchExistingAttributes(updatedDocument);
    dirty = dirty || this.patchAttributeRename(updatedDocument);
    dirty = dirty || this.patchReusedAttributes(updatedDocument);
    dirty = dirty || this.patchDeletedAttributes(updatedDocument);

    return dirty ? updatedDocument : null;
  }

  private patchNewAttributes(document: DocumentModel): boolean {
    let dirty = false;

    const newData: { [attributeName: string]: any } = this.rows
      .filter(row => isNullOrUndefined(row.id) && row.name && !this.alreadyInCollection(row.name))
      .reduce((acc: { [attributeName: string]: any }, row) => {
        dirty = true;
        acc[row.name] = {value: row.value, correlationId: row.correlationId};
        return acc;
      }, {});

    document.newData = newData;

    return dirty;
  }

  private patchExistingAttributes(document: DocumentModel): boolean {
    let dirty = false;
    this.rows.filter(row =>
      !isNullOrUndefined(row.id) &&
      row.value !== document.data[row.id] &&
      row.name === this.getCollectionAttributeById(row.id).name)
      .forEach(row => {
        dirty = true;
        document.data[row.id] = row.value;
      });

    return dirty;
  }

  // patch those that are defined in collection but were unused
  private patchReusedAttributes(document: DocumentModel): boolean {
    let dirty = false;
    this.rows.filter(row =>
      isNullOrUndefined(row.id) && row.name &&
      this.alreadyInCollection(row.name))
      .forEach(row => {
        dirty = true;
        let attr = this.getCollectionAttributeByName(row.name);

        row.id = attr.id;
        row.correlationId = undefined;
        document.data[attr.id] = row.value;
      });

    return dirty;
  }

  private patchAttributeRename(document: DocumentModel): boolean {
    let dirty = false;

    this.rows.filter(row =>
      !isNullOrUndefined(row.id) &&
      row.name !== this.getCollectionAttributeById(row.id).name)
      .forEach(row => {
        dirty = true;
        const attr = this.getCollectionAttributeByName(row.name);

        if (attr) { // renamed to existing attribute
          if (!document.data[attr.id]) {
            delete document.data[row.id];
            document.data[attr.id] = row.value;
            row.id = attr.id;
            row.correlationId = undefined;
          } else if (document.data[attr.id] && this.getRemovableRowByName(row.name) && this.getRowByName(row.name)) {
            const originalRow = this.getRemovableRowByName(row.name);
            originalRow.id = row.id;
            document.data[attr.id] = row.value;
            row.id = attr.id;
            row.correlationId = undefined;
          }
        } else { // renamed to a completely new name
          delete document.data[row.id];
          row.id = null;
          row.correlationId = CorrelationIdGenerator.generate();
          document.newData[row.name] = { value: row.value, correlationId: row.correlationId };
        }
      });

    return dirty;
  }

  private patchDeletedAttributes(document: DocumentModel): boolean {
    let dirty = false;

    this.collection.attributes.forEach(attr => {
      if (document.data[attr.id] && this.getRowById(attr.id) && this.getRowById(attr.id).remove) {
        dirty = true;
        delete document.data[attr.id];
      }
    });

    return dirty;
  }

  private getCollectionAttributeById(id: string): AttributeModel {
    return this.collection.attributes.find(attr => attr.id === id);
  }

  private getCollectionAttributeByName(name: string): AttributeModel {
    return this.collection.attributes.find(attr => attr.name === name);
  }

  private patchDocument() {
    const updatedDocument = this.prepareUpdatedDocument();

    if (updatedDocument) {
      const documentUpdateAction = new DocumentsAction.UpdateData({ document: updatedDocument });

      if (updatedDocument.newData && Object.getOwnPropertyNames(updatedDocument.newData).length > 0) {
        const newAttributes = Object.keys(updatedDocument.newData).map(name => ({name, constraints: [], correlationId: updatedDocument.newData[name].correlationId}));

        this.store.dispatch(new CollectionsAction.CreateAttributes(
          {collectionId: this._documentModel.collectionId, attributes: newAttributes, nextAction: documentUpdateAction})
        );
      } else {
        this.store.dispatch(documentUpdateAction);
      }
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.patchDocument();
  }

  public addAttrRow() {
    this.rows.push({ name: "", value: "", correlationId: CorrelationIdGenerator.generate(), warning: this.getEmptyWarning() });
  }

  public onRemoveRow(idx: number) {
    if (this.rows[idx].name) {
      const message = this.i18n(
        {
          id: 'document.detail.attribute.remove.confirm',
          value: 'Are you sure you want to delete this row?'
        });
      const title = this.i18n({id: 'resource.delete.dialog.title', value: 'Delete?'});
      const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
      const noButtonText = this.i18n({id: 'button.no', value: 'No'});

      this.notificationService.confirm(message, title, [
        {text: yesButtonText, action: () => this.removeRow(idx), bold: false},
        {text: noButtonText}
      ]);
    } else {
      this.removeRow(idx);
    }
  }

  private removeRow(idx: number) {
    if (!this.rows[idx].name) {
      this.rows.splice(idx, 1);
    } else {
      this.rows[idx].value = undefined;
      this.rows[idx].remove = true;
    }
  }

  public submitRowChange(idx: number, $event: string[]) {
    const collision = this.getRowByName($event[0]);

    if (collision && collision !== this.rows[idx]) {
      this.rows[idx].warning = this.getCollisionWarning();
    } else {
      this.rows[idx].name = $event[0];
      this.rows[idx].value = $event[1];

      if (!$event[0]) {
        this.rows[idx].warning = this.getEmptyWarning();
      } else {
        delete this.rows[idx].warning;
      }
    }
  }

  private getEmptyWarning(): string {
    return this.i18n({ id: "shared.document.detail.attribute.empty", value: "The attribute name cannot be empty." })
  }

  private getCollisionWarning(): string {
    return this.i18n({ id: "shared.document.detail.attribute.collision", value: "The attribute name is already used in this document." })
  }

  private getDocumentSummary(): string {
    if (this.collection.defaultAttributeId) {
      return this._documentModel.data[this.collection.defaultAttributeId];
    }

    if (this.collection.attributes.length > 0) {
      for (let attr of this.collection.attributes) {
        if (this._documentModel.data[attr.id]) {
          return this._documentModel.data[attr.id];
        }
      }
    }

    return null;
  }
}
