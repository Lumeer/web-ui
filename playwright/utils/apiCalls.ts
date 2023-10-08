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

export const loginApiCall = async (request: APIRequestContext, userEmail: string, userPassword: string) => {
  const loginFormData = new URLSearchParams();
  loginFormData.append('userName', userEmail);
  loginFormData.append('password', userPassword);

  const loginReponse = await request.post('http://localhost:8080/lumeer-engine/rest/users/login', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: loginFormData.toString(),
  });

  return JSON.parse(await loginReponse.text());
};

export const getUserApiCall = async (request: APIRequestContext, authToken: string) => {
  const userResponse = await request.get('http://localhost:8080/lumeer-engine/rest/users/current', {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  return JSON.parse(await userResponse.text());
};

export const createCollectionApiCall = async (
  request: APIRequestContext,
  authToken: string,
  organizationId: string,
  projectId: string,
  collectionName: string
) => {
  const collectionResponse = await request.post(
    `http://localhost:8080/lumeer-engine/rest/organizations/${organizationId}/projects/${projectId}/collections`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {name: collectionName},
    }
  );

  return JSON.parse(await collectionResponse.text());
};

export const addCollectionAttributesApiCall = async (
  request: APIRequestContext,
  authToken: string,
  organizationId: string,
  projectId: string,
  collectionId: string,
  tableAttributes: object
) => {
  const collectionResponse = await request.post(
    `http://localhost:8080/lumeer-engine/rest/organizations/${organizationId}/projects/${projectId}/collections/${collectionId}/attributes`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: tableAttributes,
    }
  );

  return JSON.parse(await collectionResponse.text());
};

export const addDocumentApiCall = async (
  request: APIRequestContext,
  organizationId: string,
  projectId: string,
  collectionId: string,
  authToken: string,
  data: object
) => {
  const response = await request.post(
    `http://localhost:8080/lumeer-engine/rest/organizations/${organizationId}/projects/${projectId}/collections/${collectionId}/documents`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {organizationId, data},
    }
  );

  if (!response.ok()) {
    throw new Error(`Could not import data into document ${await response.text()}`);
  }
};
