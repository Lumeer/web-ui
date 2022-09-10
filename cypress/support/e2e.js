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

  // get organization id

  cy.getOrganizationByCode(Cypress.env('organizationCode')).then(organization => {
    // create a new project for each test

    const projectCode = Math.random().toString(36).substring(2, 7);
    Cypress.env('projectCode', projectCode);
    cy.createProject(organization.id, projectCode, 'Test project').then(project => {
      // save default workspace to newly created project

      cy.saveDefaultWorkspace({
        organizationCode: Cypress.env('organizationCode'),
        projectCode,
      });

      // initialize REST API routes

      const organizationRestUrl = `${Cypress.env('engineUrl')}rest/organizations/${organization.id}`;
      const projectRestUrl = `${organizationRestUrl}/projects/${project.id}`;
      Cypress.env('projectRestUrl', projectRestUrl);
      const collectionRestUrl = `${projectRestUrl}/collections/**`;

      cy.server();

      cy.intercept('POST', `${projectRestUrl}/collections`).as('createCollection');
      cy.intercept('POST', `${collectionRestUrl}/attributes`).as('createAttribute');
      cy.intercept('PUT', `${collectionRestUrl}/attributes/**`).as('updateAttribute');
      cy.intercept('POST', `${collectionRestUrl}/documents`).as('createDocument');
      cy.intercept('PATCH', `${collectionRestUrl}/documents/**/data`).as('patchDocumentData');
      cy.intercept('POST', `${projectRestUrl}/link-instances`).as('createLinkInstance');
    });
  });
});
