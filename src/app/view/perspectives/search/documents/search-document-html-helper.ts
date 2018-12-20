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

import {isArray, isNullOrUndefined} from 'util';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Collection} from '../../../../core/store/collections/collection';
import {getDefaultAttributeId} from '../../../../core/store/collections/collection.util';

export function searchDocumentValuesHtml(document: DocumentModel, collection: Collection): string {
  if (!document.data || !collection) {
    return '';
  }

  return searchDocumentGetValues(document, collection)
    .filter(value => value)
    .map(value => `<span class="search-documents-value">${value}</span>`)
    .join(', ');
}

export function searchDocumentEntriesHtml(
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
      attributeId => collectionAttributesIds.includes(attributeId) && (showEmptyValues || document.data[attributeId])
    )
    .map(
      attributeId =>
        `${searchDocumentAttributeHtml(attributeId, collection)}${searchDocumentValueHtml(document.data[attributeId])}`
    )
    .join(', ');
}

export function searchDocumentDefaultAttributeHtml(document: DocumentModel, collection: Collection): string {
  if (!document.data || !collection) {
    return '';
  }

  const defaultAttributeId = getDefaultAttributeId(collection);
  const value = document.data[defaultAttributeId] || '';

  return searchDocumentValueHtml(value);
}

function searchDocumentGetValues(document: DocumentModel, collection: Collection): any[] {
  const collectionAttributesIds = collection.attributes.map(attribute => attribute.id);
  const filteredDocumentValues = Object.entries(document.data)
    .filter(([key]) => collectionAttributesIds.includes(key))
    .map(([key, value]) => value);

  return searchDocumentGetValuesFromArray(filteredDocumentValues);
}

function searchDocumentGetValuesFromAny(value: any): string[] {
  if (isArray(value)) {
    return searchDocumentGetValuesFromArray(value as any[]);
  } else {
    return [value as string];
  }
}

function searchDocumentGetValuesFromArray(array: any[]): string[] {
  return array.reduce((acc, value) => {
    acc = [...acc, ...searchDocumentGetValuesFromAny(value)];
    return acc;
  }, []);
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

function searchDocumentValueHtml(value: any): string {
  if (isNullOrUndefined(value)) {
    return '';
  } else if (isArray(value)) {
    return `[${searchDocumentArrayHtml(value as any[])}]`;
  } else {
    return `<span class="search-documents-value">${value.toString()}</span>`;
  }
}

function searchDocumentArrayHtml(array: any[]): string {
  let html = '';
  for (let i = 0; i < array.length; i++) {
    html += searchDocumentValueHtml(array[i]);
    if (i !== array.length - 1) {
      html += ', ';
    }
  }
  return html;
}
