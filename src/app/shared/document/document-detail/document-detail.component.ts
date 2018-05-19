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
import {CollectionModel} from "../../../core/store/collections/collection.model";
import {DocumentModel} from "../../../core/store/documents/document.model";
import {Subscription} from "rxjs/Subscription";
import {Store} from "@ngrx/store";
import {AppState} from "../../../core/store/app.state";
import {selectDocumentById} from "../../../core/store/documents/documents.state";
import {DocumentsAction} from "../../../core/store/documents/documents.action";
import {IntervalObservable} from "rxjs/observable/IntervalObservable";
import {selectCollectionById} from "../../../core/store/collections/collections.state";
import {selectUserNameById} from "../../../core/store/users/users.state";
import {filter, take} from "rxjs/operators";
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

  @Input('document')
  public documentModel: DocumentModel;

  @Output()
  public documentUpdate = new EventEmitter<DocumentModel>();

  public userUpdates = new Map();

  public rows: DetailRow[] = [];

  public createdBy$: Observable<string>;
  public updatedBy$: Observable<string>;

  private subscriptions = new Subscription();

  constructor(private i18n: I18n,
              private store: Store<AppState>,
              private notificationService: NotificationService) { }

  public ngOnInit() {
    this.subscriptions.add(this.store.select(selectDocumentById(this.documentModel.id)).subscribe(doc => {
      this.documentModel = doc;
      this.encodeDocument();
    }));
    this.subscriptions.add(this.store.select(selectCollectionById(this.collection.id)).subscribe(col => {
      this.collection = col;
      this.encodeDocument();
    }));
    this.subscriptions.add(IntervalObservable.create(200000).subscribe(() => this.patchDocument()));

    this.createdBy$ = this.store.select(selectUserNameById(this.documentModel.createdBy))
      .pipe(filter(name => !isNullOrUndefined(name)));
    this.updatedBy$ = this.store.select(selectUserNameById(this.documentModel.updatedBy))
      .pipe(filter(name => !isNullOrUndefined(name)));

    this.subscriptions.add(this.store.select(selectOrganizationByWorkspace)
      .pipe(filter(org => !isNullOrUndefined(org)), take(1))
      .subscribe(org => this.store.dispatch(new UsersAction.Get({ organizationId: org.id} ))));

    this.encodeDocument();
  }

  private encodeDocument() {
    this.collection.attributes.forEach(attr => {
      let row = this.getRowById(attr.id);
      if (row) {
        if (row.name !== attr.name) {
          row.name = attr.name;
        }
        if (row.value !== this.documentModel.data[attr.id]) {
          row.value = this.documentModel.data[attr.id];
        }
      } else {
        row = this.getRowByCorrelationId(attr.correlationId);
        if (row) {
          row.id = attr.id;
          if (row.name !== attr.name) {
            row.name = attr.name;
          }
          if (row.value !== this.documentModel.data[attr.id]) {
            row.value = this.documentModel.data[attr.id];
          }
        } else {
          this.rows.push({ id: attr.id, name: attr.name, value: this.documentModel.data[attr.id], correlationId: attr.correlationId });
        }
      }
    });
  }

  private getRowById(id: string) {
    if (id) {
      for (let row of this.rows) {
        if (row.id === id) {
          return row;
        }
      }
    }

    return null;
  }

  private getRowByCorrelationId(correlationId: string) {
    if (correlationId) {
      for (let row of this.rows) {
        if (row.correlationId === correlationId) {
          return row;
        }
      }
    }

    return null;
  }

  public getNativeDate(dateObject) {
    return new Date(dateObject.year, dateObject.monthValue, dateObject.dayOfMonth, dateObject.hour, dateObject.minute, dateObject.second).getTime();
  }

  private alreadyInCollection(attrName) {
    for (let attr of this.collection.attributes) {
      if (attr.name === attrName) {
        return true;
      }
    }
    return false;
  }

  private prepareUpdatedDocument() {
    let updatedDocument = Object.assign({}, this.documentModel);

    let dirty = this.patchNewAttributes(updatedDocument);
    dirty = dirty || this.patchExistingAttributes(updatedDocument);
    dirty = dirty || this.patchAttributeRename(updatedDocument);
    dirty = dirty || this.patchDeletedAttributes(updatedDocument);

    return dirty ? updatedDocument : null;
  }

  private patchNewAttributes(document: DocumentModel) {
    let dirty = false;

    const newData: { [attributeName: string]: any } = this.rows
      .filter(row => isNullOrUndefined(row.id) && !isNullOrUndefined(row.name) && !this.alreadyInCollection(row.name))
      .reduce((acc: { [attributeName: string]: any }, row) => {
        dirty = true;
        acc[row.name] = {value: row.value, correlationId: row.correlationId};
        return acc;
      }, {});

    document.newData = newData;

    return dirty;
  }

  private patchExistingAttributes(document: DocumentModel) {
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

  private patchAttributeRename(document: DocumentModel) {
    let dirty = false;

    this.rows.filter(row =>
      !isNullOrUndefined(row.id) &&
      row.name !== this.getCollectionAttributeById(row.id).name)
      .forEach(row => {
        dirty = true;
        const attr = this.getCollectionAttributeByName(row.name);

        if (attr) { // renamed to existing attribute
          document.data[attr.id] = row.value;
          row.id = attr.id;
        } else { // renamed to a completely new name
          row.id = null;
          row.correlationId = CorrelationIdGenerator.generate();
          document.data[row.id] = null;
          document.newData[row.name] = { value: row.value, correlationId: row.correlationId };
        }
      });

    return dirty;
  }

  private patchDeletedAttributes(document: DocumentModel) {
    let dirty = false;

    this.collection.attributes.forEach(attr => {
      if (document.data[attr.id] && !this.getRowById(attr.id)) {
        dirty = true;
        document.data[attr.id] = null;
      }
    });

    return dirty;
  }

  private getCollectionAttributeById(id: string) {
    return this.collection.attributes.find(attr => attr.id === id);
  }

  private getCollectionAttributeByName(name: string) {
    return this.collection.attributes.find(attr => attr.name === name);
  }

  private patchDocument() {
    // based on rows, figure out:
    // 1) what attributes are new
    // 2) what attributes are renamed
    // 3) what values are updated
    // ... and send corresponding updates



    const documentUpdateAction = new DocumentsAction.UpdateData({ document: null });

    // are there any updates to upload?
    if (this.userUpdates.size > 0) {
      let data = Object.assign({}, {...this.documentModel.data});
      this.userUpdates.forEach((v, k) => data[k] = v);
      documentUpdateAction.payload.document = Object.assign({}, {...this.documentModel}, {data});
    }

    // for new rows we must create attributes and then upload data
    if (this.rows.length > 0) {
      // keep only those rows with attr. name that is not null and not in conflict with existing attr. name
      const newData: { [attributeName: string]: any } = this.rows
        .filter(row => isNullOrUndefined(row.id) && !isNullOrUndefined(row.name) && !this.alreadyInCollection(row.name))
        .reduce((acc: { [attributeName: string]: any }, row) => {
          acc[row.name] = {value: row.value, correlationId: row.correlationId};
          return acc;
        }, {});
      const newAttributes = Object.keys(newData).map(name => ({name, constraints: [], correlationId: newData[name].correlationId}));

      console.log("=============")
      console.log(newData);
      console.log(newAttributes);
      console.log(this.rows);

      if (documentUpdateAction.payload.document) {
        documentUpdateAction.payload.document.newData = newData;
      } else {
        documentUpdateAction.payload.document = Object.assign({}, {...this.documentModel}, { newData });
      }

      this.store.dispatch(new CollectionsAction.CreateAttributes(
        {collectionId: this.documentModel.collectionId, attributes: newAttributes, nextAction: documentUpdateAction})
      );
    } else {
      if (documentUpdateAction.payload.document) {
        this.store.dispatch(documentUpdateAction);
      }
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.patchDocument();
  }

  public addAttrRow() {
    this.rows.push({ name: "", value: "", correlationId: CorrelationIdGenerator.generate() });
  }

  public submitAttribute(idx, $event: any) {
    if ($event[0]) {
    }
  }

  public onAttributeChange(attrId: string, newValue: string) {

  }

  public onValueChange(attrId: string, newValue: string) {
    if (attrId) {
      this.userUpdates.set(attrId, newValue);
    }
  }

  public removeAttribute(idx) {
   // if (this.encoded[idx][0]) {
   /*   const message = this.i18n(
        {
          id: 'document.detail.attribute.remove.confirm',
          value: 'Are you sure you want to delete this row?'
        });
      const title = this.i18n({id: 'resource.delete.dialog.title', value: 'Delete?'});
      const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
      const noButtonText = this.i18n({id: 'button.no', value: 'No'});

      this.notificationService.confirm(message, title, [
        {text: yesButtonText, action: () => this.encoded.splice(idx, 1), bold: false},
        {text: noButtonText}
      ]);*/
    //} else {
    //  this.encoded.splice(idx, 1);
    //}
  }

  public onRemoveRow(idx) {
    this.rows.splice(idx, 1);
  }

  public submitRowChange(idx, $event: string[]) {
    this.rows[idx].name = $event[0];
    this.rows[idx].value = $event[1];
  }
}
