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
import {AllowedPermissions} from '../../core/model/allowed-permissions';
import {LinkType} from '../../core/store/link-types/link.type';

@Pipe({
  name: 'viewControlsInfo',
})
export class ViewControlsInfoPipe implements PipeTransform {
  public transform(
    currentView: View,
    projectPermissions: AllowedPermissions,
    collectionsPermissions: Record<string, AllowedPermissions>,
    viewsPermissions: Record<string, AllowedPermissions>,
    linkTypes: LinkType[]
  ): {canClone: boolean; canManage: boolean; canShare: boolean} {
    if (!currentView || !currentView.code) {
      return {canClone: false, canManage: projectPermissions?.write, canShare: false};
    }

    if (projectPermissions?.manage) {
      return {canClone: true, canManage: true, canShare: true};
    }

    const hasDirectAccessToView = getAllCollectionIdsFromQuery(currentView.query, linkTypes).every(
      collectionId => collectionsPermissions?.[collectionId]?.read
    );

    const viewPermissions = viewsPermissions?.[currentView.id];
    return {
      canClone: hasDirectAccessToView && projectPermissions?.write,
      canManage: viewPermissions?.manage,
      canShare: viewPermissions?.share,
    };
  }
}
