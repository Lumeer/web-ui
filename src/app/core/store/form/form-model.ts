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

import {AttributesResourceType} from '../../model/resource';
import {CollectionAttributeFilter} from '../navigation/query/query';
import {RowLayoutType} from '../../../shared/layout/row-layout/row-layout';
import {Attribute} from '../collections/collection';

export interface FormModel {
  id: string;
  config?: FormConfig;
}

export interface FormConfig {
  collectionId: string;
  sections: FormSection[];
  buttons: FormButtonsConfig;
  tableHeight: number;
  createOnly?: boolean;
}

export interface FormButtonsConfig {
  create?: FormButtonConfig;
  update?: FormButtonConfig;
}

export interface FormButtonConfig {
  title: string;
  icon: string;
  color: string;
}

export interface FormSection {
  id: string;
  title?: string;
  description?: string;
  rows: FormRow[];
}

export interface FormRow {
  id: string;
  cells: FormCell[];
}

export type FormRowLayoutType = RowLayoutType;

export interface FormCell {
  id: string;
  span: number;
  title?: string;
  description?: string;
  type?: FormCellType;
  config?: FormCellConfig;
}

export type FormCellConfig = FormAttributeCellConfig | FormLinkCellConfig;

export enum FormCellType {
  Attribute = 'attribute',
  Link = 'link',
}

export interface FormAttributeCellConfig {
  attributeId?: string;
  resourceId?: string;
  resourceType?: AttributesResourceType;
  attribute?: Partial<Attribute>;
}

export interface FormLinkCellConfig {
  linkTypeId?: string;
  collectionId?: string;
  attributeId?: string;
  minLinks?: number;
  maxLinks?: number;
  filters?: CollectionAttributeFilter[];
}
