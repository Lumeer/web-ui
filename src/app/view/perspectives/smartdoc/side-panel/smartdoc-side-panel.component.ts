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
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {first, map, skipWhile} from 'rxjs/operators';
import {AppState} from '../../../../core/store/app.state';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {selectAllCollections} from '../../../../core/store/collections/collections.state';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {LinkTypeConverter} from '../../../../core/store/link-types/link-type.converter';
import {LinkTypeHelper} from '../../../../core/store/link-types/link-type.helper';
import {LinkTypeModel} from '../../../../core/store/link-types/link-type.model';
import {selectAllLinkTypes} from '../../../../core/store/link-types/link-types.state';
import {SmartDocModel, SmartDocPartModel, SmartDocPartType} from '../../../../core/store/smartdoc/smartdoc.model';
import {Perspective} from '../../perspective';
import {SmartDocUtils} from '../smartdoc.utils';

declare let $: any;

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

  public constructor(private router: Router,
                     private store: Store<AppState>) {
    this.collections$ = this.store.select(selectAllCollections).pipe(
      map(collections => collections.filter(collection => collection && collection.id))
    );
    this.linkTypes$ = this.store.select(selectAllLinkTypes);
  }

  private addTextPart() {
    const part = SmartDocUtils.createEmptyTextPart();
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
    this.router.navigate([], {
      queryParams: {
        linkCollectionIds: [this.collection.id, collection.id].join(',')
      },
      queryParamsHandling: 'merge'
    });
    $(`#newLinkDialogModal`).modal('show'); // TODO connect ids
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

  public onAddText() {
    this.addTextPart();
  }

  public addPartWithNewCollection() {
    $(`#newLinkedCollectionInSmartDocModal`).modal('show'); // TODO connect ids
  }

}
