describe('Table perspective :: Columns', () => {
  it('adds new columns in a single table', () => {
    // create new collection and open it in a table
    cy.createCollection('columns', 'fas fa-columns', '#0000ff').then(collection => cy.visitTable(collection.id));

    // select first column
    cy.get('[data-test="table-column-input"]', {timeout: 10000}).should('have.text', 'A').click({force: true});

    // rename first column
    cy.focused().trigger('keydown', {code: 'Backspace'}).type('F');
    cy.focused().should('have.attr', 'data-test', 'table-column-input').type('irst');
    cy.get('[data-test="table-attribute-suggestions"]').should('be.visible');
    cy.get('[data-test="table-attribute-name-suggestion"]').click();
    cy.wait('@createAttribute').its('status').should('eq', 200);

    // verify column count and names
    cy.get('[data-test="table-column-input"]').should('have.length', 2);
    cy.get('[data-test="table-column-input"].text-default-attribute').first().should('have.text', 'First');
    cy.get('[data-test="table-column-input"]').last().should('have.text', 'A');

    // add new column left
    cy.get('[data-test="table-column-input"]').first().trigger('contextmenu', {force: true});
    cy.get('[data-test="table-column-menu-add-left"]').click({force: true});

    // verify column count and names
    cy.get('[data-test="table-column-input"]').should('have.length', 3);
    cy.get('[data-test="table-column-input"]').first().should('have.text', 'B').click({force: true});

    // rename newly added column
    cy.focused().type('Z');
    cy.focused()
      .should('have.attr', 'data-test', 'table-column-input')
      .type('eroth')
      .trigger('keydown', {code: 'Enter'});
    cy.wait('@createAttribute').its('status').should('eq', 200);

    // verify column count and names
    cy.get('[data-test="table-column-input"]').should('have.length', 3);
    cy.get('[data-test="table-column-input"]').first().should('have.text', 'Zeroth');

    // add new column right
    cy.get('[data-test="table-column-input"].text-default-attribute')
      .first()
      .should('have.text', 'First')
      .trigger('contextmenu', {force: true});
    cy.get('[data-test="table-column-menu-add-right"]').click({force: true});
    cy.get('body').click();

    // verify column count and names
    cy.get('[data-test="table-column-input"]').should('have.length', 4);
    cy.get('[data-test="table-column-input"]').eq(2).should('have.text', 'B');

    // add new column as the last one
    cy.get('[data-test="table-column-input"]').last().should('have.text', 'A').trigger('contextmenu', {force: true});
    cy.get('[data-test="table-column-menu-add-right"]').click({force: true});
    cy.get('body').click();
    cy.get('[data-test="table-column-input"]').should('have.length', 5);

    // rename last column
    cy.get('[data-test="table-column-input"]').last().should('have.text', 'C').trigger('contextmenu', {force: true});
    cy.get('[data-test="table-column-menu-edit-name"]').click({force: true});
    cy.focused().trigger('keydown', {code: 'Enter'});
    cy.wait('@createAttribute').its('status').should('eq', 200);

    // verify column count and names
    cy.get('[data-test="table-column-input"]').should('have.length', 6);
    cy.get('[data-test="table-column-input"]').eq(4).should('have.text', 'C');
    cy.get('[data-test="table-column-input"]').last().should('have.text', 'D');
  });

  it('adds new columns in linked tables', () => {
    // create new collection and open it in a table
    cy.createCollection('second', 'fas fa-columns', '#ff0000');
    cy.createCollection('first', 'fas fa-columns', '#00ff00').then(collection => cy.visitTable(collection.id));

    // select first column
    cy.get('[data-test="table-column-input"]', {timeout: 10000}).should('have.text', 'A').click({force: true});

    // init first column
    cy.focused().trigger('keydown', {code: 'Enter'});
    cy.get('[data-test="table-attribute-suggestions"]').should('be.visible');
    cy.get('[data-test="table-attribute-name-suggestion"]').click();
    cy.wait('@createAttribute').its('status').should('eq', 200);

    // verify column count and names
    cy.get('[data-test="table-column-input"]').should('have.length', 2);
    cy.get('[data-test="table-column-input"].text-default-attribute').first().should('have.text', 'A');
    cy.get('[data-test="table-column-input"]').last().should('have.text', 'B');

    // open link creation dialog
    cy.get('[data-test="table-header-add-button"]').click();
    cy.get('[data-test="table-header-add-collection-option"]').contains('second').click({foce: true});

    // rename link and save changes
    cy.waitForModalShown();
    cy.get('[data-test="create-link-dialog"]').should('be.visible');
    cy.get('[data-test="link-name-input"]').should('have.value', 'first second');
    cy.get('[data-test="link-name-input"]').clear().type('link'); // workaround waiting for dialog close hook binding
    cy.get('[data-test="create-link-dialog-create-button"]').click();
    cy.waitForModalHidden();
    cy.get('[data-test="create-link-dialog"]').should('not.be.visible');

    // verify table caption and columns
    cy.get('[data-test="table-caption-name"]').should('have.length', 2).last().should('contain', 'second');
    cy.get('[data-test="table-column-input"]').should('have.length', 3).first().should('have.text', 'A');
    cy.get('[data-test="table-column-input"]').should('have.length', 3).last().should('have.text', 'A');

    // init column in the second table
    cy.get('[data-test="table-column-input"]').last().click({force: true});
    cy.focused().trigger('keydown', {code: 'Enter'});
    cy.focused().should('have.attr', 'data-test', 'table-column-input').trigger('keydown', {code: 'Enter'});
    cy.wait('@createAttribute').its('status').should('eq', 200);

    // verify column count and names
    cy.get('[data-test="table-column-input"]').should('have.length', 4);
    cy.get('[data-test="table-column-input"]').last().should('have.text', 'B').click({force: true});

    // add new column left in first table
    cy.get('[data-test="table-column-input"]').first().trigger('contextmenu', {force: true});
    cy.get('[data-test="table-column-menu-add-left"]').click({force: true});

    // verify column count and names
    cy.get('[data-test="table-column-input"]').should('have.length', 5);
    cy.get('[data-test="table-column-input"]').first().should('have.text', 'C').click({force: true});

    // init first column by renaming it
    cy.focused().type('0');
    cy.focused().should('have.attr', 'data-test', 'table-column-input').trigger('keydown', {code: 'Enter'});
    cy.wait('@createAttribute').its('status').should('eq', 200);

    // verify column count and names
    cy.get('[data-test="table-column-input"]').should('have.length', 5);
    cy.get('[data-test="table-column-input"]').first().should('have.text', '0');

    // add new first column in the second table
    cy.get('[data-test="table-column-input"].text-default-attribute')
      .last()
      .should('have.text', 'A')
      .trigger('contextmenu', {force: true});
    cy.get('[data-test="table-column-menu-add-left"]').click({force: true});

    // verify column count and names
    cy.get('[data-test="table-column-input"]').should('have.length', 6);
    cy.get('[data-test="table-column-input"]').eq(3).should('have.text', 'C').click({force: true});

    // init first column in the second table
    cy.focused().type('C');
    cy.focused().should('have.attr', 'data-test', 'table-column-input').type('CC').trigger('keydown', {code: 'Enter'});
    cy.wait('@createAttribute').its('status').should('eq', 200);

    // verify column count and names
    cy.get('[data-test="table-column-input"]').should('have.length', 6);
    cy.get('[data-test="table-column-input"]').eq(3).should('have.text', 'CCC');
  });
});
