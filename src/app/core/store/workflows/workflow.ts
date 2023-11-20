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

import {QueryStem} from '../navigation/query/query';
import {QueryAttribute, QueryResource, DataAggregationType} from '@lumeer/data-filters';
import {AttributesResourceType} from '../../model/resource';

export interface Workflow {
  id: string;
  config?: WorkflowConfig;
}

export interface WorkflowConfig {
  stemsConfigs: WorkflowStemConfig[];
  version: WorkflowConfigVersion;
  tables: WorkflowTableConfig[];
  columns: WorkflowColumnsSettings;
  footers: WorkflowFooterConfig[];
}

export interface WorkflowTableConfig {
  stem: QueryStem;
  collectionId: string;
  value?: any;
  height: number;
  expandedDocuments: string[];
}

export interface WorkflowColumnsSettings {
  collections?: Record<string, WorkflowColumnSettings[]>;
  linkTypes?: Record<string, WorkflowColumnSettings[]>;
}

export interface WorkflowColumnSettings {
  attributeId: string;
  width?: number;
}

export enum WorkflowConfigVersion {
  V1 = '1',
}

export const latestWorkflowVersion = WorkflowConfigVersion.V1;

export interface WorkflowStemConfig {
  stem?: QueryStem;
  attribute?: WorkflowAttribute;
  collection?: WorkflowResource;
}

export interface WorkflowFooterConfig {
  stem: QueryStem;
  attributes: WorkflowFooterAttributeConfig[];
}

export interface WorkflowFooterAttributeConfig {
  attributeId: string;
  resourceType: AttributesResourceType;
  aggregation?: DataAggregationType;
}

export interface WorkflowAttribute extends QueryAttribute {}

export interface WorkflowResource extends QueryResource {}
