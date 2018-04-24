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

import {perspectivesMap} from '../../../view/perspectives/perspective';
import {View} from '../../dto/view';
import {QueryConverter} from '../navigation/query.converter';
import {ViewModel} from './view.model';
import {PermissionsConverter} from '../permissions/permissions.converter';

export class ViewConverter {

  public static convertToModel(dto: View): ViewModel {
    return {
      code: dto.code,
      name: dto.name,
      description: dto.description,
      query: QueryConverter.fromDto(dto.query),
      perspective: perspectivesMap[dto.perspective],
      config: dto.config,
      permissions: PermissionsConverter.fromDto(dto.permissions)
    };
  }

  public static convertToDto(model: ViewModel): View {
    return {
      code: model.code,
      name: model.name,
      query: QueryConverter.toDto(model.query),
      perspective: model.perspective,
      config: model.config,
      description: model.description
    };
  }

}
