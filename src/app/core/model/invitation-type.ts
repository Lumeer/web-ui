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

import {ResourceType} from './resource-type';

export enum InvitationType {
  JoinOnly = 0,
  ReadOnly = 1,
  ReadWrite = 2,
  Manage = 3,
}

export const invitationTypesMap: {[id: number]: InvitationType} = {
  [InvitationType.JoinOnly]: InvitationType.JoinOnly,
  [InvitationType.ReadOnly]: InvitationType.ReadOnly,
  [InvitationType.ReadWrite]: InvitationType.ReadWrite,
  [InvitationType.Manage]: InvitationType.Manage,
};
