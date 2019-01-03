describe('Initial web page loading', () => {
  it('Opens Lumeer and waits to be redirected to the default project', () => {
    cy.visit('/ui');
    cy.contains('Collections');
    cy.location('pathname').should('have.string', '/view/search/all');
  });
});
