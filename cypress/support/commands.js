import {WebAuth} from 'auth0-js';
import './commands/rest.commands.js';
import './commands/visit.commands.js';
import {SessionType} from '../../src/app/auth/common/session-type';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const EXPIRES_AT_KEY = 'auth_expires_at';

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
    cy.setCookie(ACCESS_TOKEN_KEY, authAccessToken);
    cy.setCookie(EXPIRES_AT_KEY, authExpiresAt);
  } else {
    // we will skip session type screen
    cy.setCookie('auth_session_handling', SessionType.NeverAsk);
    // login via auth0 API
    auth.login({username: Cypress.env('username'), password: Cypress.env('password')});

    cy.waitForLogin();

    cy.getCookie(ACCESS_TOKEN_KEY)
      .then(cookie => cookie?.value)
      .then(token => {
        expect(token || '').not.to.be.empty;

        Cypress.env('authAccessToken', token);
        const authExpiresAt = new Date(24 * 60 * 60 * 1000 + new Date().getTime()).getTime();
        window['lumeerAuth'] = {authAccessToken: token, authExpiresAt: String(authExpiresAt)};
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

Cypress.Commands.add('waitForLogin', () => {
  const interval = 500;
  const timeout = 30000;
  let retries = Math.floor(timeout / interval);

  const check = result => {
    if (result) {
      return result;
    }
    if (retries < 1) {
      throw new Error('Waiting for login expired');
    }
    console.log('checking', retries);
    cy.wait(interval, {log: false}).then(() => {
      retries--;
      return resolveValue();
    });
  };

  const resolveValue = () => {
    return cy.getCookie(ACCESS_TOKEN_KEY).then(cookie => check(cookie?.value));
  };

  return resolveValue();
});
