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
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {filter, first, map, tap} from 'rxjs/operators';
import {AppState} from '../../../../../../../core/store/app.state';
import {AttributeModel, CollectionModel} from '../../../../../../../core/store/collections/collection.model';
import {CollectionsAction} from '../../../../../../../core/store/collections/collections.action';
import {
  selectAllCollections,
  selectCollectionsDictionary,
} from '../../../../../../../core/store/collections/collections.state';
import {selectLinkTypesByCollectionId} from '../../../../../../../core/store/common/permissions.selectors';
import {LinkTypeHelper} from '../../../../../../../core/store/link-types/link-type.helper';
import {LinkTypeModel} from '../../../../../../../core/store/link-types/link-type.model';
import {NavigationAction} from '../../../../../../../core/store/navigation/navigation.action';
import {selectQuery} from '../../../../../../../core/store/navigation/navigation.state';
import {TableHeaderCursor} from '../../../../../../../core/store/tables/table-cursor';
import {TableModel} from '../../../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../../../core/store/tables/tables.action';
import {DialogService} from '../../../../../../../dialog/dialog.service';
import {Direction} from '../../../../../../../shared/direction';
import {extractAttributeLastName, findAttributeByName} from '../../../../../../../shared/utils/attribute.utils';

interface LinkedAttribute {
  linkType?: LinkTypeModel;
  collection: CollectionModel;
  attribute: AttributeModel;
}

const MAX_SUGGESTIONS_COUNT = 5;

@Component({
  selector: 'table-attribute-suggestions',
  templateUrl: './table-attribute-suggestions.component.html',
  styleUrls: ['./table-attribute-suggestions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  public newCount = 0;
  public linkedCount = 0;
  private allCount = 0;

  public selectedIndex$ = new BehaviorSubject(-1);

  public constructor(private dialogService: DialogService, private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attributeName) {
      this.lastName = extractAttributeLastName(this.attributeName);
    }
    if ((changes.collection || changes.attributeName) && this.collection) {
      this.newCount = Number(!findAttributeByName(this.collection.attributes, this.attributeName)); // TODO add support for nested attributes
      this.linkedAttributes$ = this.suggestLinkedAttributes();
      this.allAttributes$ = this.suggestAllAttributes();
    }
  }

  public createAttribute() {
    const attribute: AttributeModel = {
      name: this.attributeName,
      constraints: [],
    };
    this.store$.dispatch(
      new CollectionsAction.CreateAttributes({
        collectionId: this.collection.id,
        attributes: [attribute],
        callback: attributes => this.initColumn(attributes),
      })
    );
  }

  private initColumn(attributes: AttributeModel[]) {
    const attribute = attributes.find(attr => attr.name === this.attributeName);
    if (attribute) {
      this.store$.dispatch(
        new TablesAction.InitColumn({
          cursor: this.cursor,
          attributeId: attribute.id,
        })
      );
    }
  }

  public useLinkType(linkType: LinkTypeModel) {
    this.store$.dispatch(new NavigationAction.AddLinkToQuery({linkTypeId: linkType.id}));
  }

  public createLinkType(collection: CollectionModel) {
    this.store$.dispatch(new TablesAction.SetCursor({cursor: null}));
    const linkCollectionIds = [this.collection.id, collection.id].join(',');
    this.dialogService.openCreateLinkDialog(linkCollectionIds, linkType => this.useLinkType(linkType));
  }

  public suggestLinkedAttributes(): Observable<LinkedAttribute[]> {
    return combineLatest(
      this.store$.select(selectLinkTypesByCollectionId(this.collection.id)),
      this.store$.select(selectCollectionsDictionary),
      this.store$.select(selectQuery)
    ).pipe(
      map(([linkTypes, collectionsMap, query]) =>
        linkTypes
          .filter(linkType => !query.linkTypeIds || !query.linkTypeIds.includes(linkType.id))
          .reduce<LinkedAttribute[]>((filtered, linkType) => {
            if (filtered.length >= MAX_SUGGESTIONS_COUNT) {
              return filtered.slice(0, 5);
            }

            const collectionId = LinkTypeHelper.getOtherCollectionId(linkType, this.collection.id);
            const collection = collectionsMap[collectionId];

            return filtered.concat(
              collection.attributes
                .filter(attribute => this.isMatchingAttribute(collection, attribute))
                .map(attribute => ({linkType, collection, attribute}))
                .filter(newAttribute =>
                  filtered.every(existingAttribute => !equalLinkedAttributes(newAttribute, existingAttribute))
                )
            );
          }, [])
      ),
      tap(suggestions => (this.linkedCount = suggestions.length))
    );
  }

  public suggestAllAttributes(): Observable<LinkedAttribute[]> {
    return this.store$.select(selectAllCollections).pipe(
      map((collections: CollectionModel[]) =>
        collections.reduce<LinkedAttribute[]>((filtered, collection) => {
          if (filtered.length >= MAX_SUGGESTIONS_COUNT) {
            return filtered.slice(0, 5);
          }

          return filtered.concat(
            collection.attributes
              .filter(attribute => this.isMatchingAttribute(collection, attribute))
              .map(attribute => ({collection, attribute}))
              .filter(newAttribute =>
                filtered.every(existingAttribute => !equalLinkedAttributes(newAttribute, existingAttribute))
              )
          );
        }, [])
      ),
      tap(suggestions => (this.allCount = suggestions.length))
    );
  }

  private isMatchingAttribute(collection: CollectionModel, attribute: AttributeModel): boolean {
    return (
      this.lastName &&
      (attribute.name.toLowerCase().startsWith(this.lastName.toLowerCase()) ||
        collection.name.toLowerCase().startsWith(this.lastName.toLowerCase()))
    );
  }

  public moveSelection(direction: Direction) {
    const index = this.selectedIndex$.getValue();

    if (direction === Direction.Up && index > -1) {
      this.selectedIndex$.next(index - 1);
    }
    if (direction === Direction.Down && index < this.newCount + this.linkedCount + this.allCount - 1) {
      this.selectedIndex$.next(index + 1);
    }
  }

  public useSelection() {
    const index = this.selectedIndex$.getValue();
    if (index < 0) {
      return;
    }

    if (index === 0 && this.newCount === 1) {
      return this.createAttribute();
    }

    if (this.newCount <= index && index < this.newCount + this.linkedCount) {
      this.linkedAttributes$
        .pipe(
          first(),
          map(suggestions => suggestions[index - this.newCount]),
          filter(suggestion => !!suggestion && !!suggestion.linkType)
        )
        .subscribe(suggestion => this.useLinkType(suggestion.linkType));
      return;
    }

    if (this.newCount + this.linkedCount <= index && index < this.newCount + this.linkedCount + this.allCount) {
      this.allAttributes$
        .pipe(
          first(),
          map(suggestions => suggestions[index - this.linkedCount - this.newCount]),
          filter(suggestion => !!suggestion && !!suggestion.collection)
        )
        .subscribe(suggestion => this.createLinkType(suggestion.collection));
      return;
    }
  }

  public clearSelection() {
    this.selectedIndex$.next(-1);
  }

  public isSelected(): boolean {
    return this.selectedIndex$.getValue() >= 0;
  }
}

function equalLinkedAttributes(a1: LinkedAttribute, a2: LinkedAttribute): boolean {
  return (
    a1.attribute.id === a2.attribute.id && a1.collection.id === a2.collection.id && a1.linkType.id === a2.linkType.id
  );
}
