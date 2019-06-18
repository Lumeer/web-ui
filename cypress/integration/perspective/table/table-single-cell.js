describe('Table perspective :: Single cell', () => {
  it('enters values into a single table body cell', () => {
    // create new collection and open it in a table
    cy.createCollection('empty', 'fas fa-empty-set', '#cccccc').then(collection => cy.visitTable(collection.id));

    // check if there is only a single column called 'A'
    cy.get('[data-test="table-column-input"]', {timeout: 10000})
      .last()
      .should('have.value', 'A');

    // select the only table body cell
    cy.get('[data-test="text-data-input"]')
      .should('have.value', '')
      .click();

    // switch to edit mode by pressing Enter
    cy.focused()
      .should('have.attr', 'data-test', 'table-hidden-input')
      .should('have.value', '')
      .trigger('keydown', {code: 'Enter'});

    // leave edit mode by pressing Escape
    cy.focused()
      .should('have.attr', 'data-test', 'text-data-input')
      .should('have.value', '')
      .trigger('keydown', {code: 'Escape'});

    // check if the value is empty (bug LMR-1444) and switch to edit mode by double click
    cy.get('[data-test="text-data-input"]')
      .should('have.attr', 'readonly', 'readonly')
      .should('have.value', '')
      .dblclick();

    // type text into input and save changes by loosing focus
    const firstValue = '0'; // LMR-1463
    cy.get('[data-test="text-data-input"]').type(firstValue);
    cy.focused()
      .should('have.attr', 'data-test', 'text-data-input')
      .trigger('keydown', {code: 'Tab'});
    //      .blur();

    // check if the first column has been initialized
    cy.get('[data-test="table-column-input"].text-default-attribute')
      .first()
      .should('have.value', 'A');

    // check if the second column has been added
    cy.get('[data-test="table-column-input"]')
      .last()
      .should('have.value', 'B');

    // check if the table consists of 2 columns and 2 rows
    cy.get('[data-test="table-data-input"]').should('have.length', 4);

    // select first table body cell
    cy.get('[data-test="text-data-input"]')
      .first()
      .should('have.value', firstValue)
      .click();

    // switch to edit mode by typing a special character
    cy.focused()
      .should('have.attr', 'data-test', 'table-hidden-input')
      .should('have.value', '')
      .type('ř');

    // check if the first table cell input has the special character and discard changes
    cy.focused()
      .should('have.attr', 'data-test', 'text-data-input')
      // .should('not.have.attr', 'readonly')
      .should('have.value', 'ř')
      .trigger('keydown', {code: 'Escape'});

    // check if the input value has been reverted back to the first one
    cy.get('[data-test="text-data-input"]')
      .first()
      .should('have.attr', 'readonly', 'readonly')
      .should('have.value', firstValue);

    // start editing by pressing Enter
    cy.focused()
      .should('have.attr', 'data-test', 'table-hidden-input')
      .type('s');

    // type second value and save changes by pressing Enter
    cy.focused()
      .should('have.attr', 'data-test', 'text-data-input')
      .should('not.have.attr', 'readonly');
    cy.focused()
      .type('econd value')
      .trigger('keydown', {code: 'Enter'});

    // check if the second value has been saved
    cy.get('[data-test="text-data-input"]')
      .should('have.attr', 'readonly', 'readonly')
      .should('have.value', 'second value');
  });
});
