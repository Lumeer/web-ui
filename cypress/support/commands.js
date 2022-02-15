import {WebAuth} from 'auth0-js';
import './commands/rest.commands.js';
import './commands/visit.commands.js';

Cypress.Commands.add('login', () => {
  const auth = new WebAuth({
    audience: Cypress.env('engineServer'),
    domain: Cypress.env('auth0Domain'),
    clientID: Cypress.env('auth0ClientId'),
    redirectUri: Cypress.config('baseUrl') + '/auth',
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
    cy.dismissOnboardingVideo();
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
  // make sure to pass license agreement
  cy.patchCurrentUser({
    agreement: true,
    newsletter: true,
  });
});

Cypress.Commands.add('dismissOnboardingVideo', () => {
  // make sure to dismiss initial onboarding video
  cy.setOnboarding({
    videoPlayed: true,
  });
});

Cypress.Commands.add('dismissAppTour', () => {
  cy.patchCurrentUser({
    wizardDismissed: true,
  });
});

Cypress.Commands.add('waitForModalShown', () => {
  cy.get('modal-container').should('be.visible');
});

Cypress.Commands.add('waitForModalHidden', () => {
  cy.get('modal-container').should('not.be.visible');
});
