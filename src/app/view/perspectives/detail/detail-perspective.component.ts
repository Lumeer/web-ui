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

import {ChangeDetectionStrategy, Component, Input, OnDestroy} from '@angular/core';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {NavigationAction} from '../../../core/store/navigation/navigation.action';
import {Query} from '../../../core/store/navigation/query';
import {BehaviorSubject, of, Subscription} from 'rxjs';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {map, mergeMap} from 'rxjs/operators';
import {selectDocumentById} from '../../../core/store/documents/documents.state';

@Component({
  selector: 'detail-perspective',
  templateUrl: './detail-perspective.component.html',
  styleUrls: ['./detail-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailPerspectiveComponent implements OnDestroy {
  @Input()
  public embedded: boolean;

  public selected$ = new BehaviorSubject<{collection?: Collection; document?: DocumentModel}>({});
  private selectedCollection: Collection;
  private collectionSubsription = new Subscription();

  public constructor(private store$: Store<AppState>) {}

  public ngOnDestroy() {
    this.collectionSubsription.unsubscribe();
  }

  public selectCollection(collection: Collection) {
    this.select(collection, undefined);
  }

  public selectDocument(document: DocumentModel) {
    this.select(this.selectedCollection, document);
    this.loadLinkInstances(document);
  }

  public selectCollectionAndDocument(data: {collection: Collection; document: DocumentModel}) {
    const {collection, document} = data;
    this.setQueryWithCollection(collection);
    this.select(collection, document);
  }

  private select(collection: Collection, document?: DocumentModel) {
    this.selectedCollection = collection;

    this.collectionSubsription.unsubscribe();
    this.collectionSubsription = this.store$
      .pipe(
        select(selectCollectionById(collection.id)),
        mergeMap(coll => {
          if (document) {
            return this.store$.pipe(
              select(selectDocumentById(document.id)),
              map(doc => ({collection: coll, document: doc}))
            );
          }
          return of({collection: coll, document});
        })
      )
      .subscribe(selected => this.emit(selected));
  }

  private emit(selected: {collection: Collection; document?: DocumentModel}) {
    setTimeout(() => {
      this.selected$.next(selected);
    });
  }

  private loadLinkInstances(document: DocumentModel) {
    if (document) {
      const query: Query = {stems: [{collectionId: document.collectionId, documentIds: [document.id]}]};
      this.store$.dispatch(new LinkInstancesAction.Get({query}));
    }
  }

  private setQueryWithCollection(collection: Collection) {
    const query: Query = {stems: [{collectionId: collection.id}]};
    this.store$.dispatch(new NavigationAction.RemoveViewFromUrl({setQuery: query}));
  }
}
