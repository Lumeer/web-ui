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

import {Constraint, ConstraintType} from '../../model/data/constraint';
import {QueryStem} from '../navigation/query/query';
import {AttributesResourceType} from '../../model/resource';

export const DEFAULT_KANBAN_ID = 'default';

export interface Kanban {
  id: string;
  config?: KanbanConfig;
}

export interface KanbanConfig {
  columns: KanbanColumn[];
  otherColumn?: KanbanColumn;
  stemsConfigs: KanbanStemConfig[];
  version?: KanbanConfigVersion;
}

export enum KanbanConfigVersion {
  V1 = '1',
}

export interface KanbanColumn {
  id: string;
  title?: string;
  width: number;
  resourcesOrder: KanbanResource[];
  createdFromAttributes?: KanbanAttribute[];
  constraintType?: ConstraintType;
}

export interface KanbanResource {
  id: string;
  attributeId?: string;
  resourceType: AttributesResourceType;
  stemIndex?: number;
}

export interface KanbanStemConfig {
  stem?: QueryStem;
  attribute: KanbanAttribute;
  dueDate?: KanbanAttribute;
  doneColumnTitles?: string[];
}

export interface KanbanAttribute {
  resourceId: string;
  attributeId: string;
  resourceIndex?: number;
  resourceType: AttributesResourceType;
  constraint?: Constraint;
}
