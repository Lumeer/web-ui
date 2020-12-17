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
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {ViewSettings} from '../../../core/store/views/view';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {LinkType} from '../../../core/store/link-types/link.type';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {Query} from '../../../core/store/navigation/query/query';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectViewQuery} from '../../../core/store/views/views.state';
import {selectAllCollections, selectCollectionsDictionary} from '../../../core/store/collections/collections.state';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {map, tap} from 'rxjs/operators';
import {selectLinkTypesByCollectionId} from '../../../core/store/common/permissions.selectors';
import {getOtherLinkedCollectionId, mapLinkTypeCollections} from '../../utils/link-type.utils';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {forEach} from '@angular-devkit/schematics';
import {selectCollectionsPermissions} from '../../../core/store/user-permissions/user-permissions.state';

@Component({
  selector: 'links-accordeon',
  templateUrl: './links-accordeon.component.html',
  styleUrls: ['./links-accordeon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksAccordeonComponent implements OnInit, OnChanges {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public preventEventBubble: boolean;

  @Input()
  public ignoreSettingsOnReadPermission: boolean;

  @Input()
  public allowSelectDocument = true;

  @Input()
  public viewSettings: ViewSettings;

  @Output()
  public documentSelect = new EventEmitter<{collection: Collection; document: DocumentModel}>();

  public linkTypes$: Observable<LinkType[]>;
  public collections$: Observable<Collection[]>;
  public permissions$: Observable<Record<string, AllowedPermissions>>;
  public query$: Observable<Query>;

  public openedGroups$ = new BehaviorSubject<Record<string, boolean>>({});

  public constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.query$ = this.store$.pipe(select(selectViewQuery));
    this.collections$ = this.store$.pipe(select(selectAllCollections));
    this.permissions$ = this.store$.pipe(select(selectCollectionsPermissions));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (
      changes.collection &&
      (!changes.collection.previousValue || changes.collection.currentValue?.id !== this.collection?.id)
    ) {
      this.renewSubscriptions();
    }
  }

  private renewSubscriptions() {
    this.linkTypes$ = combineLatest([
      this.store$.pipe(select(selectLinkTypesByCollectionId(this.collection.id))),
      this.store$.pipe(select(selectCollectionsDictionary)),
    ]).pipe(
      tap(([linkTypes]) => {
        if (linkTypes.length > 0 && !this.openedGroups$.getValue()[linkTypes[0].id]) {
          this.isOpenChanged(true, linkTypes[0].id);
        }
      }),
      map(([linkTypes, collectionsMap]) => linkTypes.map(linkType => mapLinkTypeCollections(linkType, collectionsMap))),
      tap(linkTypes => linkTypes.map(linkType => this.readData(linkType)))
    );
  }

  private readData(linkType: LinkType) {
    if (linkType) {
      const otherCollectionId = getOtherLinkedCollectionId(linkType, this.collection.id);
      const documentsQuery: Query = {stems: [{collectionId: otherCollectionId}]};
      this.store$.dispatch(new DocumentsAction.Get({query: documentsQuery}));
      const query: Query = {stems: [{collectionId: this.collection.id, linkTypeIds: [linkType.id]}]};
      this.store$.dispatch(new LinkInstancesAction.Get({query}));
    }
  }

  public isOpenChanged(state: boolean, index: string) {
    const opened = {...this.openedGroups$.getValue()};
    opened[index] = state;
    this.openedGroups$.next(opened);
  }

  public unLinkDocument(linkInstance: LinkInstance) {
    this.store$.dispatch(new LinkInstancesAction.Delete({linkInstanceId: linkInstance.id}));
  }

  public onSelectDocument(data: {collection: Collection; document: DocumentModel}) {
    this.documentSelect.emit(data);
  }

  public trackById(index: number, linkType: LinkType): string {
    return linkType.id;
  }
}
