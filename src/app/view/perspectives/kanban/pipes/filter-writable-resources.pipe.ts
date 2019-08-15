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
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {Collection} from '../../../../core/store/collections/collection';
import {KanbanConfig} from '../../../../core/store/kanbans/kanban';
import {KanbanResourceCreate} from '../columns/column/footer/kanban-column-footer.component';

@Pipe({
  name: 'filterWritableResources',
})
export class FilterWritableResourcesPipe implements PipeTransform {
  public transform(
    kanbanConfig: KanbanConfig,
    collections: Collection[],
    permissions: Record<string, AllowedPermissions>
  ): KanbanResourceCreate[] {
    const allowedResources = (kanbanConfig.stemsConfigs || []).reduce<KanbanResourceCreate[]>((arr, config) => {
      if (config && config.attribute) {
        const resource = (collections || []).find(coll => coll.id === config.attribute.resourceId);
        if (resource) {
          arr.push({stem: config.stem, kanbanAttribute: config.attribute, resource});
        }
      }

      return arr;
    }, []);

    return allowedResources.filter(resourceCreate => {
      const permission = permissions[resourceCreate.resource.id];
      return permission && permission.writeWithView;
    });
  }
}
