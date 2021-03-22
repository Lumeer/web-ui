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

import {TestBed} from '@angular/core/testing';
import {LOCALE_ID, TRANSLATIONS, TRANSLATIONS_FORMAT} from '@angular/core';

import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Collection} from '../../../../core/store/collections/collection';
import {KanbanConfig} from '../../../../core/store/kanbans/kanban';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {KanbanConverter} from './kanban-converter';
import {AttributesResourceType} from '../../../../core/model/resource';

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
          useFactory: () => 'en',
        },
        {
          provide: TRANSLATIONS,
          useFactory: () => require(`raw-loader!../../../../../../src/i18n/messages.en.xlf`).default,
          deps: [LOCALE_ID],
        },
        {
          provide: TRANSLATIONS_FORMAT,
          useFactory: () => 'xlf',
        },
      ],
    });
    constraintReadableFormatter = TestBed.inject(SelectItemWithConstraintFormatter);
    converter = new KanbanConverter(constraintReadableFormatter);
  });

  it('should create empty columns', () => {
    const config: KanbanConfig = {columns: [], stemsConfigs: []};
    const buildConfig = converter.convert(config, collections, [], documents, [], {});
    expect(buildConfig.config.columns).toEqual([]);
    expect(buildConfig.config.stemsConfigs).toEqual([]);
    expect(buildConfig.data.otherColumn.cards).toEqual([]);
  });

  it('should create by selected attribute', () => {
    const stem = {collectionId: collections[0].id};
    const config: KanbanConfig = {
      columns: [],
      stemsConfigs: [
        {
          stem,
          attribute: {
            attributeId: 'a1',
            resourceId: 'C1',
            resourceIndex: 0,
            resourceType: AttributesResourceType.Collection,
          },
        },
      ],
    };
    const buildConfig = converter.convert(config, collections, [], documents, [], {});
    expect(buildConfig.config.columns.map(c => c.title)).toEqual(['Sport', 'Dance', 'Glass']);
    expect(buildConfig.data.columns[0].cards.map(card => card.dataResource.id)).toEqual(['D1', 'D4']);
    expect(buildConfig.data.columns[1].cards.map(card => card.dataResource.id)).toEqual(['D2']);
    expect(buildConfig.data.columns[2].cards.map(card => card.dataResource.id)).toEqual(['D3', 'D5']);
    expect(buildConfig.config.stemsConfigs).toEqual(config.stemsConfigs);
    expect(buildConfig.data.otherColumn.cards).toEqual([]);
  });

  it('should create by multiple attributes', () => {
    const stem = {collectionId: collections[0].id};
    const stem2 = {collectionId: collections[1].id};
    const config: KanbanConfig = {
      columns: [],
      stemsConfigs: [
        {
          stem,
          attribute: {
            attributeId: 'a1',
            resourceId: 'C1',
            resourceIndex: 0,
            resourceType: AttributesResourceType.Collection,
          },
        },
        {
          stem: stem2,
          attribute: {
            attributeId: 'a1',
            resourceId: 'C2',
            resourceIndex: 0,
            resourceType: AttributesResourceType.Collection,
          },
        },
      ],
    };
    const buildConfig = converter.convert(config, collections, [], documents, [], {});
    expect(buildConfig.config.columns.map(c => c.title)).toEqual(['Sport', 'Dance', 'Glass', 'LMR']);
    expect(buildConfig.data.columns[0].cards.map(card => card.dataResource.id)).toEqual(['D1', 'D4', 'D9']);
    expect(buildConfig.data.columns[1].cards.map(card => card.dataResource.id)).toEqual(['D2', 'D6']);
    expect(buildConfig.data.columns[2].cards.map(card => card.dataResource.id)).toEqual(['D3', 'D5', 'D8']);
    expect(buildConfig.data.columns[3].cards.map(card => card.dataResource.id)).toEqual(['D7', 'D10']);
    expect(buildConfig.config.stemsConfigs).toEqual(config.stemsConfigs);
    expect(buildConfig.data.otherColumn.cards).toEqual([]);
  });

  it('should create by previous config', () => {
    const resourceType = AttributesResourceType.Collection;
    const stem = {collectionId: collections[0].id};
    const stem2 = {collectionId: collections[1].id};
    const previousConfig: KanbanConfig = {
      columns: [
        {
          id: '1',
          title: 'LMR',
          width: 200,
        },
        {
          id: '2',
          title: 'Glass',
          width: 100,
        },
        {
          id: '3',
          title: 'Dance',
          width: 800,
        },
      ],
      stemsConfigs: [
        {
          stem,
          attribute: {
            attributeId: 'a1',
            resourceId: 'C1',
            resourceIndex: 0,
            resourceType: AttributesResourceType.Collection,
          },
        },
        {
          stem: stem2,
          attribute: {
            attributeId: 'a1',
            resourceId: 'C2',
            resourceIndex: 0,
            resourceType: AttributesResourceType.Collection,
          },
        },
      ],
    };
    const buildConfig = converter.convert(previousConfig, collections, [], documents, [], {});
    expect(buildConfig.config.columns.map(c => c.title)).toEqual(['LMR', 'Glass', 'Dance', 'Sport']);
    expect(buildConfig.data.columns[0].cards.map(card => card.dataResource.id)).toEqual(['D7', 'D10']);
    expect(buildConfig.data.columns[1].cards.map(card => card.dataResource.id)).toEqual(['D3', 'D5', 'D8']);
    expect(buildConfig.data.columns[2].cards.map(card => card.dataResource.id)).toEqual(['D2', 'D6']);
    expect(buildConfig.data.columns[3].cards.map(card => card.dataResource.id)).toEqual(['D1', 'D4', 'D9']);
    expect(buildConfig.config.stemsConfigs).toEqual(previousConfig.stemsConfigs);
    expect(buildConfig.data.otherColumn.cards).toEqual([]);
  });
});
