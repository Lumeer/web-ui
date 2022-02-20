Cypress.Commands.add('createCollection', (name, icon, color) => {
  return cy
    .request({
      method: 'POST',
      url: `${Cypress.env('projectRestUrl')}/collections`,
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

Cypress.Commands.add('createProject', (organizationId, code, name) => {
  return cy
    .request({
      method: 'POST',
      url: `${Cypress.env('engineUrl')}rest/organizations/${organizationId}/projects`,
      auth: {
        bearer: Cypress.env('authAccessToken'),
      },
      body: {
        code,
        name,
      },
    })
    .then(response => response.body);
});

Cypress.Commands.add('getOrganizationByCode', code => {
  return cy
    .request({
      method: 'GET',
      url: `${Cypress.env('engineUrl')}rest/organizations/code/${code}`,
      auth: {
        bearer: Cypress.env('authAccessToken'),
      },
    })
    .then(response => response.body);
});

Cypress.Commands.add('deleteOrganization', id => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('engineUrl')}rest/organizations/${id}`,
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

Cypress.Commands.add('setOnboarding', data => {
  cy.request({
    method: 'PUT',
    url: Cypress.env('engineUrl') + 'rest/users/current/onboarding',
    body: data,
    auth: {
      bearer: Cypress.env('authAccessToken'),
    },
  });
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
