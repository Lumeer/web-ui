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

import {UserDto} from '../../dto';
import {DefaultWorkspaceModel, UserModel} from './user.model';
import {DefaultWorkspace} from '../../dto/default-workspace';

export class DefaultWorkspaceConverter {
  public static fromDto(dto: DefaultWorkspace): DefaultWorkspaceModel {
    return {
      organizationId: dto.organizationId,
      projectId: dto.projectId,
      organizationCode: dto.organizationCode,
      projectCode: dto.projectCode,
    };
  }

  public static toDto(model: DefaultWorkspaceModel): DefaultWorkspace {
    return {
      organizationId: model.organizationId,
      projectId: model.projectId,
      organizationCode: model.organizationCode,
      projectCode: model.projectCode,
    };
  }
}

export class UserConverter {
  public static fromDto(dto: UserDto): UserModel {
    return {
      id: dto.id,
      name: dto.name,
      email: dto.email,
      groupsMap: dto.groups,
      defaultWorkspace: dto.defaultWorkspace ? DefaultWorkspaceConverter.fromDto(dto.defaultWorkspace) : null,
      agreement: dto.agreement,
      agreementDate: dto.agreementDate ? new Date(dto.agreementDate) : undefined,
      newsletter: dto.newsletter,
    };
  }

  public static toDto(user: Partial<UserModel>): UserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      groups: user.groupsMap,
      agreement: user.agreement,
      newsletter: user.newsletter,
    };
  }
}
