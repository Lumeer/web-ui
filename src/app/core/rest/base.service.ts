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

import {Injectable} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState} from '../store/app.state';
import {selectWorkspaceWithIds} from '../store/common/common.selectors';
import {filter} from 'rxjs/operators';
import {Workspace} from '../store/navigation/workspace';

@Injectable()
export class BaseService {
  protected workspace: Workspace = {};

  constructor(protected store$: Store<AppState>) {
    this.store$
      .pipe(
        select(selectWorkspaceWithIds),
        filter(workspace => !!workspace && !!workspace.organizationCode)
      )
      .subscribe(workspace => (this.workspace = workspace));
  }

  protected getOrCurrentOrganizationId(workspace?: Workspace): string {
    if (workspace && workspace.organizationId) {
      return workspace.organizationId;
    }

    return this.workspace.organizationId;
  }

  protected getOrCurrentProjectId(workspace?: Workspace): string {
    if (workspace && workspace.projectId) {
      return workspace.projectId;
    }

    return this.workspace.projectId;
  }

  protected getOrCurrentCollectionId(workspace?: Workspace): string {
    if (workspace && workspace.collectionId) {
      return workspace.collectionId;
    }

    return this.workspace.collectionId;
  }

  protected getOrCurrentViewId(workspace?: Workspace): string {
    if (workspace && workspace.viewId) {
      return workspace.viewId;
    }

    return this.workspace.viewId;
  }
}
