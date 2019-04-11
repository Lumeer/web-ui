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

import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Collection} from '../../../../core/store/collections/collection';
import {findAttributeConstraint, getDefaultAttributeId} from '../../../../core/store/collections/collection.util';
import {isNotNullOrUndefined} from '../../../../shared/utils/common.utils';
import {formatDataValue} from '../../../../shared/utils/data.utils';
import {Constraint, ConstraintType} from '../../../../core/model/data/constraint';

export function createSearchDocumentValuesHtml(document: DocumentModel, collection: Collection): string {
  if (!document.data || !collection) {
    return '';
  }

  const collectionAttributesIds = collection.attributes.map(attribute => attribute.id);
  return Object.keys(document.data)
    .filter(
      attributeId => collectionAttributesIds.includes(attributeId) && isNotNullOrUndefined(document.data[attributeId])
    )
    .map(attributeId =>
      createSearchDocumentValueHtml(
        document.data[attributeId],
        findAttributeConstraint(collection.attributes, attributeId)
      )
    )
    .join(', ');
}

function createSearchDocumentValueHtml(value: any, constraint: Constraint): string {
  const formattedValue = formatDataValue(value, constraint);
  if (!constraint) {
    return createSearchDocumentAnyValueHtml(formattedValue);
  }

  switch (constraint.type) {
    case ConstraintType.Color:
      return createSearchDocumentColorValueHtml(formattedValue);
    case ConstraintType.Boolean:
      return createSearchDocumentBooleanValueHtml(formattedValue);
    default:
      return createSearchDocumentAnyValueHtml(formattedValue);
  }
}

function createSearchDocumentAnyValueHtml(value: string) {
  return `<span class="search-documents-value">${value}</span>`;
}

function createSearchDocumentColorValueHtml(value: string) {
  return `<div class="d-inline-block search-documents-value"
          style="width: 60px; background: ${value}">&nbsp;</div>`;
}

function createSearchDocumentBooleanValueHtml(value: boolean) {
  const inputId = `search-document-input-${Math.random()
    .toString(36)
    .substr(2)}`;
  return `<div class="d-inline-block custom-control custom-checkbox"><input 
             id="${inputId}"
             checked="${value}"
             style="cursor: unset;"
             readonly type="checkbox"
             class="custom-control-input">
          <label
             for="${inputId}"
             style="cursor: unset;"
             class="custom-control-label">
          </label></div>`;
}

export function createSearchDocumentEntriesHtml(
  document: DocumentModel,
  collection: Collection,
  showEmptyValues: boolean
): string {
  if (!document.data || !collection) {
    return '';
  }

  const collectionAttributesIds = collection.attributes.map(attribute => attribute.id);
  return Object.keys(document.data)
    .filter(
      attributeId =>
        collectionAttributesIds.includes(attributeId) &&
        (showEmptyValues || isNotNullOrUndefined(document.data[attributeId]))
    )
    .map(attributeId => ({attributeId, constraint: findAttributeConstraint(collection.attributes, attributeId)}))
    .map(
      ({attributeId, constraint}) =>
        `${searchDocumentAttributeHtml(attributeId, collection)}${createSearchDocumentValueHtml(
          document.data[attributeId],
          constraint
        )}`
    )
    .join(', ');
}

export function searchDocumentDefaultAttributeHtml(document: DocumentModel, collection: Collection): string {
  if (!document.data || !collection) {
    return '';
  }

  const defaultAttributeId = getDefaultAttributeId(collection);
  const value = document.data[defaultAttributeId];
  return formatDataValue(value, findAttributeConstraint(collection.attributes, defaultAttributeId));
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
