/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {Observable, combineLatest, BehaviorSubject} from 'rxjs';
import {LinkType} from '../../../core/store/link-types/link.type';
import {selectLinkTypesByCollectionId} from '../../../core/store/common/permissions.selectors';
import {AppState} from '../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {map, tap} from 'rxjs/operators';
import {selectCollectionsDictionary} from '../../../core/store/collections/collections.state';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {Query} from '../../../core/store/navigation/query/query';

@Component({
  selector: 'links-list',
  templateUrl: './links-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksListComponent implements OnChanges {
  @Input()
  public document: DocumentModel;

  @Input()
  public collection: Collection;

  @Output()
  public documentSelect = new EventEmitter<{collection: Collection; document: DocumentModel}>();

  public linkTypes$: Observable<LinkType[]>;

  public selectedLinkType$ = new BehaviorSubject<LinkType>(null);

  public constructor(private store: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    this.renewSubscriptions(changes.collection);
  }

  public onSelectLink(linkType: LinkType) {
    this.selectedLinkType$.next(linkType);

    if (linkType) {
      this.readDocuments(linkType);
    }
  }

  public unLinkDocument(linkInstanceId: string) {
    this.store.dispatch(new LinkInstancesAction.Delete({linkInstanceId}));
  }

  private renewSubscriptions(change: SimpleChange) {
    if (
      change &&
      (!change.previousValue || (change.currentValue && change.previousValue.id !== change.currentValue.id))
    ) {
      this.linkTypes$ = combineLatest([
        this.store.select(selectLinkTypesByCollectionId(this.collection.id)),
        this.store.select(selectCollectionsDictionary),
      ]).pipe(
        map(([linkTypes, collectionsMap]) =>
          linkTypes.map(linkType => {
            const collections: [Collection, Collection] = [
              collectionsMap[linkType.collectionIds[0]],
              collectionsMap[linkType.collectionIds[1]],
            ];
            return {...linkType, collections};
          })
        ),
        tap(linkTypes => this.initActiveLinkType(linkTypes))
      );
    }
  }

  private initActiveLinkType(linkTypes: LinkType[]) {
    let selectLinkType: LinkType;
    if (this.selectedLinkType$.value) {
      selectLinkType = linkTypes.find(linkType => linkType.id === this.selectedLinkType$.value.id);
    }

    this.onSelectLink(selectLinkType || linkTypes[0]);
  }

  private readDocuments(linkType: LinkType) {
    if (linkType) {
      const query: Query = {stems: [{collectionId: this.collection.id, linkTypeIds: [linkType.id]}]};
      this.store.dispatch(new DocumentsAction.Get({query}));
    }
  }

  public onSelectDocument(data: {collection: Collection; document: DocumentModel}) {
    this.documentSelect.emit(data);
  }
}
