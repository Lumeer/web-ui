describe('Table perspective :: Single cell', () => {
  it('enters values into a single table body cell', () => {
    // create new collection and open it in a table
    cy.createCollection('empty', 'fas fa-empty-set', '#cccccc').then(collection => cy.visitTable(collection.id));

    // check if there is only a single column called 'A'
    cy.get('[data-test="table-column-input"]', {timeout: 10000}).last().should('have.text', 'Add Column');

    // select the only table body cell
    cy.get('.text-input').should('not.exist');

    cy.get('[data-test="table-data-cell"]').first().click({force: true});

    // switch to edit mode by pressing Enter
    cy.focused()
      .should('have.attr', 'data-test', 'table-hidden-input')
      .should('have.value', '')
      .trigger('keydown', {code: 'Enter'});

    // leave edit mode by pressing Escape
    cy.focused().should('have.class', 'text-input').should('have.value', '').trigger('keydown', {code: 'Escape'});

    // check if the value is empty (bug LMR-1444) and switch to edit mode by double click
    cy.get('.text-input').should('not.exist');

    cy.get('[data-test="table-data-cell"]').first().dblclick();

    // type text into input and save changes by loosing focus
    const firstValue = '0'; // LMR-1463
    cy.get('.text-input').type(firstValue);
    cy.focused().should('have.class', 'text-input').trigger('keydown', {code: 'Tab'});
    //      .blur();

    // check if the first column has been initialized
    cy.get('[data-test="table-column-input"].text-default-attribute').first().should('have.text', 'A');

    // check if the second column has been added
    cy.get('[data-test="table-column-input"]').last().should('have.text', 'Add Column');

    // check if the table has only one cell (other are empty and not in DOM)
    cy.get('[data-test="table-data-input"]').should('have.length', 1);

    // select first table body cell
    cy.get('.text-input').first().should('have.text', firstValue).click({force: true});

    // switch to edit mode by typing a special character
    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').should('have.value', '').type('ř');

    // check if the first table cell input has the special character and discard changes
    cy.focused()
      .should('have.class', 'text-input')
      // .should('not.have.attr', 'readonly')
      .should('have.value', 'ř')
      .trigger('keydown', {code: 'Escape'});

    // check if the input value has been reverted back to the first one
    cy.get('.text-input').first().should('have.attr', 'readonly', 'readonly').should('have.text', firstValue);

    // start editing by pressing Enter
    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').type('s');

    // type second value and save changes by pressing Enter
    cy.focused().should('have.class', 'text-input').should('not.have.attr', 'readonly');
    cy.focused().type('econd value').trigger('keydown', {code: 'Enter'});

    // check if the second value has been saved
    cy.get('.text-input').should('have.attr', 'readonly', 'readonly').should('have.text', 'second value');
  });
});
