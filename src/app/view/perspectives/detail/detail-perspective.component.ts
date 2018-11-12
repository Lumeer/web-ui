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

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input} from '@angular/core';
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {AppState} from '../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {NavigationAction} from '../../../core/store/navigation/navigation.action';

@Component({
  selector: 'detail-perspective',
  templateUrl: './detail-perspective.component.html',
  styleUrls: ['./detail-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailPerspectiveComponent {
  @Input()
  public embedded: boolean;

  public selectedCollection: CollectionModel;

  public selectedDocument: DocumentModel;

  public constructor(private store: Store<AppState>, private detector: ChangeDetectorRef) {}

  public selectCollection(collection: CollectionModel) {
    this.select(collection, undefined);
  }

  public selectDocument(document: DocumentModel) {
    this.select(this.selectedCollection, document);
    this.loadLinkInstances(document);
  }

  public selectCollectionAndDocument(data: {collection: CollectionModel; document: DocumentModel}) {
    const {collection, document} = data;
    this.setQueryWithCollection(collection);
    this.select(collection, document);
  }

  private select(collection: CollectionModel, document?: DocumentModel) {
    this.selectedCollection = collection;
    this.selectedDocument = document;

    this.detector.detectChanges();
  }

  private loadLinkInstances(document: DocumentModel) {
    if (document) {
      const query = {documentIds: [document.id]};
      this.store.dispatch(new LinkInstancesAction.Get({query}));
    }
  }

  private setQueryWithCollection(collection: CollectionModel) {
    const query = {collectionIds: [collection.id]};
    this.store.dispatch(new NavigationAction.RemoveViewFromUrl({setQuery: query}));
  }
}
