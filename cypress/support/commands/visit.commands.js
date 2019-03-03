Cypress.Commands.add('visitSearchCollections', () => {
  cy.visit(`/w/${Cypress.env('organizationCode')}/${Cypress.env('projectCode')}/view/search/collections`);
});

Cypress.Commands.add('saveDefaultWorkspace', defaultWorkspace => {
  cy.request({
    method: 'PUT',
    url: `${Cypress.env('engineUrl')}rest/users/workspace`,
    auth: {
      bearer: Cypress.env('authAccessToken'),
    },
    body: defaultWorkspace,
  });
});

Cypress.Commands.add('visitTable', collectionId => {
  const workspacePath = `/w/${Cypress.env('organizationCode')}/${Cypress.env('projectCode')}`;
  const query = collectionId ? `%7B"stems":%5B%7B"collectionId":"${collectionId}"%7D%5D%7D` : '';

  cy.visit(`${workspacePath}/view/table?query=${query}`);
});
