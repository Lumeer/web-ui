import {WebAuth} from 'auth0-js';

Cypress.Commands.add('login', () => {
  const auth = new WebAuth({
    audience: Cypress.env('engineServer'),
    domain: Cypress.env('auth0Domain'),
    clientID: Cypress.env('auth0ClientId'),
    redirectUri: Cypress.config('baseUrl') + '/ui/auth',
    responseType: 'token id_token',
    scope: 'openid email profile name username groups roles',
  });

  const lumeerAuth = window['lumeerAuth'];
  if (lumeerAuth) {
    // restore tokens from previous login
    const {authAccessToken, authIdToken, authExpiresAt} = lumeerAuth;
    Cypress.env('authAccessToken', authAccessToken);
    window.localStorage.setItem('auth_access_token', authAccessToken);
    window.localStorage.setItem('auth_id_token', authIdToken);
    window.localStorage.setItem('auth_expires_at', authExpiresAt);
  } else {
    // login via auth0 API
    auth.login({username: Cypress.env('username'), password: Cypress.env('password')});

    // wait for the token
    cy.window({timeout: 30000}).should(() => {
      expect(window.localStorage.getItem('auth_id_token')).not.to.be.empty;
      Cypress.env('authAccessToken', window.localStorage.getItem('auth_access_token'));
      window['lumeerAuth'] = {
        authAccessToken: window.localStorage.getItem('auth_access_token'),
        authIdToken: window.localStorage.getItem('auth_id_token'),
        authExpiresAt: window.localStorage.getItem('auth_expires_at'),
      };
    });
  }
});

Cypress.Commands.add('loginAndDismissAgreement', () => {
  const lumeerAuth = window['lumeerAuth'];

  cy.login();

  if (!lumeerAuth) {
    cy.dismissAgreement();
  }
});

// allows to perform actions using access token like calling backend API
Cypress.Commands.add('withToken', fn => {
  cy.window()
    .its('localStorage')
    .invoke('getItem', 'auth_access_token')
    .then(token => fn(token));
});

Cypress.Commands.add('logout', () => {
  // remove tokens from local storage
  cy.window()
    .its('localStorage')
    .then(localStorage => {
      localStorage.removeItem('auth_id_token');
      localStorage.removeItem('auth_access_token');
    });
});

Cypress.Commands.add('dismissAgreement', () => {
  cy.withToken(token => {
    // make sure to pass license agreement
    cy.request({
      method: 'PATCH',
      url: Cypress.env('engineUrl') + 'rest/users/current',
      body: {
        agreement: true,
        newsletter: true,
      },
      auth: {
        bearer: token,
      },
    });

    function pollAgreementStatus(tries = 0) {
      cy.request({
        method: 'GET',
        url: Cypress.env('engineUrl') + 'rest/users/current',
        auth: {
          bearer: token,
        },
      })
        .its('body')
        .then(user => {
          if (user.agreement) {
            return;
          }

          if (tries < 10) {
            pollAgreementStatus(tries + 1);
          } else {
            assert.fail(false, true, 'Expected user agreement to be true');
          }
        });
    }

    pollAgreementStatus();

    cy.request({
      method: 'GET',
      url: Cypress.env('engineUrl') + 'rest/organizations',
      auth: {
        bearer: token,
      },
    })
      .its('body')
      .its('length')
      .should('gt', 0);
  });
});

Cypress.Commands.add('createCollection', (name, icon, color) => {
  cy.request({
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

Cypress.Commands.add('visitSearchCollections', () => {
  cy.visit(`/ui/w/${Cypress.env('organizationCode')}/${Cypress.env('projectCode')}/view/search/collections`);
});
