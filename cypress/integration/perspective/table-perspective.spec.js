describe('Table perspective', function() {
  before(() => {
    cy.login();
    cy.dismissAgreement();
  });

  it('writes to first data cell in an empty table', () => {
    cy.createCollection('empty', 'fas fa-empty-set', '#cccccc');
    cy.visit('/ui/w/SRLMR/PRJ1/view/search/collections');

    cy.get('[data-test="collection-card"] i.fa-empty-set')
      .last()
      .click();

    cy.get('[data-test="table-single-column-input"]')
      .last()
      .should('contain', 'A');

    cy.get('[data-test="table-data-cell-input"]')
      .first()
      .should('be.empty')
      .dblclick();
    cy.get('[data-test="table-data-cell-input"]')
      .first()
      .type('first value')
      .blur(); // TODO use .type('{enter}') instead once it works

    cy.get('[data-test="table-single-column-input"].text-default-attribute')
      .first()
      .should('contain', 'A');

    cy.get('[data-test="table-single-column-input"]')
      .last()
      .should('contain', 'B');

    cy.get('[data-test="table-data-cell-input"]').should('have.length', 4);
  });
});
