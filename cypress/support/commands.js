import {WebAuth} from 'auth0-js';
import './commands/rest.commands.js';
import './commands/visit.commands.js';
import Cookies from 'js-cookie';
import {SessionType} from '../../src/app/auth/common/session-type';

Cypress.Commands.add('login', () => {
  const auth = new WebAuth({
    audience: Cypress.env('engineServer'),
    domain: Cypress.env('auth0Domain'),
    clientID: Cypress.env('auth0ClientId'),
    redirectUri: Cypress.config('baseUrl') + '/auth',
    responseType: 'code',
    scope: 'openid profile email',
  });

  const lumeerAuth = window['lumeerAuth'];
  if (lumeerAuth) {
    // restore tokens from previous login
    const {authAccessToken, authExpiresAt} = lumeerAuth;
    Cypress.env('authAccessToken', authAccessToken);
    window.localStorage.setItem('auth_access_token', authAccessToken);
    window.localStorage.setItem('auth_expires_at', authExpiresAt);
  } else {
    // we will skip session type screen
    Cookies.set('auth_session_handling', SessionType.NeverAsk);
    // login via auth0 API
    auth.login({username: Cypress.env('username'), password: Cypress.env('password')});

    // wait for the token
    cy.window({timeout: 30000}).should(() => {
      expect(window.localStorage.getItem('auth_access_token')).not.to.be.empty;
      Cypress.env('authAccessToken', window.localStorage.getItem('auth_access_token'));
      window['lumeerAuth'] = {
        authAccessToken: window.localStorage.getItem('auth_access_token'),
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
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_expires_at');
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
    videoShowed: true,
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
  cy.get('modal-container').should('not.exist');
});
