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
import {CollectionPermissionsPipe} from '../../pipes/permissions/collection-permissions.pipe';
import {selectViewQuery} from '../../../core/store/views/views.state';
import {selectLinkTypesByCollectionId} from '../../../core/store/common/permissions.selectors';
import {selectCollectionsDictionary} from '../../../core/store/collections/collections.state';
import {distinctUntilChanged, map, mergeMap, tap} from 'rxjs/operators';
import {getOtherLinkedCollectionId, mapLinkTypeCollections} from '../../utils/link-type.utils';
import {deepObjectsEquals} from '../../utils/common.utils';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';

@Component({
  selector: 'links-accordeon',
  templateUrl: './links-accordeon.component.html',
  styleUrls: ['./links-accordeon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksAccordeonComponent implements OnChanges, OnInit {
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

  public selectedLinkType$ = new BehaviorSubject<LinkType>(null);

  public linkTypes$: Observable<LinkType[]>;
  public otherCollection$: Observable<Collection>;
  public permissions$: Observable<AllowedPermissions>;
  public query$: Observable<Query>;

  public openedGroups$ = new BehaviorSubject<boolean[]>([]);

  public constructor(private store$: Store<AppState>, private collectionPermissionsPipe: CollectionPermissionsPipe) {}

  public ngOnInit() {
    this.query$ = this.store$.pipe(select(selectViewQuery));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.objectChanged(changes.collection)) {
      this.renewSubscriptions();
    }
    if (this.objectChanged(changes.document)) {
      this.selectedLinkType$.value && this.selectOtherCollection(this.selectedLinkType$.value);
    }
  }

  public isOpenChanged(index: number) {
    const opened = this.openedGroups$.getValue();
    opened[index] = !opened[index];
    this.openedGroups$.next(opened);
  }

  private renewSubscriptions() {
    this.linkTypes$ = combineLatest([
      this.store$.pipe(select(selectLinkTypesByCollectionId(this.collection.id))),
      this.store$.pipe(select(selectCollectionsDictionary)),
    ]).pipe(
      tap(([linkTypes]) => this.openedGroups$.next(new Array(linkTypes.length))),
      map(([linkTypes, collectionsMap]) => linkTypes.map(linkType => mapLinkTypeCollections(linkType, collectionsMap))),
      tap(linkTypes => this.initActiveLinkType(linkTypes))
    );
  }

  private objectChanged(change: SimpleChange): boolean {
    return change && (!change.previousValue || change.previousValue.id !== change.currentValue?.id);
  }

  private initActiveLinkType(linkTypes: LinkType[]) {
    let selectLinkType: LinkType;
    if (this.selectedLinkType$.value) {
      selectLinkType = linkTypes.find(linkType => linkType.id === this.selectedLinkType$.value.id);
    }

    this.onSelectLink(selectLinkType || linkTypes[0]);
  }

  public onSelectLink(linkType: LinkType) {
    this.selectedLinkType$.next(linkType);
    this.selectOtherCollection(linkType);

    if (linkType) {
      this.readData(linkType);
    }
  }

  private selectOtherCollection(linkType: LinkType) {
    this.otherCollection$ = this.store$.pipe(
      select(selectCollectionsDictionary),
      map(collectionsMap => {
        const collectionId = getOtherLinkedCollectionId(linkType, this.document?.collectionId);
        return collectionId && collectionsMap[collectionId];
      })
    );
    this.permissions$ = this.otherCollection$.pipe(
      mergeMap(collection => this.collectionPermissionsPipe.transform(collection)),
      distinctUntilChanged((a, b) => deepObjectsEquals(a, b))
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

  public unLinkDocument(linkInstance: LinkInstance) {
    this.store$.dispatch(new LinkInstancesAction.Delete({linkInstanceId: linkInstance.id}));
  }

  public onSelectDocument(data: {collection: Collection; document: DocumentModel}) {
    this.documentSelect.emit(data);
  }
}
