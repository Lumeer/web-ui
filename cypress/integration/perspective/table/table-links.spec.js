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

    cy.get('[data-test="table-column-input"]', {timeout: 10000}).last().should('have.text', 'Add Column');

    cy.get('.text-input').should('not.exist');

    cy.get('[data-test="table-data-cell"]').first().dblclick();

    cy.focused().should('have.class', 'text-input').type('first value').blur();

    cy.wait('@createAttribute').its('status').should('eq', 200);
    cy.wait('@createDocument').its('status').should('eq', 200);

    cy.get('[data-test="table-column-input"].text-default-attribute').first().should('have.text', 'A');
    cy.get('[data-test="table-column-input"]').last().should('have.text', 'Add Column');
    cy.get('.text-input').should('have.length', 1);

    cy.get('.text-input').eq(2).should('not.exist');
    cy.get('[data-test="table-data-cell"]').eq(2).click({force: true});
    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').type('s');
    cy.focused().should('have.class', 'text-input').type('econd value').blur();
    cy.wait('@createDocument').its('status').should('eq', 200);
    cy.get('.text-input').should('have.length', 2);
    cy.get('[data-test="table-data-cell"]').should('have.length', 6);

    cy.get('[data-test="table-header-add-button"]').click();

    cy.get('[data-test="table-header-add-collection-option"]').contains('second').click({force: true});

    cy.waitForModalShown();
    cy.get('[data-test="link-name-input"]').should('have.value', 'first second');
    cy.get('[data-test="link-name-input"]').clear().type('link'); // workaround waiting for dialog close hook binding
    cy.get('[data-test="create-link-dialog-create-button"]').click();
    cy.waitForModalHidden();

    cy.get('[data-test="table-caption-name"]').should('contain', 'second');

    cy.get('[data-test="table-column-input"]').should('have.length', 3).first().should('have.text', 'A');
    cy.get('[data-test="table-column-input"]').should('have.length', 3).last().should('have.text', 'Add Column');

    cy.get('.text-input').should('have.length', 2);
    cy.get('[data-test="table-data-cell"]').should('have.length', 9);

    cy.get('[data-test="table-data-cell"]').eq(2).click({force: true});
    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').type('l');
    cy.focused().should('have.class', 'text-input').type('inked value').blur();

    cy.wait('@createAttribute').its('status').should('eq', 200);
    cy.wait('@createDocument').its('status').should('eq', 200);
    cy.wait('@createLinkInstance').its('status').should('eq', 200);

    cy.get('[data-test="table-column-input"]').should('have.length', 4).last().should('have.text', 'Add Column');
    cy.get('.text-input').should('have.length', 3);

    cy.get('[data-test="table-data-cell"]').eq(6).click({force: true});
    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').type('l');

    cy.get('[data-test="document-hints"]').should('be.visible');
    cy.get('[data-test="document-hint"]').contains('linked value').click();
    cy.get('[data-test="document-hints"]').should('not.exist');

    cy.wait('@createLinkInstance').its('status').should('eq', 200);

    cy.get('.text-input[title="linked value"]').should('have.length', 2);
  });
});
