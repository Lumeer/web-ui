Cypress.Commands.add('visitAndWait', url => {
  cy.visit(url);
  cy.get('[data-test="lumeer-logo"]', {timeout: 30000}).should('be.visible');
});

Cypress.Commands.add('visitSearchCollections', () => {
  cy.visitAndWait(`/w/${Cypress.env('organizationCode')}/${Cypress.env('projectCode')}/view/search/collections`);
});

Cypress.Commands.add('visitTable', collectionId => {
  const workspacePath = `/w/${Cypress.env('organizationCode')}/${Cypress.env('projectCode')}`;
  const query = collectionId ? `%7B"stems":%5B%7B"collectionId":"${collectionId}"%7D%5D%7D` : '';

  cy.visitAndWait(`${workspacePath}/view/table?query=${query}`);
});
