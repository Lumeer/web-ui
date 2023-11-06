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
import {APIRequestContext} from '@playwright/test';
import dotenv from 'dotenv';
import {getUserApiCall, createCollectionApiCall, addCollectionAttributesApiCall, addDocumentApiCall} from './apiCalls';

dotenv.config();

const authToken = process.env.TEST_AUTH_TOKEN ?? '';

const tableAttributes = [
  {
    name: 'Title',
  },
  {
    name: 'Description',
  },
  {
    name: 'Created',
    constraint: {
      type: 'DateTime',
      config: {
        format: 'YYYY-MM-DD',
        asUtc: true,
        minValue: null,
        maxValue: null,
      },
    },
  },
  {
    name: 'Information',
  },
  {
    name: 'Status',
    constraint: {
      type: 'Select',
      config: {
        options: [
          {
            value: 'Done',
            displayValue: '',
          },
          {
            value: 'In progress',
            displayValue: '',
          },
          {
            value: 'In backlog',
            displayValue: '',
          },
        ],
      },
    },
  },
  {
    name: 'Points',
    constraint: {
      type: 'Number',
      config: {
        decimals: null,
        separated: null,
        compact: null,
        forceSign: null,
        negative: null,
        currency: null,
      },
    },
  },
];

const tableData = [
  {
    a1: 'Prepare environment',
    a2: 'Prepare Playwright config file',
    a3: '2023-07-01',
    a4: 'Discuss with contributors',
    a5: 'Done',
    a6: '11',
  },
  {
    a1: 'Analyze UI tests scenarios',
    a2: 'Find the the most usefull paths inside the application',
    a3: '2023-07-15',
    a4: 'Use some kind of source to analyze tests scenarios',
    a5: 'In progress',
    a6: '7',
  },
  {
    a1: 'Write UI tests',
    a2: "Write the first set of Playwright's tests",
    a3: '2023-07-31',
    a4: 'Try to keep the good code practices',
    a5: 'In progress',
    a6: '15',
  },
  {
    a1: 'Set up CI/CD',
    a2: 'Analyze and set up CI/CD using Github Action',
    a3: '2023-08-01',
    a4: 'The knowledge of Bash and YAML might come usefull',
    a5: 'In progress',
    a6: '15',
  },
  {
    a1: 'Give a report',
    a2: 'Give a report to the manager about the completion of the UI tests',
    a3: '2023-08-31',
    a5: 'In backlog',
    a6: '3',
  },
];

export const prepareTableViaApi = async (request: APIRequestContext, tableName: string) => {
  const userParsedBody = await getUserApiCall(request, authToken);
  const defaultWorkspace = userParsedBody.defaultWorkspace;

  const collectionParsedBody = await createCollectionApiCall(
    request,
    authToken,
    defaultWorkspace.organizationId,
    defaultWorkspace.projectId,
    tableName
  );
  const collectionId = collectionParsedBody.id;

  await addCollectionAttributesApiCall(
    request,
    authToken,
    defaultWorkspace.organizationId,
    defaultWorkspace.projectId,
    collectionId,
    tableAttributes
  );

  for (const data of tableData) {
    await addDocumentApiCall(
      request,
      defaultWorkspace.organizationId,
      defaultWorkspace.projectId,
      collectionId,
      authToken,
      data
    );
  }
};
