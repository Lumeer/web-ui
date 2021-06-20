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

import {Pipe, PipeTransform} from '@angular/core';

import {View} from '../../core/store/views/view';
import {getAllCollectionIdsFromQuery} from '../../core/store/navigation/query/query.util';
import {AllowedPermissions, AllowedPermissionsMap} from '../../core/model/allowed-permissions';
import {LinkType} from '../../core/store/link-types/link.type';
import {RoleType} from '../../core/model/role-type';

@Pipe({
  name: 'viewControlsInfo',
})
export class ViewControlsInfoPipe implements PipeTransform {
  public transform(
    currentView: View,
    projectPermissions: AllowedPermissions,
    collectionsPermissions: AllowedPermissionsMap,
    viewsPermissions: AllowedPermissionsMap,
    linkTypes: LinkType[]
  ): {canClone?: boolean; canShare?: boolean; canSave?: boolean; canConfig?: boolean} {
    if (!currentView || !currentView.code) {
      return {canSave: projectPermissions?.roles?.ViewContribute};
    }

    const hasDirectAccessToView = getAllCollectionIdsFromQuery(currentView.query, linkTypes).every(
      collectionId => collectionsPermissions?.[collectionId]?.roles?.Read
    );

    const viewPermissions = viewsPermissions?.[currentView.id];
    return {
      canClone: hasDirectAccessToView && projectPermissions?.roles?.ViewContribute,
      canSave: viewPermissions?.roles?.PerspectiveConfig || viewPermissions?.roles?.QueryConfig,
      canConfig: viewPermissions?.roles?.PerspectiveConfig,
      canShare: viewPermissions?.roles?.Manage,
    };
  }
}
