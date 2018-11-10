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

  // clear tokens in order to always start as unauthenticated user
  cy.clearLocalStorage();

  // first make the browser open our app so that we use its local storage
  cy.visit('/ui/auth');

  // login via auth0 API
  auth.login({username: 'user1@lumeer.io', password: 'userOne123'});

  // wait for the token
  cy.window({timeout: 30000}).should(() => {
    expect(window.localStorage.getItem('auth_id_token')).not.to.be.empty;
  });
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
