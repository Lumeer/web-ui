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

import {} from 'jasmine';
import {DocumentModel} from './document.model';
import {filterDocumentsByQuery} from './documents.filters';

const documents: DocumentModel[] = [
  {
    collectionId: 'COLLECTION_0',
    id: 'DOCUMENT_0',
    data: {
      a1: 'IBM'
    }
  },
  {
    collectionId: 'COLLECTION_0',
    id: 'DOCUMENT_1',
    data: {
      a1: 'Red Hat'
    },
    metaData: {
      parentId: 'DOCUMENT_0'
    }
  },
  {
    collectionId: 'COLLECTION_0',
    id: 'DOCUMENT_2',
    data: {
      a1: 'JBoss'
    },
    metaData: {
      parentId: 'DOCUMENT_1'
    }
  },
  {
    collectionId: 'COLLECTION_0',
    id: 'DOCUMENT_3',
    data: {
      a1: 'SoftLayer'
    },
    metaData: {
      parentId: 'DOCUMENT_0'
    }
  },
  {
    collectionId: 'COLLECTION_0',
    id: 'DOCUMENT_4',
    data: {
      a1: 'Microsoft'
    }
  },
  {
    collectionId: 'COLLECTION_0',
    id: 'DOCUMENT_5',
    data: {
      a1: 'LinkedIn'
    },
    metaData: {
      parentId: 'DOCUMENT_4'
    }
  },
  {
    collectionId: 'COLLECTION_1',
    id: 'DOCUMENT_6',
    data: {
      a1: 'Red Hot Chili Peppers'
    }
  },
  {
    collectionId: 'COLLECTION_1',
    id: 'DOCUMENT_7',
    data: {
      a1: 'Linkin Park'
    }
  },
];

describe('Document filters', () => {

  it('should filter empty documents by undefined query', () => {
    expect(filterDocumentsByQuery([], undefined)).toEqual([]);
  });

  it('should filter empty documents by empty query', () => {
    expect(filterDocumentsByQuery([], {})).toEqual([]);
  });

  it('should not filter documents by empty query', () => {
    expect(filterDocumentsByQuery(documents, {})).toEqual(documents);
  });

  it('should not filter documents by empty collections', () => {
    expect(filterDocumentsByQuery(documents, {collectionIds: []})).toEqual(documents);
  });

  it('should not filter documents by all collections', () => {
    expect(filterDocumentsByQuery(documents, {collectionIds: ['COLLECTION_0', 'COLLECTION_1']})).toEqual(documents);
  });

  it('should filter documents by single collection', () => {
    expect(filterDocumentsByQuery(documents, {collectionIds: ['COLLECTION_0']}).length).toBe(6);
  });

  it('should filter document by attribute value', () => {
    expect(filterDocumentsByQuery(documents, {filters: ['COLLECTION_0:a1:= IBM']}).map(document => document.id))
      .toEqual(['DOCUMENT_0']);
  });

  it('should filter children together with parent document by attribute values', () => {
    expect(filterDocumentsByQuery(documents, {filters: ['COLLECTION_0:a1:= IBM']}, true).map(document => document.id))
      .toEqual(['DOCUMENT_0', 'DOCUMENT_1', 'DOCUMENT_2', 'DOCUMENT_3']);
  });

  it('should filter children together with nested parent document by attribute values', () => {
    expect(filterDocumentsByQuery(documents, {filters: ['COLLECTION_0:a1:= Red Hat']}, true).map(document => document.id))
      .toEqual(['DOCUMENT_1', 'DOCUMENT_2']);
  });

  it('should filter documents from both collections by fulltext', () => {
    expect(filterDocumentsByQuery(documents, {fulltext: 'link'}).map(document => document.id))
      .toEqual(['DOCUMENT_5', 'DOCUMENT_7']);
  });

  it('should filter documents from single collection by collection and fulltext', () => {
    expect(filterDocumentsByQuery(documents, {collectionIds: ['COLLECTION_0'], fulltext: 'link'}).map(document => document.id))
      .toEqual(['DOCUMENT_5']);
  });

  it('should filter children together with parent document by fulltext', () => {
    expect(filterDocumentsByQuery(documents, {fulltext: 'IBM'}, true).map(document => document.id))
      .toEqual(['DOCUMENT_0', 'DOCUMENT_1', 'DOCUMENT_2', 'DOCUMENT_3']);
  });

  it('should filter only matching document without children by fulltext', () => {
    expect(filterDocumentsByQuery(documents, {fulltext: 'red'}).map(document => document.id))
      .toEqual(['DOCUMENT_1', 'DOCUMENT_6']);
  });

  it('should filter children together with nested parent document by fulltext', () => {
    expect(filterDocumentsByQuery(documents, {fulltext: 'red'}, true).map(document => document.id))
      .toEqual(['DOCUMENT_1', 'DOCUMENT_2', 'DOCUMENT_6']);
  });

});
