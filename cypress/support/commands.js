import auth0 from 'auth0-js';

Cypress.Commands.add('login', () => {
  const auth = new auth0.WebAuth({
    audience: Cypress.env('engineServer'),
    domain: Cypress.env('auth0Domain'),
    clientID: Cypress.env('auth0ClientId'),
    redirectUri: Cypress.config('baseUrl') + '/ui/auth',
    responseType: 'token id_token',
    scope: 'openid email profile name username groups roles',
  })

  // first make the browser open our app so that we use its local storage
  cy.visit('/ui/auth')
  // login via auth0 API
  auth.login({username: 'user1@lumeer.io', password: 'userOne123'})

  // wait for the token
  cy.window().its('localStorage').invoke('getItem', 'auth_id_token').should('exist')
});

// allows to perform actions using access token like calling backend API
Cypress.Commands.add('withToken', (fn) => {
  cy.window().its('localStorage').invoke('getItem', 'auth_access_token').then((token) => fn(token))
})

Cypress.Commands.add('logout', () => {
  // remove tokens from local storage
  cy.window().its('localStorage').then((localStorage) => {
    localStorage.removeItem('auth_id_token')
    localStorage.removeItem('auth_access_token')
  })
});

Cypress.Commands.add('dismissAgreement', () => {
  cy.withToken((token) => {
    // make sure to pass license agreement
    cy.request({
      method: 'PATCH',
      url: Cypress.env('engineUrl') + 'rest/users/current',
      body: {
        'agreement': true, 'newsletter': true
      },
      auth: {
        bearer: token
      }
    })
  })
})
