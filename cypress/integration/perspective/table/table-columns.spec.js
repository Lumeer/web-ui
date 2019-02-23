describe('Table perspective :: Columns', () => {
  it('adds new columns right and left in single table', () => {
    // create new collection and open it in a table
    cy.createCollection('columns', 'fas fa-columns', '#cccccc').then(collection => cy.visitTable(collection.id));

    // select first column
    cy.get('[data-test="table-column-input"]')
      .should('contain', 'A')
      .click();

    // rename first column
    cy.focused()
      .trigger('keydown', {code: 'Backspace'})
      .type('First')
      .trigger('keydown', {code: 'Enter'});

    // TODO check REST API calls

    // verify column count and names
    cy.get('[data-test="table-column-input"]').should('have.length', 2);
    cy.get('[data-test="table-column-input"].text-default-attribute')
      .first()
      .should('contain', 'First');
    cy.get('[data-test="table-column-input"]')
      .last()
      .should('contain', 'A');

    // add new column left
    cy.get('[data-test="table-column-input"]')
      .first()
      .trigger('contextmenu');
    cy.get('[data-test="table-column-menu-add-left"]').click();

    // verify column count and names
    cy.get('[data-test="table-column-input"]').should('have.length', 3);
    cy.get('[data-test="table-column-input"]')
      .first()
      .should('contain', 'B')
      .click();

    // rename newly added column
    cy.focused()
      .type('Zeroth')
      .trigger('keydown', {code: 'Enter'});

    // verify column count and names
    cy.get('[data-test="table-column-input"]').should('have.length', 3);
    cy.get('[data-test="table-column-input"]')
      .first()
      .should('contain', 'Zeroth');

    // add new column right
    cy.get('[data-test="table-column-input"].text-default-attribute')
      .first()
      .should('contain', 'First')
      .trigger('contextmenu');
    cy.get('[data-test="table-column-menu-add-right"]').click();

    // verify column count and names
    cy.get('[data-test="table-column-input"]').should('have.length', 4);
    cy.get('[data-test="table-column-input"]')
      .eq(2)
      .should('contain', 'B');

    // add new column as the last one
    cy.get('[data-test="table-column-input"]')
      .last()
      .should('contain', 'A')
      .trigger('contextmenu');
    cy.get('[data-test="table-column-menu-add-right"]').click();
    cy.get('[data-test="table-column-input"]').should('have.length', 5);

    // rename last column
    cy.get('[data-test="table-column-input"]')
      .last()
      .should('contain', 'C')
      .trigger('contextmenu');
    cy.get('[data-test="table-column-menu-edit-name"]').click();
    cy.focused().trigger('keydown', {code: 'Enter'});

    // verify column count and names
    cy.get('[data-test="table-column-input"]').should('have.length', 6);
    cy.get('[data-test="table-column-input"]')
      .eq(4)
      .should('contain', 'C');
    cy.get('[data-test="table-column-input"]')
      .last()
      .should('contain', 'D');
  });

  // TODO add columns in linked table
});
