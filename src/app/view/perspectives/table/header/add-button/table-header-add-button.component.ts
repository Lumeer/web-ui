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
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {combineLatest, Observable} from 'rxjs';
import {first, map} from 'rxjs/operators';
import {selectCollectionsDictionary} from '../../../../../core/store/collections/collections.state';
import {
  selectCollectionsByReadPermission,
  selectLinkTypesByReadPermission,
} from '../../../../../core/store/common/permissions.selectors';
import {NavigationAction} from '../../../../../core/store/navigation/navigation.action';
import {selectQuery} from '../../../../../core/store/navigation/navigation.state';
import {TableBodyCursor} from '../../../../../core/store/tables/table-cursor';
import {getTableElement} from '../../../../../core/store/tables/table.utils';
import {selectTableLastCollectionId} from '../../../../../core/store/tables/tables.selector';
import {DialogService} from '../../../../../dialog/dialog.service';
import {CollectionModel} from './../../../../../core/store/collections/collection.model';
import {LinkTypeModel} from './../../../../../core/store/link-types/link-type.model';

const ITEMS_LIMIT = 15;

@Component({
  selector: 'table-header-add-button',
  templateUrl: './table-header-add-button.component.html',
  styleUrls: ['./table-header-add-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableHeaderAddButtonComponent implements OnChanges, AfterViewInit {
  @Input()
  public cursor: TableBodyCursor;

  public collections$: Observable<CollectionModel[]>;
  public linkTypes$: Observable<[LinkTypeModel, CollectionModel, CollectionModel][]>;

  constructor(private dialogService: DialogService, private element: ElementRef, private store$: Store<{}>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.cursor && this.cursor) {
      this.bindCollections(this.cursor);
      this.bindLinkTypes(this.cursor);
    }
  }

  private bindCollections(cursor: TableBodyCursor) {
    this.collections$ = combineLatest(
      this.store$.pipe(select(selectCollectionsByReadPermission)),
      this.store$.pipe(select(selectTableLastCollectionId(cursor.tableId)))
    ).pipe(
      map(([collections, lastCollectionId]) => {
        return collections.filter(collection => collection.id !== lastCollectionId).slice(0, ITEMS_LIMIT);
      })
    );
  }

  private bindLinkTypes(cursor: TableBodyCursor) {
    this.linkTypes$ = combineLatest(
      this.store$.pipe(select(selectLinkTypesByReadPermission)),
      this.store$.pipe(select(selectCollectionsDictionary)),
      this.store$.pipe(select(selectQuery)),
      this.store$.pipe(select(selectTableLastCollectionId(cursor.tableId)))
    ).pipe(
      map(([linkTypes, collectionsMap, query, lastCollectionId]) => {
        const linkTypeIds = (query && query.stems && query.stems[0] && query.stems[0].linkTypeIds) || [];
        return linkTypes
          .filter(linkType => !linkTypeIds.includes(linkType.id))
          .filter(linkType => linkType.collectionIds.some(id => id === lastCollectionId))
          .slice(0, ITEMS_LIMIT)
          .map<[LinkTypeModel, CollectionModel, CollectionModel]>(linkType => {
            return [linkType, collectionsMap[linkType.collectionIds[0]], collectionsMap[linkType.collectionIds[1]]];
          });
      })
    );
  }

  public ngAfterViewInit() {
    this.setAddButtonColumnWidth();
  }
  private setAddButtonColumnWidth() {
    const element = this.element.nativeElement as HTMLElement;
    const tableElement = getTableElement(this.cursor.tableId);
    tableElement.style.setProperty('--table-add-button-column-width', `${element.clientWidth}px`);
  }

  public onUseCollection(collection: CollectionModel) {
    this.store$
      .pipe(
        select(selectTableLastCollectionId(this.cursor.tableId)),
        first()
      )
      .subscribe(lastCollectionId => {
        const linkCollectionIds = [lastCollectionId, collection.id].join(',');
        this.dialogService.openCreateLinkDialog(linkCollectionIds, linkType => this.onUseLinkType(linkType));
      });
  }

  public onUseLinkType(linkType: LinkTypeModel) {
    this.store$.dispatch(new NavigationAction.AddLinkToQuery({linkTypeId: linkType.id}));
  }
}
