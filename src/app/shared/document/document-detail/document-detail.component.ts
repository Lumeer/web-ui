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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {I18n} from "@ngx-translate/i18n-polyfill";
import {NotificationService} from "../../../core/notifications/notification.service";
import {CollectionModel} from "../../../core/store/collections/collection.model";
import {DocumentModel} from "../../../core/store/documents/document.model";
import {Subscription} from "rxjs/Subscription";
import {Store} from "@ngrx/store";
import {AppState} from "../../../core/store/app.state";
import {selectDocumentById} from "../../../core/store/documents/documents.state";
import {DocumentsAction} from "../../../core/store/documents/documents.action";
import {Observable} from "rxjs/Observable";
import {IntervalObservable} from "rxjs/observable/IntervalObservable";

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

  @Input()
  public summary: string = 'voluptatem sequi nesciunt. Neque porro';

  @Input()
  public tmpDocument = { 'Attr1': 'accusantium', 'Attr2': 16, 'Attr3': 'voluptatem sequi nesciunt. Neque porro', 'Attr4': 'Quis autem vel'};

  public userUpdates = new Map();

  public encoded;

  private subscriptions = new Subscription();

  constructor(private i18n: I18n,
              private store: Store<AppState>,
              private notificationService: NotificationService) { }

  public ngOnInit() {
    this.subscriptions.add(this.store.select(selectDocumentById(this.documentModel.id)).subscribe(doc => {
      this.documentModel = doc;
    }));

    this.subscriptions.add(IntervalObservable.create(2000).subscribe(() => this.patchDocument()));

    this.encodeEntries()
  }

  private patchDocument() {
    this.collection.attributes.forEach(attr => {
      if (this.userUpdates.get(attr.id)) {
        if (this.documentModel.data[attr.id] === this.userUpdates.get(attr.id)) {
          this.userUpdates.delete(attr.id);
        } else {
        }
      }
    });

    if (this.userUpdates.size > 0) {
      let data = Object.assign({}, { ...this.documentModel.data });
      this.userUpdates.forEach((v, k) => data[k] = v);

      this.store.dispatch(new DocumentsAction.UpdateData({
        document: Object.assign({}, { ...this.documentModel }, { data })
        })
      );
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.patchDocument();
  }

  public encodeEntries() {
    this.encoded = Object.entries(this.tmpDocument);
  }

  public addAttrRow() {
    this.encoded.push(["", ""]);
  }

  public submitAttribute(idx, $event: any) {
    if ($event[0]) {
      this.encoded[idx] = $event;
      this.tmpDocument[$event[0]] = $event[1];
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
    if (this.encoded[idx][0]) {
      const message = this.i18n(
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
      ]);
    } else {
      this.encoded.splice(idx, 1);
    }
  }

}
