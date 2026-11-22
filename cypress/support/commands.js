import {SessionType} from '../../src/app/auth/common/session-type';
import './commands/rest.commands.js';
import './commands/visit.commands.js';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const EXPIRES_AT_KEY = 'auth_expires_at';

const auth0Url = () => `https://${Cypress.env('auth0Domain')}`;

// Auth0 always asks for consent when redirect_uri is localhost, so the login flow is done via HTTP requests
// and the consent screen is accepted when shown. Yields the authorization code.
// The redirect URI must match the one configured in the engine (authRedirectUri env can override it).
Cypress.Commands.add('requestAuthorizationCode', () => {
  const redirectUri = Cypress.env('authRedirectUri') || Cypress.config('baseUrl') + '/auth';

  return cy
    .request({
      method: 'POST',
      url: `${auth0Url()}/co/authenticate`,
      headers: {Origin: new URL(redirectUri).origin},
      body: {
        client_id: Cypress.env('auth0ClientId'),
        username: Cypress.env('username'),
        password: Cypress.env('password'),
        credential_type: 'password',
      },
    })
    .then(response =>
      cy.request({
        url: `${auth0Url()}/authorize`,
        qs: {
          client_id: Cypress.env('auth0ClientId'),
          response_type: 'code',
          redirect_uri: redirectUri,
          scope: 'openid profile email',
          audience: Cypress.env('engineServer'),
          login_ticket: response.body.login_ticket,
          state: String(Date.now()),
        },
        followRedirect: false,
      })
    )
    .then(response => acceptConsentIfShown(response.headers.location))
    .then(location => {
      const code = new URL(location, auth0Url()).searchParams.get('code');
      expect(code || '', 'authorization code').not.to.be.empty;
      return code;
    });
});

function acceptConsentIfShown(location) {
  if (!location?.includes('/u/consent')) {
    return cy.wrap(location);
  }

  const consentUrl = new URL(location, auth0Url()).toString();
  return cy
    .request(consentUrl)
    .then(page => {
      const document = new DOMParser().parseFromString(page.body, 'text/html');
      const body = {action: 'accept'};
      document.querySelectorAll('form input[type=hidden]').forEach(input => (body[input.name] = input.value));
      return cy.request({method: 'POST', url: consentUrl, form: true, body, followRedirect: false});
    })
    .then(response => followAuth0Redirects(response.headers.location));
}

function followAuth0Redirects(location, remaining = 5) {
  const url = new URL(location, auth0Url());
  if (url.origin !== auth0Url() || remaining < 1) {
    return cy.wrap(location);
  }
  return cy
    .request({url: url.toString(), followRedirect: false})
    .then(response => followAuth0Redirects(response.headers.location, remaining - 1));
}

Cypress.Commands.add('login', () => {
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
    // login via auth0 API and exchange the code for tokens the same way the app does
    cy.requestAuthorizationCode()
      .then(code =>
        cy.request({
          method: 'POST',
          url: `${Cypress.env('engineUrl')}rest/auth/exchange-code`,
          qs: {code},
        })
      )
      .then(response => {
        const {accessToken, expiresIn} = response.body;
        expect(accessToken || '', 'access token').not.to.be.empty;

        const authExpiresAt = String(new Date().getTime() + expiresIn * 1000);
        Cypress.env('authAccessToken', accessToken);
        cy.setCookie(ACCESS_TOKEN_KEY, accessToken);
        cy.setCookie(EXPIRES_AT_KEY, authExpiresAt);
        window['lumeerAuth'] = {authAccessToken: accessToken, authExpiresAt};

        // the first authenticated request initializes a new user (incl. demo workspace) on the engine,
        // it has to be a read like in the app, otherwise a following user update could overwrite it
        cy.request({
          url: `${Cypress.env('engineUrl')}rest/users/current`,
          auth: {bearer: accessToken},
        });
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
