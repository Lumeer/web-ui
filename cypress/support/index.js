// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import './commands';

beforeEach(() => {
  cy.loginAndDismissAgreement();

  // create a new project for each test

  const projectCode = Math.random()
    .toString(36)
    .substr(2);
  Cypress.env('projectCode', projectCode);
  cy.createProject(projectCode, 'Test project');

  // save default workspace to newly created project

  cy.saveDefaultWorkspace({
    organizationCode: Cypress.env('organizationCode'),
    projectCode,
  });

  // initialize REST API routes

  const organizationRestUrl = `${Cypress.env('engineUrl')}rest/organizations/${Cypress.env('organizationCode')}`;
  const projectRestUrl = `${organizationRestUrl}/projects/${projectCode}`;
  Cypress.env('projectRestUrl', projectRestUrl);
  const collectionRestUrl = `${projectRestUrl}/collections/**`;

  cy.server();

  cy.route('POST', `${projectRestUrl}/collections`).as('createCollection');
  cy.route('POST', `${collectionRestUrl}/attributes`).as('createAttribute');
  cy.route('PUT', `${collectionRestUrl}/attributes/**`).as('updateAttribute');
  cy.route('POST', `${collectionRestUrl}/documents`).as('createDocument');
  cy.route('PATCH', `${collectionRestUrl}/documents/**/data`).as('patchDocumentData');
  cy.route('POST', `${projectRestUrl}/link-instances`).as('createLinkInstance');
});
