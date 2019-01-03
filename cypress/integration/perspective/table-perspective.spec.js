describe('Table perspective', () => {
  it('writes to first data cell in an empty table', () => {
    cy.createCollection('empty', 'fas fa-empty-set', '#cccccc');

    cy.visit(`/ui/w/${Cypress.env('organizationCode')}/${Cypress.env('projectCode')}/view/search/collections`);

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

  it('adds linked table part', () => {
    cy.createCollection('first', 'fas fa-unicorn', '#ff66dd');
    cy.createCollection('second', 'fas fa-acorn', '#994400');

    cy.visit(`/ui/w/${Cypress.env('organizationCode')}/${Cypress.env('projectCode')}/view/search/collections`);

    cy.get('[data-test="collection-card"] i.fa-unicorn')
      .last()
      .click();

    cy.get('[data-test="table-single-column-input"]')
      .last()
      .should('contain', 'A');

    // TODO create document through REST API instead
    cy.get('[data-test="table-data-cell-input"]')
      .first()
      .should('be.empty')
      .dblclick();
    cy.get('[data-test="table-data-cell-input"]')
      .first()
      .type('some value')
      .blur();

    cy.get('[data-test="table-single-column-input"].text-default-attribute')
      .first()
      .should('contain', 'A');

    cy.get('[data-test="table-header-add-button"]').click();

    cy.get('[data-test="table-header-add-collection-option"]')
      .contains('second')
      .click();

    cy.get('[data-test="create-link-dialog-create-button"]').click();

    cy.get('[data-test="table-caption-name"]').should('contain', 'second');

    cy.get('[data-test="table-single-column-input"]')
      .should('have.length', 2)
      .should('contain', 'A');

    cy.get('[data-test="table-data-cell-input"]').should('have.length', 4);
  });
});
