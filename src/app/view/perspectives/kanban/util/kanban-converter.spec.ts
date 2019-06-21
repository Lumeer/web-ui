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

import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Collection} from '../../../../core/store/collections/collection';
import {KanbanConfig} from '../../../../core/store/kanbans/kanban';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {KanbanConverter} from './kanban-converter';
import {TestBed} from '@angular/core/testing';
import {LOCALE_ID, TRANSLATIONS, TRANSLATIONS_FORMAT} from '@angular/core';
import {environment} from '../../../../../environments/environment';
import {I18n} from '@ngx-translate/i18n-polyfill';

const documents: DocumentModel[] = [
  {
    collectionId: 'C1',
    id: 'D1',
    data: {a1: 'Sport', a2: 3},
  },
  {
    collectionId: 'C1',
    id: 'D2',
    data: {a1: 'Dance', a2: 7},
  },
  {
    collectionId: 'C1',
    id: 'D3',
    data: {a1: 'Glass', a2: 44},
  },
  {
    collectionId: 'C1',
    id: 'D4',
    data: {a1: 'Sport', a2: 0},
  },
  {
    collectionId: 'C1',
    id: 'D5',
    data: {a1: 'Glass', a2: 7},
  },
  {
    collectionId: 'C2',
    id: 'D6',
    data: {a1: 'Dance', a2: 3},
  },
  {
    collectionId: 'C2',
    id: 'D7',
    data: {a1: 'LMR', a2: 7},
  },
  {
    collectionId: 'C2',
    id: 'D8',
    data: {a1: 'Glass', a2: 44},
  },
  {
    collectionId: 'C2',
    id: 'D9',
    data: {a1: 'Sport', a2: 0},
  },
  {
    collectionId: 'C2',
    id: 'D10',
    data: {a1: 'LMR', a2: 7},
  },
  {
    collectionId: 'C3',
    id: 'D11',
    data: {a1: 'Glass', a2: 7},
  },
];

const collections: Collection[] = [
  {
    id: 'C1',
    name: 'collection',
    attributes: [{id: 'a1', name: 'Lala'}],
  },
  {
    id: 'C2',
    name: 'collection',
    attributes: [{id: 'a1', name: 'Lalo'}],
  },
  {
    id: 'C3',
    name: 'collection',
    attributes: [{id: 'a1', name: 'Lale'}],
  },
];

describe('Kanban converter', () => {
  let constraintReadableFormatter: SelectItemWithConstraintFormatter;
  let converter: KanbanConverter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: LOCALE_ID,
          useFactory: () => environment.locale,
        },
        {
          provide: TRANSLATIONS,
          useFactory: () => require(`raw-loader!../../../../../../src/i18n/messages.en.xlf`),
          deps: [LOCALE_ID],
        },
        {
          provide: TRANSLATIONS_FORMAT,
          useFactory: () => environment.i18nFormat,
        },
        I18n,
      ],
    });
    constraintReadableFormatter = TestBed.get(SelectItemWithConstraintFormatter);
    converter = new KanbanConverter(constraintReadableFormatter);
  });

  it('should create only other column', () => {
    const config: KanbanConfig = {columns: [], collections: {}};
    const buildConfig = converter.buildKanbanConfig(config, documents, collections);
    expect(buildConfig.columns).toEqual([]);
    expect(buildConfig.collections).toEqual({});
    expect(buildConfig.otherColumn.documentsIdsOrder).toEqual([
      'D1',
      'D2',
      'D3',
      'D4',
      'D5',
      'D6',
      'D7',
      'D8',
      'D9',
      'D10',
      'D11',
    ]);
  });

  it('should create by selected attribute', () => {
    const config: KanbanConfig = {columns: [], collections: {C1: {attribute: {attributeId: 'a1', collectionId: 'C1'}}}};
    const buildConfig = converter.buildKanbanConfig(config, documents, collections);
    expect(buildConfig.columns.map(c => c.title)).toEqual(['Sport', 'Dance', 'Glass']);
    expect(buildConfig.columns[0].documentsIdsOrder).toEqual(['D1', 'D4']);
    expect(buildConfig.columns[1].documentsIdsOrder).toEqual(['D2']);
    expect(buildConfig.columns[2].documentsIdsOrder).toEqual(['D3', 'D5']);
    expect(buildConfig.collections).toEqual(config.collections);
    expect(buildConfig.otherColumn.documentsIdsOrder).toEqual(['D6', 'D7', 'D8', 'D9', 'D10', 'D11']);
  });

  it('should create by multiple attributes', () => {
    const config: KanbanConfig = {
      columns: [],
      collections: {
        C1: {attribute: {attributeId: 'a1', collectionId: 'C1'}},
        C2: {attribute: {attributeId: 'a1', collectionId: 'C2'}},
      },
    };
    const buildConfig = converter.buildKanbanConfig(config, documents, collections);
    expect(buildConfig.columns.map(c => c.title)).toEqual(['Sport', 'Dance', 'Glass', 'LMR']);
    expect(buildConfig.columns[0].documentsIdsOrder).toEqual(['D1', 'D4', 'D9']);
    expect(buildConfig.columns[1].documentsIdsOrder).toEqual(['D2', 'D6']);
    expect(buildConfig.columns[2].documentsIdsOrder).toEqual(['D3', 'D5', 'D8']);
    expect(buildConfig.columns[3].documentsIdsOrder).toEqual(['D7', 'D10']);
    expect(buildConfig.collections).toEqual(config.collections);
    expect(buildConfig.otherColumn.documentsIdsOrder).toEqual(['D11']);
  });

  it('should create by previous config', () => {
    const previousConfig: KanbanConfig = {
      columns: [
        {id: '1', title: 'LMR', width: 200, documentsIdsOrder: ['D350', 'D10', 'D7']},
        {id: '2', title: 'Glass', width: 100, documentsIdsOrder: ['D5', 'D1', 'D3', 'D8']},
        {id: '3', title: 'Dance', width: 800, documentsIdsOrder: ['D111', 'D6', 'D3', 'D1', 'D2']},
      ],
      collections: {
        C1: {attribute: {attributeId: 'a1', collectionId: 'C1'}},
        C2: {attribute: {attributeId: 'a1', collectionId: 'C2'}},
      },
    };
    const buildConfig = converter.buildKanbanConfig(previousConfig, documents, collections);
    expect(buildConfig.columns.map(c => c.title)).toEqual(['LMR', 'Glass', 'Dance', 'Sport']);
    expect(buildConfig.columns[0].documentsIdsOrder).toEqual(['D10', 'D7']);
    expect(buildConfig.columns[1].documentsIdsOrder).toEqual(['D5', 'D3', 'D8']);
    expect(buildConfig.columns[2].documentsIdsOrder).toEqual(['D6', 'D2']);
    expect(buildConfig.columns[3].documentsIdsOrder).toEqual(['D1', 'D4', 'D9']);
    expect(buildConfig.collections).toEqual(previousConfig.collections);
    expect(buildConfig.otherColumn.documentsIdsOrder).toEqual(['D11']);
  });
});
