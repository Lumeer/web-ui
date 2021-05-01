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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {AttributesSettings} from '../../../core/store/views/view';
import {Observable} from 'rxjs';
import {LinkType} from '../../../core/store/link-types/link.type';
import {AllowedPermissionsMap} from '../../../core/model/allowed-permissions';
import {Query} from '../../../core/store/navigation/query/query';
import {Action, select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectViewQuery} from '../../../core/store/views/views.state';
import {selectAllCollections} from '../../../core/store/collections/collections.state';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {preventEvent} from '../../utils/common.utils';

@Component({
  selector: 'links-accordeon',
  templateUrl: './links-accordeon.component.html',
  styleUrls: ['./links-accordeon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksAccordeonComponent implements OnInit {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public permissions: AllowedPermissionsMap;

  @Input()
  public preventEventBubble: boolean;

  @Input()
  public allowSelectDocument = true;

  @Input()
  public collapsedLinkTypes: string[];

  @Input()
  public attributesSettings: AttributesSettings;

  @Output()
  public documentSelect = new EventEmitter<{collection: Collection; document: DocumentModel}>();

  @Output()
  public hideLink = new EventEmitter<string>();

  @Output()
  public showLink = new EventEmitter<string>();

  @Output()
  public unlink = new EventEmitter<LinkInstance>();

  @Output()
  public patchDocumentData = new EventEmitter<DocumentModel>();

  @Output()
  public patchLinkData = new EventEmitter<LinkInstance>();

  @Output()
  public createDocumentWithLink = new EventEmitter<{document: DocumentModel; linkInstance: LinkInstance}>();

  @Output()
  public updateLink = new EventEmitter<{linkInstance: LinkInstance; nextAction?: Action}>();

  @Output()
  public createLink = new EventEmitter<{linkInstance: LinkInstance}>();

  @Output()
  public attributesSettingsChanged = new EventEmitter<AttributesSettings>();

  @Output()
  public attributeFunction = new EventEmitter<{collectionId: string; linkTypeId: string; attributeId: string}>();

  @Output()
  public attributeDescription = new EventEmitter<{collectionId: string; linkTypeId: string; attributeId: string}>();

  @Output()
  public attributeType = new EventEmitter<{collectionId: string; linkTypeId: string; attributeId: string}>();

  @Output()
  public modifyLinks = new EventEmitter<{collectionId: string; linkTypeId: string; documentId: string}>();

  public collections$: Observable<Collection[]>;
  public query$: Observable<Query>;

  public constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.query$ = this.store$.pipe(select(selectViewQuery));
    this.collections$ = this.store$.pipe(select(selectAllCollections));
  }

  public onSetLinks(event: MouseEvent, linkType: LinkType) {
    preventEvent(event);

    if (this.collection && this.document) {
      this.modifyLinks.emit({collectionId: this.collection.id, linkTypeId: linkType.id, documentId: this.document.id});
    }
  }

  public isOpenChanged(opened: boolean, id: string) {
    if (opened) {
      this.showLink.emit(id);
    } else {
      this.hideLink.emit(id);
    }
  }

  public unLinkDocument(linkInstance: LinkInstance) {
    this.unlink.emit(linkInstance);
  }

  public onSelectDocument(data: {collection: Collection; document: DocumentModel}) {
    this.documentSelect.emit(data);
  }

  public trackById(index: number, linkType: LinkType): string {
    return linkType.id;
  }
}
