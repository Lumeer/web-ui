/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {Collection} from '../../../../core/store/collections/collection';
import {KanbanConfig} from '../../../../core/store/kanbans/kanban';

@Pipe({
  name: 'filterWritableCollections',
})
export class FilterWritableCollectionsPipe implements PipeTransform {
  public transform(
    collections: Collection[],
    permissions: Record<string, AllowedPermissions>,
    config: KanbanConfig
  ): Collection[] {
    const selectedCollectionsIds = Object.entries(config.collections || {})
      .filter(([, collectionConfig]) => collectionConfig && !!collectionConfig.attribute)
      .map(([collectionId]) => collectionId);

    return (collections || []).filter(collection => {
      const permission = permissions[collection.id];
      return permission && permission.writeWithView && selectedCollectionsIds.includes(collection.id);
    });
  }
}
