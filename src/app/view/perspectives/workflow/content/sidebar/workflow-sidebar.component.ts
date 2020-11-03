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

import {Component, ChangeDetectionStrategy, Input} from '@angular/core';
import {Collection} from '../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {ViewSettings} from '../../../../../core/store/views/view';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {Query} from '../../../../../core/store/navigation/query/query';
import {AttributesResourceType} from '../../../../../core/model/resource';

@Component({
  selector: 'workflow-sidebar',
  templateUrl: './workflow-sidebar.component.html',
  styleUrls: ['./workflow-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowSidebarComponent {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public query: Query;

  @Input()
  public viewSettings: ViewSettings;

  public readonly collectionResourceType = AttributesResourceType.Collection;
}
