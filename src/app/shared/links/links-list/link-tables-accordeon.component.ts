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
  SimpleChanges,
} from '@angular/core';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {AttributesSettings} from '../../../core/store/views/view';
import {Observable, of} from 'rxjs';
import {LinkType} from '../../../core/store/link-types/link.type';
import {ResourcesPermissions} from '../../../core/model/allowed-permissions';
import {Query} from '../../../core/store/navigation/query/query';
import {Action, select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectViewQuery} from '../../../core/store/views/views.state';
import {selectCollectionsByIds} from '../../../core/store/collections/collections.state';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {objectChanged} from '../../utils/common.utils';
import {selectDocumentsByIds} from '../../../core/store/documents/documents.state';
import {groupDocumentsByCollection} from '../../../core/store/documents/document.utils';
import {map, switchMap} from 'rxjs/operators';
import {selectLinkInstanceById} from '../../../core/store/link-instances/link-instances.state';
import {ConstraintData} from '@lumeer/data-filters';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';

@Component({
  selector: 'link-tables-accordeon',
  templateUrl: './link-tables-accordeon.component.html',
  styleUrls: ['./links-accordeon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkTablesAccordeonComponent implements OnInit, OnChanges {
  @Input()
  public linkType: LinkType;

  @Input()
  public linkInstance: LinkInstance;

  @Input()
  public permissions: ResourcesPermissions;

  @Input()
  public preventEventBubble: boolean;

  @Input()
  public allowSelectDocument = true;

  @Input()
  public collapsedCollections: string[];

  @Input()
  public attributesSettings: AttributesSettings;

  @Input()
  public viewId: string;

  @Output()
  public documentSelect = new EventEmitter<{collection: Collection; document: DocumentModel}>();

  @Output()
  public hideCollection = new EventEmitter<string>();

  @Output()
  public showCollection = new EventEmitter<string>();

  @Output()
  public patchDocumentData = new EventEmitter<DocumentModel>();

  @Output()
  public attributesSettingsChanged = new EventEmitter<AttributesSettings>();

  @Output()
  public attributeFunction = new EventEmitter<{collectionId: string; linkTypeId: string; attributeId: string}>();

  @Output()
  public attributeDescription = new EventEmitter<{collectionId: string; linkTypeId: string; attributeId: string}>();

  @Output()
  public attributeType = new EventEmitter<{collectionId: string; linkTypeId: string; attributeId: string}>();

  @Output()
  public updateLink = new EventEmitter<{linkInstance: LinkInstance; nextAction?: Action}>();

  @Output()
  public createLink = new EventEmitter<{linkInstance: LinkInstance}>();

  public collections$: Observable<Collection[]>;
  public constraintData$: Observable<ConstraintData>;
  public documentByCollectionMap$: Observable<Record<string, DocumentModel>>;
  public query$: Observable<Query>;

  public constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.query$ = this.store$.pipe(select(selectViewQuery));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (objectChanged(changes.linkType) || objectChanged(changes.linkInstance)) {
      this.subscribeCollections();
    }
  }

  public subscribeCollections() {
    if (this.linkType && this.linkInstance) {
      this.collections$ = this.store$.pipe(select(selectCollectionsByIds(this.linkType.collectionIds)));
      this.documentByCollectionMap$ = this.store$.pipe(
        select(selectLinkInstanceById(this.linkInstance?.id)),
        switchMap(linkInstance => this.store$.pipe(select(selectDocumentsByIds(linkInstance.documentIds)))),
        map(documents => groupDocumentsByCollection(documents)),
        // we know that there is only one document per collection
        map(documentsMap =>
          Object.keys(documentsMap).reduce(
            (resultMap, collectionId) => ({
              ...resultMap,
              [collectionId]: documentsMap[collectionId]?.[0],
            }),
            {}
          )
        )
      );
    } else {
      this.collections$ = of([]);
      this.documentByCollectionMap$ = of({});
    }
  }

  public isOpenChanged(opened: boolean, id: string) {
    if (opened) {
      this.showCollection.emit(id);
    } else {
      this.hideCollection.emit(id);
    }
  }

  public onSelectDocument(data: {collection: Collection; document: DocumentModel}) {
    this.documentSelect.emit(data);
  }

  public trackById(index: number, collection: Collection): string {
    return collection.id;
  }
}
