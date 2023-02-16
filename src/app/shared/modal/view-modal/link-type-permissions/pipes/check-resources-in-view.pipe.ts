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
import {View} from '../../../../../core/store/views/view';
import {AttributesResourceType} from '../../../../../core/model/resource';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {isResourceInQuery} from '../../../../../core/store/navigation/query/query.util';
import {ResourcePermissionType} from '../../../../../core/model/resource-permission-type';

@Pipe({
  name: 'checkResourcesInView',
})
export class CheckResourcesInViewPipe implements PipeTransform {
  public transform(
    view: View,
    collectionId: string,
    linkTypeId: string,
    linkTypes: LinkType[]
  ): Record<ResourcePermissionType, View> {
    return {
      [ResourcePermissionType.ViewCollection]: isResourceInQuery(
        view?.query,
        collectionId,
        AttributesResourceType.Collection,
        linkTypes
      )
        ? view
        : {...view, permissions: undefined},
      [ResourcePermissionType.ViewLinkType]: isResourceInQuery(
        view?.query,
        linkTypeId,
        AttributesResourceType.LinkType,
        linkTypes
      )
        ? view
        : {...view, permissions: undefined},
    } as Record<ResourcePermissionType, View>;
  }
}
