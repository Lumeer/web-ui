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
import {AttributesResource, AttributesResourceType} from '../../../../../../../../core/model/resource';
import {Workspace} from '../../../../../../../../core/store/navigation/workspace';
import {getAttributesResourceType} from '../../../../../../../utils/resource.utils';
import {LinkType} from '../../../../../../../../core/store/link-types/link.type';

@Pipe({
  name: 'collectionSettingsPath',
})
export class CollectionSettingsPathPipe implements PipeTransform {
  public transform(resource: AttributesResource, workspace: Workspace): any[] {
    if (getAttributesResourceType(resource) === AttributesResourceType.LinkType) {
      const collectionId = (<LinkType>resource).collectionIds.find(collId => !!collId);
      return ['o', workspace?.organizationCode, 'p', workspace?.projectCode, 'c', collectionId, 'linktypes'];
    }
    return ['o', workspace?.organizationCode, 'p', workspace?.projectCode, 'c', resource.id, 'rules'];
  }
}
