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

import {Resource} from '../../model/resource';
import {Rule} from '../../model/rule';
import {Constraint} from '@lumeer/data-filters';

export interface Attribute {
  id?: string;
  name: string;
  description?: string;

  constraint?: Constraint;
  function?: AttributeFunction;

  usageCount?: number;
  intermediate?: boolean;

  correlationId?: string;
}

export interface AttributeFunction {
  js?: string;
  xml?: string;
  errorReport?: string;
  timestamp?: number;
  editable?: boolean;
  dryRun?: boolean;
  dryRunResult?: string;
}

export interface Collection extends Resource {
  attributes?: Attribute[];
  defaultAttributeId?: string;

  documentsCount?: number;

  rules?: Rule[];

  purpose?: CollectionPurpose;
}

export interface CollectionPurpose {
  type: CollectionPurposeType;
  metaData: Partial<CollectionPurposeMetadata>;
}

export enum CollectionPurposeType {
  None = 'None',
  Tasks = 'Tasks',
}

export const collectionPurposesIcons: Record<string, string> = {
  [CollectionPurposeType.None]: 'fal fa-table',
  [CollectionPurposeType.Tasks]: 'fas fa-tasks',
};

export const collectionPurposesMap: Record<string, CollectionPurposeType> = {
  [CollectionPurposeType.Tasks]: CollectionPurposeType.Tasks,
};

export interface ImportedCollection {
  collection: Collection;
  data: string;
}

export type CollectionPurposeMetadata = TaskPurposeMetadata;

export interface TaskPurposeMetadata {
  dueDateAttributeId?: string;
  assigneeAttributeId?: string;
  stateAttributeId?: string;
  finalStatesList?: any[];
  observersAttributeId?: string;
  tagsAttributeId?: string;
  priorityAttributeId?: string;
  defaultViewCode?: string;
}
