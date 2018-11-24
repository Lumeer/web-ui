describe('Initial web page loading', function() {
  before(() => {
    cy.loginAndDismissAgreement();
  });

  it('Opens Lumeer and waits to be redirected to the default project', function() {
    cy.visit('/ui');
    cy.contains('Collections');
    cy.location('pathname').should('have.string', '/view/search/all');
  });
});
