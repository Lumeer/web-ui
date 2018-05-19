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
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {map} from 'rxjs/operators';
import {AppState} from '../../../../../../../core/store/app.state';
import {AttributeModel, CollectionModel} from '../../../../../../../core/store/collections/collection.model';
import {selectAllCollections, selectCollectionsDictionary} from '../../../../../../../core/store/collections/collections.state';
import {LinkTypeHelper} from '../../../../../../../core/store/link-types/link-type.helper';
import {LinkTypeModel} from '../../../../../../../core/store/link-types/link-type.model';
import {selectLinkTypesByCollectionId} from '../../../../../../../core/store/link-types/link-types.state';
import {NavigationAction} from '../../../../../../../core/store/navigation/navigation.action';
import {selectQuery} from '../../../../../../../core/store/navigation/navigation.state';
import {TableHeaderCursor} from '../../../../../../../core/store/tables/table-cursor';
import {TableModel} from '../../../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../../../core/store/tables/tables.action';
import {DialogService} from '../../../../../../../dialog/dialog.service';
import {extractAttributeLastName} from '../../../../../../../shared/utils/attribute.utils';

interface LinkedAttribute {

  linkType?: LinkTypeModel,
  collection: CollectionModel,
  attribute: AttributeModel

}

const MAX_SUGGESTIONS_COUNT = 5;

@Component({
  selector: 'table-attribute-suggestions',
  templateUrl: './table-attribute-suggestions.component.html',
  styleUrls: ['./table-attribute-suggestions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableAttributeSuggestionsComponent implements OnChanges {

  @Input()
  public table: TableModel;

  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public attributeName: string;

  @Input()
  public collection: CollectionModel;

  public lastName: string;

  public linkedAttributes$: Observable<LinkedAttribute[]>;
  public allAttributes$: Observable<LinkedAttribute[]>;

  public constructor(private dialogService: DialogService,
                     private store: Store<AppState>) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attributeName && this.attributeName) {
      this.lastName = extractAttributeLastName(this.attributeName);
    }
    if ((changes.collection || changes.attributeName) && this.collection && this.attributeName && this.lastName) {
      this.linkedAttributes$ = this.suggestLinkedAttributes();
      this.allAttributes$ = this.suggestAllAttributes();
    }
  }

  public useLinkType({linkType}: LinkedAttribute) {
    this.store.dispatch(new TablesAction.RemoveColumn({cursor: this.cursor}));
    this.store.dispatch(new NavigationAction.AddLinkToQuery({linkTypeId: linkType.id}));
  }

  public createLinkType({collection}: LinkedAttribute) {
    this.store.dispatch(new TablesAction.SetCursor({cursor: null}));
    const linkCollectionIds = [this.collection.id, collection.id].join(',');
    this.dialogService.openCreateLinkDialog(linkCollectionIds, linkType => {
      this.store.dispatch(new NavigationAction.AddLinkToQuery({linkTypeId: linkType.id}));
    });
  }

  public suggestLinkedAttributes(): Observable<LinkedAttribute[]> {
    return Observable.combineLatest(
      this.store.select(selectLinkTypesByCollectionId(this.collection.id)),
      this.store.select(selectCollectionsDictionary),
      this.store.select(selectQuery)
    ).pipe(
      map(([linkTypes, collectionsMap, query]) => linkTypes
        .filter(linkType => !query.linkTypeIds || !query.linkTypeIds.includes(linkType.id))
        .reduce<LinkedAttribute[]>((filtered, linkType) => {
          if (filtered.length >= MAX_SUGGESTIONS_COUNT) {
            return filtered.slice(0, 5);
          }

          const collectionId = LinkTypeHelper.getOtherCollectionId(linkType, this.collection.id);
          const collection = collectionsMap[collectionId];

          return filtered.concat(
            collection.attributes
              .filter(attribute => attribute.name.toLowerCase().startsWith(this.lastName.toLowerCase()))
              .map(attribute => ({linkType, collection, attribute}))
              .filter(newAttribute => filtered.every(existingAttribute => !equalLinkedAttributes(newAttribute, existingAttribute)))
          );
        }, [])
      )
    );
  }

  public suggestAllAttributes(): Observable<LinkedAttribute[]> {
    return this.store.select(selectAllCollections).pipe(
      map((collections: CollectionModel[]) => collections.reduce<LinkedAttribute[]>((filtered, collection) => {
        if (filtered.length >= MAX_SUGGESTIONS_COUNT) {
          return filtered.slice(0, 5);
        }

        return filtered.concat(
          collection.attributes
            .filter(attribute => attribute.name.toLowerCase().startsWith(this.lastName.toLowerCase()))
            .map(attribute => ({collection, attribute}))
            .filter(newAttribute => filtered.every(existingAttribute => !equalLinkedAttributes(newAttribute, existingAttribute)))
        );
      }, []))
    );
  }

}

function equalLinkedAttributes(a1: LinkedAttribute, a2: LinkedAttribute): boolean {
  return a1.attribute.id === a2.attribute.id && a1.collection.id === a2.collection.id && a1.linkType.id === a2.linkType.id;
}
