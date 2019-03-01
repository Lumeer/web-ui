Cypress.Commands.add('createCollection', (name, icon, color) => {
  return cy
    .request({
      method: 'POST',
      url: `${Cypress.env('engineUrl')}rest/organizations/${Cypress.env('organizationCode')}/projects/${Cypress.env(
        'projectCode'
      )}/collections`,
      auth: {
        bearer: Cypress.env('authAccessToken'),
      },
      body: {
        name,
        icon,
        color,
      },
    })
    .then(response => response.body);
});

Cypress.Commands.add('createCollectionAttributes', (collectionId, attributes) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('projectRestUrl')}/collections/${collectionId}/attributes`,
    auth: {
      bearer: Cypress.env('authAccessToken'),
    },
    body: attributes,
  });
});

Cypress.Commands.add('createDocument', (collectionId, data) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('projectRestUrl')}/collections/${collectionId}/documents`,
    auth: {
      bearer: Cypress.env('authAccessToken'),
    },
    body: {collectionId, data},
  });
});

Cypress.Commands.add('createProject', (code, name) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('engineUrl')}rest/organizations/${Cypress.env('organizationCode')}/projects`,
    auth: {
      bearer: Cypress.env('authAccessToken'),
    },
    body: {
      code,
      name,
    },
  });
});

Cypress.Commands.add('deleteOrganization', code => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('engineUrl')}rest/organizations/${code}`,
    auth: {
      bearer: Cypress.env('authAccessToken'),
    },
  });
});

Cypress.Commands.add('patchCurrentUser', user => {
  cy.request({
    method: 'PATCH',
    url: Cypress.env('engineUrl') + 'rest/users/current',
    body: user,
    auth: {
      bearer: Cypress.env('authAccessToken'),
    },
  });
});
