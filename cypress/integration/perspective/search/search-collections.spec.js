describe('Search Perspective :: Collections', () => {
  it('creates first collection', () => {
    cy.dismissAppTour();

    cy.visit('/', {timeout: 10000});
    cy.url().should('contain', '/view/search/all');

    cy.get('[data-test="empty-project-header"]').should('be.visible');
    cy.get('[data-test="empty-data-create-collection"]').click();
    cy.url().should('contain', '/view/search/tables');

    cy.get('[data-test="icon-picker-dropdown"]').click();
    cy.get('[data-test="color-picker-saturated-color"]').first().click();
    cy.get('[data-test="icon-picker-search-input"]').type('train');
    cy.get('[data-test="icon-picker-option"]').should('have.length', 2).first().click();
    cy.get('[data-test="icon-picker-select-button"]').click();

    cy.get('[data-test="collection-card-name-input"]').type('Trains').blur();

    cy.wait('@createCollection').its('status').should('eq', 200);

    cy.get('[data-test="collection-card-icon"]').click();

    cy.url().should('contain', '/view/table');
    cy.get('[data-test="table-caption-name"]').should('contain', 'Trains');
  });
});
