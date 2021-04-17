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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output, OnChanges, SimpleChanges} from '@angular/core';
import {Collection} from '../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {Query} from '../../../../../core/store/navigation/query/query';
import {AttributesResourceType} from '../../../../../core/model/resource';
import {LinkInstancesAction} from '../../../../../core/store/link-instances/link-instances.action';
import {AppState} from '../../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {WORKFLOW_SIDEBAR_SELECTOR} from '../tables/service/workflow-utils';

@Component({
  selector: WORKFLOW_SIDEBAR_SELECTOR,
  templateUrl: './workflow-sidebar.component.html',
  styleUrls: ['./workflow-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowSidebarComponent implements OnChanges {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public query: Query;

  @Output()
  public close = new EventEmitter();

  public readonly collectionResourceType = AttributesResourceType.Collection;

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.document) {
      this.loadLinkInstances(this.document);
    }
  }

  private loadLinkInstances(document: DocumentModel) {
    if (document) {
      const query: Query = {stems: [{collectionId: document.collectionId, documentIds: [document.id]}]};
      this.store$.dispatch(new LinkInstancesAction.Get({query}));
    }
  }

  public onCloseClick() {
    this.close.emit();
  }
}
