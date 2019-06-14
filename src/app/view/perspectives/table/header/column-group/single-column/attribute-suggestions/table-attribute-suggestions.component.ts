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

import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {Portal, TemplatePortal} from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {filter, first, map, take, tap} from 'rxjs/operators';
import {AppState} from '../../../../../../../core/store/app.state';
import {Attribute, Collection} from '../../../../../../../core/store/collections/collection';
import {CollectionsAction} from '../../../../../../../core/store/collections/collections.action';
import {
  selectAllCollections,
  selectCollectionsDictionary,
} from '../../../../../../../core/store/collections/collections.state';
import {selectLinkTypesByCollectionId} from '../../../../../../../core/store/common/permissions.selectors';
import {LinkTypeHelper} from '../../../../../../../core/store/link-types/link-type.helper';
import {LinkTypesAction} from '../../../../../../../core/store/link-types/link-types.action';
import {LinkType} from '../../../../../../../core/store/link-types/link.type';
import {NavigationAction} from '../../../../../../../core/store/navigation/navigation.action';
import {selectQuery} from '../../../../../../../core/store/navigation/navigation.state';
import {TableHeaderCursor} from '../../../../../../../core/store/tables/table-cursor';
import {TableModel} from '../../../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../../../core/store/tables/tables.action';
import {selectTableColumn} from '../../../../../../../core/store/tables/tables.selector';
import {DialogService} from '../../../../../../../dialog/dialog.service';
import {Direction} from '../../../../../../../shared/direction';
import {extractAttributeLastName, findAttributeByName} from '../../../../../../../shared/utils/attribute.utils';

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
export class TableAttributeSuggestionsComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input()
  public table: TableModel;

  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public attributeName: string;

  @Input()
  public collection: Collection;

  @Input()
  public linkType: LinkType;

  @Input()
  public origin: ElementRef | HTMLElement;

  @ViewChild('attributeSuggestions', {static: false})
  public attributeSuggestions: TemplateRef<any>;

  public lastName: string;

  public linkedAttributes$: Observable<LinkedAttribute[]>;
  public allAttributes$: Observable<LinkedAttribute[]>;

  public newCount = 0;
  public linkedCount = 0;
  private allCount = 0;

  public selectedIndex$ = new BehaviorSubject(-1);

  private overlayRef: OverlayRef;
  private portal: Portal<any>;

  public constructor(
    private dialogService: DialogService,
    private overlay: Overlay,
    private store$: Store<AppState>,
    private viewContainer: ViewContainerRef
  ) {}

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

  public ngAfterViewInit() {
    this.portal = new TemplatePortal(this.attributeSuggestions, this.viewContainer);
    this.open();
  }

  public open() {
    if (this.overlayRef) {
      return;
    }

    this.overlayRef = this.overlay.create({
      disposeOnNavigation: true,
      panelClass: ['position-absolute', 'w-max-content'],
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.origin)
        .withFlexibleDimensions(false)
        .withViewportMargin(8)
        .withLockedPosition()
        .withPositions([
          {
            originX: 'start',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top',
          },
          {
            originX: 'start',
            originY: 'top',
            overlayX: 'start',
            overlayY: 'bottom',
          },
          {
            originX: 'end',
            originY: 'bottom',
            overlayX: 'end',
            overlayY: 'top',
          },
          {
            originX: 'end',
            originY: 'top',
            overlayX: 'end',
            overlayY: 'bottom',
          },
          {
            originX: 'end',
            originY: 'center',
            overlayX: 'start',
            overlayY: 'center',
          },
          {
            originX: 'start',
            originY: 'center',
            overlayX: 'end',
            overlayY: 'center',
          },
        ]),
    });
    this.overlayRef.attach(this.portal);
  }

  public ngOnDestroy() {
    this.close();
  }

  public close() {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
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
    this.store$
      .pipe(
        select(selectTableColumn(this.cursor)),
        take(1)
      )
      .subscribe(column =>
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
    this.store$.dispatch(new NavigationAction.AddLinkToQuery({linkTypeId: linkType.id}));
  }

  public createLinkType(collection: Collection) {
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
          .filter(linkType => !query.stems[0].linkTypeIds || !query.stems[0].linkTypeIds.includes(linkType.id))
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
      map((collections: Collection[]) =>
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

  private isMatchingAttribute(collection: Collection, attribute: Attribute): boolean {
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
