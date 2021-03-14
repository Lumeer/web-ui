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
import {selectCurrentUserForWorkspace} from '../store/users/users.state';
import {combineLatest, Subscription} from 'rxjs';
import {selectWorkspaceModels} from '../store/common/common.selectors';
import {User} from '../store/users/user';
import {Organization} from '../store/organizations/organization';
import {Project} from '../store/projects/project';
import {
  managePermissions,
  userIsManagerInWorkspace,
  userPermissionsInCollectionByView,
  userPermissionsInResource,
} from '../../shared/utils/resource.utils';
import {AllowedPermissions, mergeAllowedPermissions} from '../model/allowed-permissions';
import {UserPermissionsAction} from '../store/user-permissions/user-permissions.action';
import {selectAllViews, selectCurrentView} from '../store/views/views.state';
import {selectAllCollections} from '../store/collections/collections.state';
import {selectAllLinkTypes} from '../store/link-types/link-types.state';
import {getAllCollectionIdsFromQuery} from '../store/navigation/query/query.util';
import {AppState} from '../store/app.state';

@Injectable()
export class PermissionsCheckService {
  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>) {}

  public init(): Promise<boolean> {
    combineLatest([
      this.store$.pipe(select(selectCurrentUserForWorkspace)),
      this.store$.pipe(select(selectWorkspaceModels)),
    ]).subscribe(([currentUser, {organization, project}]) => {
      this.subscriptions.unsubscribe();
      this.subscriptions = new Subscription();
      this.checkWorkspacePermissions(currentUser, organization, project);
      this.subscriptions.add(this.checkResourcesPermissions(currentUser, organization, project));
      this.subscriptions.add(this.checkViewsPermissions(currentUser, organization, project));
    });
    return Promise.resolve(true);
  }

  private checkWorkspacePermissions(currentUser: User, organization: Organization, project: Project) {
    const isManager = userIsManagerInWorkspace(currentUser, organization, project);
    const organizationPermissions = userPermissionsInResource(currentUser, organization);
    this.store$.dispatch(new UserPermissionsAction.SetOrganizationPermissions({permissions: organizationPermissions}));

    const projectPermissions: AllowedPermissions = isManager
      ? managePermissions()
      : userPermissionsInResource(currentUser, project);
    this.store$.dispatch(new UserPermissionsAction.SetProjectPermissions({permissions: projectPermissions}));
  }

  private checkResourcesPermissions(currentUser: User, organization: Organization, project: Project): Subscription {
    const isManager = userIsManagerInWorkspace(currentUser, organization, project);
    return combineLatest([
      this.store$.pipe(select(selectCurrentView)),
      this.store$.pipe(select(selectAllCollections)),
      this.store$.pipe(select(selectAllLinkTypes)),
    ]).subscribe(([currentView, collections, linkTypes]) => {
      const permissions = (collections || []).reduce((map, collection) => {
        if (isManager) {
          return {...map, [collection.id]: managePermissions()};
        } else if (currentView) {
          const collectionIdsInView = getAllCollectionIdsFromQuery(currentView.query, linkTypes);
          const collectionPermissions = userPermissionsInResource(currentUser, collection);

          const viewAllowedPermissions = collectionIdsInView.includes(collection.id)
            ? userPermissionsInCollectionByView(currentUser, currentView, collection)
            : {};

          return {
            ...map,
            [collection.id]: {
              ...collectionPermissions,
              readWithView: viewAllowedPermissions.readWithView || collectionPermissions.read,
              writeWithView: viewAllowedPermissions.writeWithView || collectionPermissions.write,
              manageWithView: viewAllowedPermissions.manageWithView || collectionPermissions.manage,
            },
          };
        } else {
          return {...map, [collection.id]: userPermissionsInResource(currentUser, collection)};
        }
      }, {});
      this.store$.dispatch(new UserPermissionsAction.SetCollectionsPermissions({permissions}));

      const linkTypePermissions = (linkTypes || []).reduce(
        (map, linkType) => ({
          ...map,
          [linkType.id]: mergeAllowedPermissions(
            permissions[linkType.collectionIds?.[0]],
            permissions[linkType.collectionIds?.[1]]
          ),
        }),
        {}
      );
      this.store$.dispatch(new UserPermissionsAction.SetLinkTypesPermissions({permissions: linkTypePermissions}));
    });
  }

  private checkViewsPermissions(currentUser: User, organization: Organization, project: Project): Subscription {
    const isManager = userIsManagerInWorkspace(currentUser, organization, project);
    return this.store$.pipe(select(selectAllViews)).subscribe(views => {
      const permissions = (views || []).reduce(
        (map, view) => ({
          ...map,
          [view.id]: isManager ? managePermissions() : userPermissionsInResource(currentUser, view),
        }),
        {}
      );
      this.store$.dispatch(new UserPermissionsAction.SetViewsPermissions({permissions}));
    });
  }
}
