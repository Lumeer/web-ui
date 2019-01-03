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

  const projectCode = Math.random()
    .toString(36)
    .substr(2);
  Cypress.env('projectCode', projectCode);
  cy.createProject(projectCode, 'Test project');
});
