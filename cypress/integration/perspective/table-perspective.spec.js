describe('Table perspective', () => {
  it('adds linked table part', () => {
    cy.createCollection('first', 'fas fa-unicorn', '#ff66dd');
    cy.createCollection('second', 'fas fa-acorn', '#994400');

    cy.visitSearchCollections();

    cy.get('[data-test="collection-card"] i.fa-unicorn')
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
      .blur();

    cy.get('[data-test="table-single-column-input"].text-default-attribute')
      .first()
      .should('contain', 'A');
    cy.get('[data-test="table-single-column-input"]')
      .last()
      .should('contain', 'B');
    cy.get('[data-test="table-data-cell-input"]').should('have.length', 4);

    cy.get('[data-test="table-data-cell-input"]')
      .eq(2)
      .type('second value')
      .blur();
    cy.get('[data-test="table-data-cell-input"]').should('have.length', 6);

    cy.get('[data-test="table-header-add-button"]').click();

    cy.get('[data-test="table-header-add-collection-option"]')
      .contains('second')
      .click();

    cy.get('[data-test="dialog-title"]').should('be.visible');
    cy.get('[data-test="link-name-input"]').should('have.value', 'first second');
    cy.get('[data-test="link-name-input"]')
      .clear()
      .type('link'); // workaround waiting for dialog close hook binding
    cy.get('[data-test="create-link-dialog-create-button"]').click();
    cy.get('[data-test="dialog-title"]').should('not.exist');

    cy.get('[data-test="table-caption-name"]').should('contain', 'second');

    cy.get('[data-test="table-single-column-input"]')
      .should('have.length', 2)
      .should('contain', 'A');

    cy.get('[data-test="table-data-cell-input"]')
      .eq(1)
      .type('linked value')
      .blur();

    cy.get('[data-test="table-single-column-input"]')
      .should('have.length', 3)
      .last()
      .should('contain', 'B');
    cy.get('[data-test="table-data-cell-input"]').should('have.length', 9);

    cy.get('[data-test="table-data-cell-input"]')
      .eq(4)
      .type('l');

    cy.get('[data-test="document-hints"]').should('be.visible');
    cy.get('[data-test="document-hint"]').click();
    cy.get('[data-test="document-hints"]').should('not.exist');

    cy.get('[data-test="table-data-cell-input"]')
      .eq(4)
      .should('contain', 'linked value');
  });
});
