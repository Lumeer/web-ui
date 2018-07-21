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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';

import {LinkTypeModel} from '../../../../core/store/link-types/link-type.model';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {AttributeModel, CollectionModel} from '../../../../core/store/collections/collection.model';
import {AppState} from '../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {selectCollectionsDictionary} from '../../../../core/store/collections/collections.state';
import {getOtherLinkedCollectionId} from '../../../utils/link-type.utils';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';

const PAGE_SIZE = 100;

@Component({
  selector: 'links-list-table',
  templateUrl: './links-list-table.component.html',
  styleUrls: ['./links-list-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinksListTableComponent implements OnChanges {

  @Input() public linkType: LinkTypeModel;

  @Input() public document: DocumentModel;

  public collection$: Observable<CollectionModel>;

  public documents$: Observable<DocumentModel>;

  public page = 0;

  public readonly pageSize = PAGE_SIZE;

  public constructor(private store: Store<AppState>) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.renewSubscriptions();
  }

  private renewSubscriptions() {
    if (this.linkType && this.document) {
      this.collection$ = this.store.select(selectCollectionsDictionary).pipe(
        map(collectionsMap => {
          const collectionId = getOtherLinkedCollectionId(this.linkType, this.document.collectionId);
          return collectionsMap[collectionId];
        })
      );
    }
  }

  public documentSelected(document: DocumentModel) {

  }

  public trackByAttribute(index: number, attribute: AttributeModel): string {
    return attribute.correlationId || attribute.id;
  }

  public trackByDocument(index: number, document: DocumentModel): string {
    return document.correlationId || document.id;
  }

}
