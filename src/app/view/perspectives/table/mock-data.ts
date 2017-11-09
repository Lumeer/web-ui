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

import {Collection} from '../../../core/dto/collection';
import {LinkType} from '../../../core/dto/link-type';
import {LinkInstance} from '../../../core/dto/link-instance';
import {Document} from '../../../core/dto/document';

export const MOCK_COLLECTIONS: Collection[] = [
  {
    code: 'candidates',
    name:
      'Candidates',
    icon:
      'fa fa-id-card',
    color:
      '#e06666',
    attributes:
      [
        {
          name: 'Name',
          fullName: 'name',
          constraints: [],
          usageCount: 0
        },
        {
          name: 'Applied',
          fullName: 'applied',
          constraints: ['isDate'],
          usageCount: 0
        },
        {
          name: 'Result',
          fullName: 'result',
          constraints: [],
          usageCount: 0
        }
      ]
  },
  {
    code: 'postings',
    name:
      'Postings',
    icon:
      'fa fa-tv',
    color:
      '#93c47d',
    attributes:
      [
        {
          name: 'Job Title',
          fullName: 'jobtitle',
          constraints: [],
          usageCount: 0
        },
        {
          name: 'Salary',
          fullName: 'salary',
          constraints: [],
          usageCount: 0,
          intermediate: true
        },
        {
          name: 'Sym',
          fullName: 'salary.sym',
          constraints: ['isCurrencySymbol'],
          usageCount: 0
        },
        {
          name: 'Amount',
          fullName: 'salary.amount',
          constraints: ['isNumber'],
          usageCount: 0
        }
      ]
  },
  {
    code: 'employees',
    name:
      'Employees',
    icon:
      'fa fa-user',
    color:
      '#76a5af',
    attributes:
      [
        {
          name: 'Name',
          fullName: 'name',
          constraints: [],
          usageCount: 0
        }
      ]
  }
];

export const MOCK_LINK_TYPES: LinkType[] = [
  {
    id: 'applications',
    name: 'Applications',
    collectionCodes: ['candidates', 'postings']
  },
  {
    id: 'positions',
    name: 'Positions',
    collectionCodes: ['postings', 'employees']
  }
];

export const MOCK_DOCUMENTS: { [key: string]: Document[] } = {
  'candidates': [
    {
      id: '1',
      collectionCode: 'candidates',
      data: {
        'name': 'Eric Idle',
        'applied': '02.10.2017',
        'result': 'N/A'
      }
    },
    {
      id: '2',
      collectionCode: 'candidates',
      data: {
        'name': 'John Cleese',
        'applied': '07.10.2017',
        'result': 'hired'
      }
    },
    {
      id: '3',
      collectionCode: 'candidates',
      data: {
        'name': 'Graham Chapman',
        'applied': '08.10.2017',
        'result': 'refused'
      }
    },
    {
      id: '4',
      collectionCode: 'candidates',
      data: {
        'name': 'Michael Palin',
        'applied': '30.11.2017',
        'result': 'N/A'
      }
    }
  ],
  'postings': [
    {
      id: '5',
      collectionCode: 'postings',
      data: {
        'jobtitle': 'C++ Developer',
        'salary.sym': '€',
        'salary.amount': '24,500'
      }
    },
    {
      id: '6',
      collectionCode: 'postings',
      data: {
        'jobtitle': 'Java Developer',
        'salary.sym': '€',
        'salary.amount': '26,730'
      }
    },
    {
      id: '7',
      collectionCode: 'postings',
      data: {
        'jobtitle': 'Quality Engineer',
        'salary.sym': '£',
        'salary.amount': '35,800'
      }
    },
    {
      id: '8',
      collectionCode: 'postings',
      data: {
        'jobtitle': 'Assembler Architect',
        'salary.sym': '$',
        'salary.amount': '38,500'
      }
    },
    {
      id: '9',
      collectionCode: 'postings',
      data: {
        'jobtitle': 'Fortran Specialist',
        'salary.sym': '$',
        'salary.amount': '41,600'
      }
    }
  ],
  'employees': [
    {
      id: '10',
      collectionCode: 'employees',
      data: {
        'name': 'Stephen Spielberg',
      }
    },
    {
      id: '11',
      collectionCode: 'employees',
      data: {
        'name': 'Stanley Kubrick',
      }
    },
    {
      id: '12',
      collectionCode: 'employees',
      data: {
        'name': 'David Lynch',
      }
    },
    {
      id: '13',
      collectionCode: 'employees',
      data: {
        'name': 'Woody Allen',
      }
    },
    {
      id: '14',
      collectionCode: 'employees',
      data: {
        'name': 'Alfred Hitchcock',
      }
    },
    {
      id: '15',
      collectionCode: 'employees',
      data: {
        'name': 'Tod Browning',
      }
    },
  ]
};

export const MOCK_LINK_INSTANCES: LinkInstance[] = [
  {
    linkTypeId: 'applications',
    documentIds: ['1', '5']
  },
  {
    linkTypeId: 'applications',
    documentIds: ['1', '6']
  },
  {
    linkTypeId: 'applications',
    documentIds: ['1', '7']
  },
  {
    linkTypeId: 'applications',
    documentIds: ['2', '8']
  },
  {
    linkTypeId: 'applications',
    documentIds: ['3', '5']
  },
  {
    linkTypeId: 'applications',
    documentIds: ['3', '6']
  },
  {
    linkTypeId: 'applications',
    documentIds: ['4', '9']
  },
  {
    linkTypeId: 'positions',
    documentIds: ['5', '10']
  },
  {
    linkTypeId: 'positions',
    documentIds: ['6', '11']
  },
  {
    linkTypeId: 'positions',
    documentIds: ['7', '12']
  },
  {
    linkTypeId: 'positions',
    documentIds: ['8', '13']
  },
  {
    linkTypeId: 'positions',
    documentIds: ['8', '14']
  },
  {
    linkTypeId: 'positions',
    documentIds: ['9', '15']
  },
];
