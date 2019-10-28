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

import {UnknownConstraint} from '../../../../core/model/constraint/unknown.constraint';
import {ConstraintData, ConstraintType} from '../../../../core/model/data/constraint';
import {Collection} from '../../../../core/store/collections/collection';
import {findAttributeConstraint, getDefaultAttributeId} from '../../../../core/store/collections/collection.util';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {isNotNullOrUndefined} from '../../../../shared/utils/common.utils';
import {createDataValueHtml} from '../../../../shared/utils/data/data-html.utils';

export function createSearchDocumentValuesHtml(
  document: DocumentModel,
  collection: Collection,
  constraintData: ConstraintData
): string {
  if (!document.data || !collection) {
    return '';
  }

  const collectionAttributesIds = (collection.attributes || []).map(attribute => attribute.id);
  return collectionAttributesIds
    .filter(attributeId => {
      const constraint = findAttributeConstraint(collection.attributes, attributeId);
      return (
        (constraint != null && constraint.type === ConstraintType.Boolean) ||
        isNotNullOrUndefined(document.data[attributeId])
      );
    })
    .map(attributeId =>
      createDataValueHtml(
        document.data[attributeId],
        findAttributeConstraint(collection.attributes, attributeId),
        constraintData,
        'search-documents-value'
      )
    )
    .join(', ');
}

export function createSearchDocumentEntriesHtml(
  document: DocumentModel,
  collection: Collection,
  constraintData: ConstraintData,
  showEmptyValues: boolean
): string {
  if (!document.data || !collection) {
    return '';
  }

  const collectionAttributesIds = (collection.attributes || []).map(attribute => attribute.id);
  return collectionAttributesIds
    .filter(attributeId => {
      const constraint = findAttributeConstraint(collection.attributes, attributeId);
      return (
        (constraint != null && constraint.type === ConstraintType.Boolean) ||
        showEmptyValues ||
        isNotNullOrUndefined(document.data[attributeId])
      );
    })
    .map(attributeId => ({attributeId, constraint: findAttributeConstraint(collection.attributes, attributeId)}))
    .map(
      ({attributeId, constraint}) =>
        `${searchDocumentAttributeHtml(attributeId, collection)}${createDataValueHtml(
          document.data[attributeId],
          constraint,
          constraintData,
          'search-documents-value'
        )}`
    )
    .join(', ');
}

export function searchDocumentDefaultAttributeHtml(
  document: DocumentModel,
  collection: Collection,
  constraintData: ConstraintData
): string {
  if (!document.data || !collection) {
    return '';
  }

  const defaultAttributeId = getDefaultAttributeId(collection);
  const value = document.data[defaultAttributeId];
  const constraint = findAttributeConstraint(collection.attributes, defaultAttributeId) || new UnknownConstraint();
  return constraint.createDataValue(value, constraintData).format();
}

function searchDocumentAttributeHtml(attributeId: string, collection: Collection) {
  return `<span class="${attributeHtmlClasses(attributeId, collection)}">${getAttributeName(
    collection,
    attributeId
  )}</span>: `;
}

function attributeHtmlClasses(attributeId: string, collection: Collection): string {
  return `text-attribute ${isDefaultAttribute(attributeId, collection) ? 'text-default-attribute' : ''}`;
}

function isDefaultAttribute(attributeId: string, collection: Collection): boolean {
  return attributeId === getDefaultAttributeId(collection);
}

function getAttributeName(collection: Collection, attributeId: string): string {
  const attribute = collection && collection.attributes.find(attr => attr.id === attributeId);
  return attribute && attribute.name;
}
