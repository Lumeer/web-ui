describe('Table perspective :: Links', () => {
  it('adds linked table part', () => {
    cy.createCollection('first', 'fas fa-unicorn', '#ff66dd').then(collection => {
      cy.createCollection('second', 'fas fa-acorn', '#994400');

      // other collections created to test LMR-1465
      cy.createCollection('third', 'fas fa-empty-set', '#cccccc');
      cy.createCollection('fourth', 'fas fa-empty-set', '#cccccc');
      cy.createCollection('fifth', 'fas fa-empty-set', '#cccccc');
      cy.createCollection('sixth', 'fas fa-empty-set', '#cccccc');
      cy.createCollection('seventh', 'fas fa-empty-set', '#cccccc');
      cy.createCollection('eighth', 'fas fa-empty-set', '#cccccc');
      cy.createCollection('ninth', 'fas fa-empty-set', '#cccccc');
      cy.createCollection('tenth', 'fas fa-empty-set', '#cccccc');
      cy.createCollection('eleventh', 'fas fa-empty-set', '#cccccc');
      cy.createCollection('twelfth', 'fas fa-empty-set', '#cccccc');
      cy.createCollection('thirteenth', 'fas fa-empty-set', '#cccccc');
      cy.createCollection('fourteenth', 'fas fa-empty-set', '#cccccc');
      cy.createCollection('fifteenth', 'fas fa-empty-set', '#cccccc');
      cy.createCollection('sixteenth', 'fas fa-empty-set', '#cccccc');

      cy.visitTable(collection.id);
    });

    cy.get('[data-test="table-column-input"]')
      .last()
      .should('contain', 'A');

    cy.get('[data-test="text-data-input"]')
      .first()
      .should('be.empty')
      .dblclick();
    cy.focused()
      .should('have.attr', 'data-test', 'text-data-input')
      .type('first value')
      .blur();

    cy.wait('@createAttribute')
      .its('status')
      .should('eq', 200);
    cy.wait('@createDocument')
      .its('status')
      .should('eq', 200);

    cy.get('[data-test="table-column-input"].text-default-attribute')
      .first()
      .should('contain', 'A');
    cy.get('[data-test="table-column-input"]')
      .last()
      .should('contain', 'B');
    cy.get('[data-test="text-data-input"]').should('have.length', 4);

    cy.get('[data-test="text-data-input"]')
      .eq(2)
      .type('second value')
      .blur();
    cy.wait('@createDocument')
      .its('status')
      .should('eq', 200);
    cy.get('[data-test="text-data-input"]').should('have.length', 6);

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

    cy.get('[data-test="table-column-input"]')
      .should('have.length', 2)
      .should('contain', 'A');

    cy.get('[data-test="text-data-input"]')
      .eq(1)
      .type('linked value')
      .blur();

    cy.wait('@createAttribute')
      .its('status')
      .should('eq', 200);
    cy.wait('@createDocument')
      .its('status')
      .should('eq', 200);
    cy.wait('@createLinkInstance')
      .its('status')
      .should('eq', 200);

    cy.get('[data-test="table-column-input"]')
      .should('have.length', 3)
      .last()
      .should('contain', 'B');
    cy.get('[data-test="text-data-input"]').should('have.length', 9);

    cy.get('[data-test="text-data-input"]')
      .eq(4)
      .type('l');

    cy.get('[data-test="document-hints"]').should('be.visible');
    cy.get('[data-test="document-hint"]')
      .contains('linked value')
      .click();
    cy.get('[data-test="document-hints"]').should('not.exist');

    cy.wait('@createLinkInstance')
      .its('status')
      .should('eq', 200);

    cy.get('[data-test="text-data-input"][title="linked value"]').should('have.length', 2);
  });
});
