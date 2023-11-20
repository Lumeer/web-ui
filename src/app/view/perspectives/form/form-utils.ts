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
import {isNotNullOrUndefined} from '@lumeer/utils';

import {COLOR_SUCCESS} from '../../../core/constants';
import {AttributesResourceType} from '../../../core/model/resource';
import {Collection} from '../../../core/store/collections/collection';
import {findAttribute, getDefaultAttributeId} from '../../../core/store/collections/collection.util';
import {
  FormAttributeCellConfig,
  FormButtonsConfig,
  FormCell,
  FormCellType,
  FormConfig,
  FormLinkCellConfig,
  FormRow,
  FormSection,
} from '../../../core/store/form/form-model';
import {LinkType} from '../../../core/store/link-types/link.type';
import {Query, QueryStem} from '../../../core/store/navigation/query/query';
import {getBaseCollectionIdFromQuery} from '../../../core/store/navigation/query/query.util';
import {generateId} from '../../../shared/utils/resource.utils';

export function checkOrTransformFormConfig(
  config: FormConfig,
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): FormConfig {
  let currentConfig = config;
  const collectionId = getBaseCollectionIdFromQuery(query);
  const currentCollectionId = currentConfig?.collectionId || collectionId;
  if (currentCollectionId !== collectionId) {
    currentConfig = null;
  }

  return {
    collectionId,
    createOnly: currentConfig?.createOnly,
    sections: formSectionsDefaultConfig(currentConfig?.sections, query, collections),
    buttons: formButtonsDefaultConfig(currentConfig?.buttons),
    tableHeight: currentConfig?.tableHeight || 200,
  };
}

function formSectionsDefaultConfig(sections: FormSection[], query: Query, collections: Collection[]): FormSection[] {
  if ((sections || []).length === 0) {
    const baseCollectionId = getBaseCollectionIdFromQuery(query);
    const baseCollection = collections.find(collection => collection.id === baseCollectionId);
    if (baseCollection) {
      const defaultCells: FormCell[] = [];
      const defaultAttribute = findAttribute(baseCollection?.attributes, getDefaultAttributeId(baseCollection));
      if (defaultAttribute) {
        defaultCells.push({
          id: generateId(),
          type: FormCellType.Attribute,
          title: defaultAttribute.name,
          span: 1,
          config: {
            attributeId: defaultAttribute.id,
            resourceId: baseCollection.id,
            resourceType: AttributesResourceType.Collection,
          },
        });
      }
      return [{id: generateId(), rows: [{id: generateId(), cells: defaultCells}]}];
    }
  }
  return sections;
}

function formButtonsDefaultConfig(config: FormButtonsConfig): FormButtonsConfig {
  return {
    create: config?.create || {
      title: $localize`:@@perspective.form.editor.buttons.create.title.default:Create Record`,
      color: COLOR_SUCCESS,
      icon: 'far fa-plus-circle',
    },
    update: config?.update || {
      title: $localize`:@@perspective.form.editor.buttons.update.title.default:Update Record`,
      color: COLOR_SUCCESS,
      icon: 'far fa-pencil',
    },
  };
}

export function formViewConfigLinkQueries(config: FormConfig): Query[] {
  return collectLinkConfigsFromFormConfig(config).reduce<Query[]>((queries, linkConfig) => {
    if (linkConfig.collectionId && linkConfig.linkTypeId) {
      const stem: QueryStem = {
        collectionId: linkConfig.collectionId,
        linkTypeIds: [linkConfig.linkTypeId],
        filters: linkConfig.filters,
      };
      queries.push({stems: [stem]});
    }

    return queries;
  }, []);
}

export function filterValidFormCells(cells: FormCell[]): FormCell[] {
  return (cells || []).filter(cell => isFormCellValid(cell));
}

export function isFormCellValid(cell: FormCell): boolean {
  return !!cell?.span;
}

export function collectAttributesIdsFromFormConfig(config: FormConfig): string[] {
  return collectValuesFromFormConfigCells(
    config,
    cell => cell.type === FormCellType.Attribute && (<FormAttributeCellConfig>cell.config)?.attributeId
  );
}

export function collectLinkIdsFromFormConfig(config: FormConfig): string[] {
  return collectValuesFromFormConfigCells(
    config,
    cell => cell.type === FormCellType.Link && (<FormLinkCellConfig>cell.config)?.linkTypeId
  );
}

export function collectLinkConfigsFromFormConfig(config: FormConfig): FormLinkCellConfig[] {
  return collectValuesFromFormConfigCells(
    config,
    cell => cell.type === FormCellType.Link && <FormLinkCellConfig>cell.config
  );
}

function collectValuesFromFormConfigCells<T>(config: FormConfig, fun: (cell: FormCell) => T): T[] {
  return (config?.sections || [])
    .reduce((cells, section) => {
      cells.push(...collectCellsFromFormRows(section?.rows));
      return cells;
    }, [])
    .map(cell => fun(cell))
    .filter(value => isNotNullOrUndefined(value));
}

function collectCellsFromFormRows(rows: FormRow[]): FormCell[] {
  return (rows || []).reduce((cells, row) => {
    cells.push(...filterValidFormCells(row.cells));
    return cells;
  }, []);
}
