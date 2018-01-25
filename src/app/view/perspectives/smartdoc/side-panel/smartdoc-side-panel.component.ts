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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Store} from '@ngrx/store';
import {SnotifyToast} from 'ng-snotify';
import {Observable} from 'rxjs/Observable';
import {first, map, skipWhile} from 'rxjs/operators';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {AppState} from '../../../../core/store/app.state';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {selectAllCollections} from '../../../../core/store/collections/collections.state';
import {CorrelationIdGenerator} from '../../../../core/store/correlation-id.generator';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {LinkTypeConverter} from '../../../../core/store/link-types/link-type.converter';
import {LinkTypeHelper} from '../../../../core/store/link-types/link-type.helper';
import {LinkTypeModel} from '../../../../core/store/link-types/link-type.model';
import {LinkTypesAction} from '../../../../core/store/link-types/link-types.action';
import {selectAllLinkTypes} from '../../../../core/store/link-types/link-types.state';
import {SmartDocModel, SmartDocPartModel, SmartDocPartType} from '../../../../core/store/smartdoc/smartdoc.model';
import {Perspective} from '../../perspective';
import {SmartDocUtils} from '../smartdoc.utils';

@Component({
  selector: 'smartdoc-side-panel',
  templateUrl: './smartdoc-side-panel.component.html',
  styleUrls: ['./smartdoc-side-panel.component.scss']
})
export class SmartDocSidePanelComponent {

  @Input()
  public collection: CollectionModel;

  @Input()
  public document: DocumentModel;

  @Output()
  public addPart = new EventEmitter<SmartDocPartModel>();

  public collections$: Observable<CollectionModel[]>;
  public linkTypes$: Observable<LinkTypeModel[]>;

  public constructor(private notificationService: NotificationService,
                     private store: Store<AppState>) {
    this.collections$ = this.store.select(selectAllCollections).pipe(
      map(collections => collections.filter(collection => collection && collection.code))
    );
    this.linkTypes$ = this.store.select(selectAllLinkTypes);
  }

  private addTextPart() {
    const delta = {
      ops: [
        {insert: 'Insert your text here...'}
      ]
    };

    const part: SmartDocPartModel = {
      type: SmartDocPartType.Text,
      textData: delta
    };
    this.addTemplatePart(part);
  }

  private addEmbeddedPart(linkType: LinkTypeModel) {
    const collectionId = LinkTypeHelper.getOtherCollectionId(linkType, this.collection.id);

    this.collections$.pipe(
      first(),
      map(collections => collections.find(collection => collection.id === collectionId))
    ).subscribe(collection => {
      const smartDoc: SmartDocModel = {
        collectionId: collectionId,
        parts: [SmartDocUtils.createInitialTextPart(collection)]
      };
      const part: SmartDocPartModel = {
        type: SmartDocPartType.Embedded,
        linkTypeId: linkType.id,
        perspective: Perspective.Table,
        smartDoc
      };
      this.addTemplatePart(part);
    });
  }

  private addTemplatePart(part: SmartDocPartModel) {
    this.addPart.emit(part);
  }

  public addPartByLinkType(linkType: LinkTypeModel) {
    this.addEmbeddedPart(linkType);
  }

  public addPartByCollection(collection: CollectionModel) {
    const createButton = {
      text: 'Create', action: (toast: SnotifyToast) => {
        this.createLinkTypeAndAddPart(collection, toast.value);
        this.notificationService.remove(toast.id);
      }
    };
    const cancelButton = {text: 'Cancel'};
    this.notificationService.prompt(`Do you really want to create a new link between ${this.collection.name} and ${collection.name}?`,
      'New link', [createButton, cancelButton], 'Enter link name');
  }

  private createLinkTypeAndAddPart(collection: CollectionModel, linkName: string) {
    const correlationId = this.createLinkType(this.collection, collection, linkName);

    this.linkTypes$.pipe(
      map(linkTypes => linkTypes.find(linkType => linkType.correlationId === correlationId)),
      skipWhile(linkType => !linkType),
      first()
    ).subscribe(linkType => this.addPartByLinkType(linkType));
  }

  private createLinkType(thisCollection: CollectionModel, otherCollection: CollectionModel, name?: string): string {
    const linkType: LinkTypeModel = {
      name: name ? name : thisCollection.name + '-' + otherCollection.name,
      collectionIds: [thisCollection.id, otherCollection.id],
      correlationId: CorrelationIdGenerator.generate()
    };
    this.store.dispatch(new LinkTypesAction.Create({linkType}));
    return linkType.correlationId;
  }

  public suggestLinkTypes(): Observable<LinkTypeModel[]> {
    return Observable.combineLatest(
      this.linkTypes$.pipe(
        map(linkTypes => linkTypes.filter(linkType => linkType.id && linkType.collectionIds.includes(this.document.collectionId)))
      ),
      this.collections$
    ).pipe(
      skipWhile(([linkTypes, collections]) => !(collections && collections.length)),
      map(([linkTypes, collections]: [LinkTypeModel[], CollectionModel[]]) => {
        return linkTypes.map(linkType => LinkTypeConverter.addCollections(linkType, collections));
      })
    );
  }

  public getLinkTypeById(linkTypeId: string): Observable<LinkTypeModel> {
    return this.linkTypes$.pipe(
      map(linkTypes => linkTypes.find(linkType => linkType.id === linkTypeId)),
      skipWhile(linkType => !linkType)
    );
  }

  public onAddText() {
    this.addTextPart();
  }

  public addEmbeddedPartWithNewCollection() {
    console.log('creating new collection and adding embedded part'); // TODO implement
  }

}
