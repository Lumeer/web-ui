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
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {filter, first, map, switchMap, take, tap} from 'rxjs/operators';
import {AppState} from '../../../../../../../core/store/app.state';
import {Attribute, Collection} from '../../../../../../../core/store/collections/collection';
import {CollectionsAction} from '../../../../../../../core/store/collections/collections.action';
import {
  selectAllCollections,
  selectCollectionsDictionary,
} from '../../../../../../../core/store/collections/collections.state';
import {selectLinkTypesByViewAndCollectionId} from '../../../../../../../core/store/common/permissions.selectors';
import {LinkTypeHelper} from '../../../../../../../core/store/link-types/link-type.helper';
import {LinkTypesAction} from '../../../../../../../core/store/link-types/link-types.action';
import {LinkType} from '../../../../../../../core/store/link-types/link.type';
import {NavigationAction} from '../../../../../../../core/store/navigation/navigation.action';
import {TableHeaderCursor} from '../../../../../../../core/store/tables/table-cursor';
import {TableModel} from '../../../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../../../core/store/tables/tables.action';
import {selectTableById, selectTableColumn} from '../../../../../../../core/store/tables/tables.selector';
import {Direction} from '../../../../../../../shared/direction';
import {DropdownPosition} from '../../../../../../../shared/dropdown/dropdown-position';
import {DropdownComponent} from '../../../../../../../shared/dropdown/dropdown.component';
import {extractAttributeLastName, findAttributeByName} from '../../../../../../../shared/utils/attribute.utils';
import {ModalService} from '../../../../../../../shared/modal/modal.service';
import {View} from '../../../../../../../core/store/views/view';
import {Query} from '../../../../../../../core/store/navigation/query/query';

interface LinkedAttribute {
  linkType?: LinkType;
  collection: Collection;
  attribute: Attribute;
}

const MAX_SUGGESTIONS_COUNT = 5;

@Component({
  selector: 'table-attribute-suggestions',
  templateUrl: './table-attribute-suggestions.component.html',
  styleUrls: ['./table-attribute-suggestions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableAttributeSuggestionsComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public attributeName: string;

  @Input()
  public collection: Collection;

  @Input()
  public linkType: LinkType;

  @Input()
  public view: View;

  @Input()
  public query: Query;

  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public embedded: boolean;

  @Output()
  public selected = new EventEmitter();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  public readonly dropdownPositions = [
    DropdownPosition.BottomStart,
    DropdownPosition.TopStart,
    DropdownPosition.BottomEnd,
    DropdownPosition.TopEnd,
    DropdownPosition.Right,
    DropdownPosition.Left,
  ];

  private collection$ = new BehaviorSubject<Collection>(null);
  private cursor$ = new BehaviorSubject<TableHeaderCursor>(null);

  public lastName$ = new BehaviorSubject('');

  public linkedAttributes$: Observable<LinkedAttribute[]>;
  public allAttributes$: Observable<LinkedAttribute[]>;
  public table$: Observable<TableModel>;

  public newCount = 0;
  public linkedCount = 0;
  private allCount = 0;

  public selectedIndex$ = new BehaviorSubject(-1);

  public constructor(
    private modalService: ModalService,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.allAttributes$ = this.bindAllAttributes();
    this.table$ = this.bindTable();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attributeName) {
      this.lastName$.next(extractAttributeLastName(this.attributeName));
    }
    if (changes.collection && this.collection) {
      // TODO add support for nested attributes
      this.newCount = Number(!findAttributeByName(this.collection.attributes, this.attributeName));
      this.collection$.next(this.collection);
    }
    if (changes.cursor && this.cursor) {
      this.cursor$.next(this.cursor);
    }
    if (changes.query || changes.view) {
      this.linkedAttributes$ = this.bindLinkedAttributes();
    }
  }

  public ngAfterViewInit() {
    this.open();
  }

  public open() {
    if (this.dropdown) {
      this.dropdown.open();
    }
  }

  public ngOnDestroy() {
    this.close();
  }

  public close() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }

  public onUseAttribute() {
    this.selected.emit();
    this.createAttribute();
  }

  public createAttribute() {
    const attribute: Attribute = {
      name: this.attributeName,
    };
    this.renameUninitializedTableColumn(attribute);
    if (this.collection) {
      this.createCollectionAttribute(attribute);
    } else if (this.linkType) {
      this.createLinkTypeAttribute(attribute);
    }
    this.close();
  }

  private createCollectionAttribute(attribute: Attribute) {
    this.store$.dispatch(
      new CollectionsAction.CreateAttributes({
        collectionId: this.collection.id,
        attributes: [attribute],
      })
    );
  }

  private createLinkTypeAttribute(attribute: Attribute) {
    this.store$.dispatch(
      new LinkTypesAction.CreateAttributes({
        linkTypeId: this.linkType.id,
        attributes: [attribute],
      })
    );
  }

  private renameUninitializedTableColumn(attribute: Attribute) {
    this.store$.pipe(select(selectTableColumn(this.cursor)), take(1)).subscribe(column =>
      this.store$.dispatch(
        new TablesAction.ReplaceColumns({
          cursor: this.cursor,
          deleteCount: 1,
          columns: [{...column, attributeName: extractAttributeLastName(attribute.name)}],
        })
      )
    );
  }

  public useLinkType(linkType: LinkType) {
    this.selected.emit();
    this.store$.dispatch(new NavigationAction.AddLinkToQuery({linkTypeId: linkType.id}));
    this.close();
  }

  public createLinkType(collection: Collection) {
    this.selected.emit();
    this.store$.dispatch(new TablesAction.SetCursor({cursor: null}));
    this.modalService.showCreateLink([this.collection?.id, collection.id], null, linkType =>
      this.useLinkType(linkType)
    );
    this.close();
  }

  public bindLinkedAttributes(): Observable<LinkedAttribute[]> {
    return combineLatest([this.collection$, this.lastName$]).pipe(
      filter(([collection]) => !!collection),
      switchMap(([collection, lastName]) =>
        combineLatest([
          this.store$.select(selectLinkTypesByViewAndCollectionId(this.view, collection.id)),
          this.store$.select(selectCollectionsDictionary),
        ]).pipe(
          map(([linkTypes, collectionsMap]) =>
            linkTypes
              .filter(
                linkType =>
                  !this.query?.stems?.[0]?.linkTypeIds || !this.query.stems[0].linkTypeIds.includes(linkType.id)
              )
              .reduce<LinkedAttribute[]>((filtered, linkType) => {
                if (filtered.length >= MAX_SUGGESTIONS_COUNT) {
                  return filtered.slice(0, 5);
                }

                const collectionId = LinkTypeHelper.getOtherCollectionId(linkType, collection.id);
                const otherCollection = collectionsMap[collectionId];

                return filtered.concat(
                  otherCollection.attributes
                    .filter(attribute => isMatchingAttribute(lastName, otherCollection, attribute))
                    .map(attribute => ({linkType, collection: otherCollection, attribute}))
                    .filter(newAttribute =>
                      filtered.every(existingAttribute => !equalLinkedAttributes(newAttribute, existingAttribute))
                    )
                );
              }, [])
          ),
          tap(suggestions => (this.linkedCount = suggestions.length))
        )
      )
    );
  }

  public bindAllAttributes(): Observable<LinkedAttribute[]> {
    return combineLatest([this.store$.pipe(select(selectAllCollections)), this.lastName$]).pipe(
      map(([collections, lastName]) =>
        collections.reduce<LinkedAttribute[]>((filtered, collection) => {
          if (filtered.length >= MAX_SUGGESTIONS_COUNT) {
            return filtered.slice(0, 5);
          }

          return filtered.concat(
            collection.attributes
              .filter(attribute => isMatchingAttribute(lastName, collection, attribute))
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

  private bindTable(): Observable<TableModel> {
    return this.cursor$.pipe(
      filter(cursor => !!cursor),
      switchMap(cursor => this.store$.pipe(select(selectTableById(cursor.tableId))))
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

function isMatchingAttribute(lastName: string, collection: Collection, attribute: Attribute): boolean {
  return (
    lastName &&
    (attribute.name.toLowerCase().startsWith(lastName.toLowerCase()) ||
      collection.name.toLowerCase().startsWith(lastName.toLowerCase()))
  );
}
