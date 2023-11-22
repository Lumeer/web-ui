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
import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Router} from '@angular/router';

import {Collection} from '../../../../../core/store/collections/collection';
import {Query} from '../../../../../core/store/navigation/query/query';
import {convertQueryModelToString} from '../../../../../core/store/navigation/query/query.converter';
import {createCollectionQueryStem} from '../../../../../core/store/navigation/query/query.util';
import {Workspace} from '../../../../../core/store/navigation/workspace';
import {Perspective} from '../../../../../view/perspectives/perspective';

@Component({
  selector: '[link-type-collection]',
  templateUrl: './link-type-collection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkTypeCollectionComponent {
  @Input()
  public collection: Collection;

  @Input()
  public workspace: Workspace;

  constructor(private router: Router) {}

  public onDocumentsClick() {
    this.router.navigate([this.workspacePath(), 'view', Perspective.Table], {
      queryParams: {q: this.documentsQuery(this.collection.id)},
    });
  }

  private documentsQuery(collectionId: string): string {
    const query: Query = {stems: [createCollectionQueryStem(collectionId)]};
    return convertQueryModelToString(query);
  }

  private workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }
}
