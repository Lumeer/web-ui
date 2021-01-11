describe('Table perspective :: Constraints', () => {
  it('creates columns and enters values', () => {
    cy.createCollection('Rockets', 'fas fa-rocket', '#000000').then(collection => {
      cy.createCollection('Spacecrafts', 'fas fa-space-shuttle', '#76a5af');

      cy.visitTable(collection.id);
    });

    // create first record by entering value to the first cell

    cy.get('[data-test="table-data-cell"]', {timeout: 10000}).first().should('be.empty').dblclick();
    cy.focused().type('Falcon 1').trigger('keydown', {code: 'Enter'});

    cy.wait('@createAttribute').its('status').should('eq', 200);
    cy.wait('@createDocument').its('status').should('eq', 200);
    cy.get('[data-test="table-column-input"]').should('have.length', 2);
    cy.get('.text-input').should('have.length', 1).first().should('have.text', 'Falcon 1');

    // rename first column

    cy.get('[data-test="table-column-input"].text-default-attribute')
      .first()
      .should('have.value', 'A')
      .click({force: true});
    cy.focused()
      .should('have.attr', 'data-test', 'table-hidden-input')
      .should('have.value', '')
      .trigger('keydown', {code: 'Backspace'});
    cy.focused().should('have.attr', 'data-test', 'table-column-input').type('Name').trigger('keydown', {code: 'Tab'});

    cy.wait('@updateAttribute').its('status').should('eq', 200);
    cy.get('[data-test="table-column-input"]').should('have.length', 2).first().should('have.value', 'Name');

    // create second column

    cy.focused()
      .should('have.attr', 'data-test', 'table-hidden-input')
      .should('have.value', '')
      .trigger('keydown', {code: 'Backspace'});
    cy.focused()
      .should('have.attr', 'data-test', 'table-column-input')
      .should('have.value', '')
      .type('Active')
      .trigger('keydown', {code: 'Enter'});

    cy.wait('@createAttribute').its('status').should('eq', 200);
    cy.get('[data-test="table-column-input"]')
      .should('have.length', 3)
      .eq(1)
      .should('have.value', 'Active')
      .should('not.have.value', 'B');
    cy.get('[data-test="table-column-input"]').last().should('have.value', 'A');

    // enter value into the second cell

    cy.get('.text-input').eq(1).should('not.exist');
    cy.get('[data-test="table-data-cell"]').eq(1).click({force: true});
    cy.get('[data-test="table-column-input"]').eq(1).should('not.have.class', 'selected');
    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').type('n');
    cy.focused().should('have.class', 'text-input').type('o').trigger('keydown', {code: 'Tab'});

    cy.wait('@patchDocumentData').its('status').should('eq', 200);
    cy.get('.text-input').eq(1).should('have.text', 'no');

    // enter value into the third cell

    cy.get('.text-input').eq(2).should('not.exist');
    cy.get('[data-test="table-data-cell"]').eq(2).click({force: true});
    cy.focused().trigger('keydown', {code: 'Enter'});
    cy.focused().should('have.class', 'text-input').type('24.3.2006').blur();

    cy.wait('@createAttribute').its('status').should('eq', 200);
    cy.wait('@patchDocumentData').its('status').should('eq', 200);
    cy.get('[data-test="table-column-input"]').should('have.length', 4).last().should('have.value', 'B');
    cy.get('.text-input').should('have.length', 3);

    // rename third column

    cy.get('[data-test="table-column-input"]').eq(2).should('have.value', 'A').click({force: true});
    cy.focused().trigger('keydown', {code: 'Backspace'});
    cy.focused()
      .should('have.attr', 'data-test', 'table-column-input')
      .type('First flight')
      .trigger('keydown', {code: 'Tab'});

    cy.wait('@updateAttribute').its('status').should('eq', 200);
    cy.get('[data-test="table-column-input"]')
      .should('have.length', 4)
      .eq(2)
      .should('have.value', 'First flight')
      .should('not.have.value', 'A');

    // rename fourth column

    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').trigger('keydown', {code: 'Backspace'});
    cy.focused()
      .should('have.attr', 'data-test', 'table-column-input')
      .should('have.value', '')
      .type('Number of flights')
      .trigger('keydown', {code: 'Enter'});

    cy.wait('@createAttribute').its('status').should('eq', 200);
    cy.get('[data-test="table-column-input"]')
      .should('have.length', 5)
      .eq(3)
      .should('have.value', 'Number of flights')
      .should('not.have.value', 'A');
    cy.get('.text-input').should('have.length', 3);
    cy.get('[data-test="table-column-input"]').last().should('have.value', 'A');

    // enter value into the fourth cell

    cy.get('.text-input').eq(3).should('not.exist');
    cy.get('[data-test="table-data-cell"]').eq(3).click({force: true});
    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').trigger('keydown', {code: 'Enter'});
    cy.focused().should('have.class', 'text-input').type('four').blur();

    cy.wait('@patchDocumentData').its('status').should('eq', 200);
    cy.get('.text-input').eq(3).should('have.text', 'four');

    // create second record by entering first column value

    cy.get('.text-input').eq(5).should('not.exist');
    cy.get('[data-test="table-data-cell"]').eq(5).click({force: true});
    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').trigger('keydown', {code: 'Enter'});
    cy.focused().should('have.class', 'text-input').type('FALCON 9').trigger('keydown', {code: 'Tab'});

    cy.wait('@createDocument').its('status').should('eq', 200);
    cy.get('.text-input').should('have.length', 5).eq(4).should('have.text', 'FALCON 9');

    // enter second column value for the second record

    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').trigger('keydown', {code: 'Enter'});
    cy.focused()
      .should('have.class', 'text-input')
      .should('have.value', '')
      .type('yes')
      .trigger('keydown', {code: 'Tab'});

    cy.wait('@patchDocumentData').its('status').should('eq', 200);

    // enter third column value for the second record

    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').trigger('keydown', {code: 'Enter'});
    cy.focused()
      .should('have.class', 'text-input')
      .should('have.value', '')
      .type('2010')
      .trigger('keydown', {code: 'Tab'});

    cy.wait('@patchDocumentData').its('status').should('eq', 200);

    // enter fourth column value for the second record

    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').trigger('keydown', {code: 'Enter'});
    cy.focused()
      .should('have.class', 'text-input')
      .should('have.value', '')
      .type('69')
      .trigger('keydown', {code: 'Enter'});

    cy.wait('@patchDocumentData').its('status').should('eq', 200);

    // create third record by entering first column value

    cy.get('.text-input').eq(10).should('not.exist');
    cy.get('[data-test="table-data-cell"]').eq(10).click({force: true});
    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').trigger('keydown', {code: 'Enter'});
    cy.focused().should('have.class', 'text-input').type('falcon heavy').trigger('keydown', {code: 'Tab'});

    cy.wait('@createDocument').its('status').should('eq', 200);
    cy.get('.text-input').should('have.length', 9).eq(8).should('have.text', 'falcon heavy');

    // enter second column value for the third record

    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').trigger('keydown', {code: 'Enter'});
    cy.focused()
      .should('have.class', 'text-input')
      .should('have.value', '')
      .type('almost')
      .trigger('keydown', {code: 'Tab'});

    cy.wait('@patchDocumentData').its('status').should('eq', 200);

    // enter third column value for the third record

    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').trigger('keydown', {code: 'Enter'});
    cy.focused()
      .should('have.class', 'text-input')
      .should('have.value', '')
      .type('last year')
      .trigger('keydown', {code: 'Tab'});

    cy.wait('@patchDocumentData').its('status').should('eq', 200);

    // create fourth record by entering first column value

    cy.get('.text-input').eq(15).should('not.exist');
    cy.get('[data-test="table-data-cell"]').eq(15).click({force: true});
    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').trigger('keydown', {code: 'Enter'});
    cy.focused().should('have.class', 'text-input').type('Super heavy').trigger('keydown', {code: 'Tab'});

    cy.wait('@createDocument').its('status').should('eq', 200);
    cy.get('.text-input').should('have.length', 12).eq(11).should('have.text', 'Super heavy');

    // skip second and third column value for the fourth record

    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').trigger('keydown', {code: 'Tab'});
    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').trigger('keydown', {code: 'Tab'});

    // enter fourth column value for the fourth record

    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').trigger('keydown', {code: 'Enter'});
    cy.focused()
      .should('have.class', 'text-input')
      .should('have.value', '')
      .type('0')
      .trigger('keydown', {code: 'Enter'});

    cy.wait('@patchDocumentData').its('status').should('eq', 200);
    cy.get('.text-input').eq(12).should('have.text', '0');
  });

  it('changes column types and modifies some values', () => {
    cy.createCollection('Rockets', 'fas fa-rocket', '#000000').then(collection => {
      cy.createCollectionAttributes(collection.id, [
        {name: 'Name'},
        {name: 'Active'},
        {name: 'First flight'},
        {name: 'Number of flights'},
      ]);
      cy.createDocument(collection.id, {a1: 'Falcon 1', a2: 'no', a3: '2006-03-24', a4: 'four'});
      cy.createDocument(collection.id, {a1: 'FALCON 9', a2: 'yes', a3: '2010', a4: '69'});
      cy.createDocument(collection.id, {a1: 'falcon heavy', a2: 'almost', a3: 'last year'});
      cy.createDocument(collection.id, {a1: 'Super heavy', a4: '0'});

      cy.visitTable(collection.id);
    });

    // change first column type to text

    cy.get('[data-test="table-column-input"]', {timeout: 10000})
      .first()
      .should('have.value', 'Name')
      .trigger('contextmenu', {force: true});
    cy.get('[data-test="table-column-menu-change-constraint"]').click({force: true});

    cy.waitForModalShown();
    cy.get('[data-test="attribute-type-dialog"]').should('be.visible');
    cy.get('[data-test="attribute-type-select"]').click();
    cy.get('[data-test="select-item-option"]').contains('Text').click();
    cy.get('[data-test="text-constraint-case-style-select"]').click();
    cy.get('[data-test="select-item-option"]').contains('Every first letter upper case').click();
    cy.get('[data-test="attribute-type-save-button"]').click();
    cy.wait('@updateAttribute').its('status').should('eq', 200);
    cy.waitForModalHidden();
    cy.get('[data-test="attribute-type-dialog"]').should('not.exist');

    // check format of first column values

    cy.get('.text-input').first().should('have.text', 'Falcon 1');
    cy.get('.text-input').eq(4).should('have.text', 'FALCON 9');
    cy.get('.text-input').eq(8).should('have.text', 'Falcon Heavy');
    cy.get('.text-input').eq(11).should('have.text', 'Super Heavy');

    // change second column type to boolean

    cy.get('[data-test="table-column-input"]')
      .eq(1)
      .should('have.value', 'Active')
      .trigger('contextmenu', {force: true});
    cy.get('[data-test="table-column-menu-change-constraint"]').click({force: true});

    cy.waitForModalShown();
    cy.get('[data-test="attribute-type-dialog"]').should('be.visible');
    cy.get('[data-test="attribute-type-select"]').click();
    cy.get('[data-test="select-item-option"]').contains('Checkbox').click();
    cy.get('[data-test="attribute-type-save-button"]').click();
    cy.wait('@updateAttribute').its('status').should('eq', 200);
    cy.waitForModalHidden();
    cy.get('[data-test="attribute-type-dialog"]').should('not.exist');

    // check format of second column values and make some changes

    cy.get('.boolean-input').first().should('not.have.attr', 'checked');
    cy.get('.boolean-input').eq(1).should('have.attr', 'checked');
    cy.get('.boolean-input').eq(2).should('not.have.attr', 'checked');
    cy.get('.boolean-input').eq(3).should('not.have.attr', 'checked');

    cy.get('[data-test="table-data-input"] > *').eq(2).click();
    cy.wait('@patchDocumentData').its('status').should('eq', 200);
    cy.get('.boolean-input').eq(2).should('have.attr', 'checked');

    // change third column type to date

    cy.get('[data-test="table-column-input"]')
      .eq(2)
      .should('have.value', 'First flight')
      .trigger('contextmenu', {force: true});
    cy.get('[data-test="table-column-menu-change-constraint"]').click({force: true});

    cy.waitForModalShown();
    cy.get('[data-test="attribute-type-dialog"]').should('be.visible');
    cy.get('[data-test="attribute-type-select"]').click();
    cy.get('[data-test="select-item-option"]').contains('Date').click();
    cy.get('[data-test="datetime-constraint-format-select"]').click();
    cy.get('[data-test="select-item-option"]').contains('YYYY-MM-DD').click();
    cy.get('[data-test="attribute-type-save-button"]').click();
    cy.wait('@updateAttribute').its('status').should('eq', 200);
    cy.waitForModalHidden();
    cy.get('[data-test="attribute-type-dialog"]').should('not.exist');

    // check format of third column values

    cy.get('.datetime-input').first().should('have.text', '2006-03-24');
    cy.get('.datetime-input').eq(1).should('have.text', '2010-01-01');
    cy.get('.datetime-input').eq(2).should('have.text', 'last year');
    cy.get('.datetime-input').eq(3).should('not.exist');

    // change date value in the second row

    cy.get('.datetime-input').eq(1).dblclick();

    cy.contains('button.current', 'January').click();
    cy.contains('td[role="gridcell"] > span', 'July').click(); // bug in ngx-bootstrap (June)
    cy.contains('td[role="gridcell"] > span', '4').click();
    cy.get('[data-test="date-time-picker-save-button"]').click();

    cy.wait('@patchDocumentData').its('status').should('eq', 200);
    cy.get('.datetime-input').eq(1).should('have.text', '2010-07-04'); // bug in ngx-bootstrap (2010-06-04)

    // change date value in the third row

    cy.get('.datetime-input').eq(2).click({force: true});
    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').trigger('keydown', {code: 'Enter'});

    cy.contains('button.current', new Date().getFullYear()).click();
    cy.contains('td[role="gridcell"] > span', '2018').click();
    cy.contains('td[role="gridcell"] > span', 'January').click(); // bug in ngx-bootstrap (February)
    cy.contains('td[role="gridcell"] > span', /^6$/).click();
    cy.get('[data-test="date-time-picker-save-button"]').click();

    cy.wait('@patchDocumentData').its('status').should('eq', 200);
    cy.get('.datetime-input').eq(2).should('have.text', '2018-01-06'); // bug in ngx-bootstrap (2018-02-06)

    // change date value in the fourth row

    cy.get('.datetime-input').eq(3).should('not.exist');
    cy.get('[data-test="table-data-cell"]').eq(17).click({force: true});
    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').type('2');
    cy.focused().should('have.class', 'datetime-input').type('020').trigger('keydown', {code: 'Enter'});

    cy.wait('@patchDocumentData').its('status').should('eq', 200);
    cy.get('.datetime-input').eq(3).should('have.text', '2020-01-01');

    cy.get('.datetime-input').eq(3).dblclick();
    cy.focused().should('have.class', 'datetime-input').clear().trigger('keydown', {code: 'Enter'});

    cy.wait('@patchDocumentData').its('status').should('eq', 200);
    cy.get('.datetime-input').eq(3).should('not.exist');

    // change fourth column type to number

    cy.get('[data-test="table-column-input"]')
      .eq(3)
      .should('have.value', 'Number of flights')
      .trigger('contextmenu', {force: true});
    cy.get('[data-test="table-column-menu-change-constraint"]').click({force: true});

    cy.waitForModalShown();
    cy.get('[data-test="attribute-type-dialog"]').should('be.visible');
    cy.get('[data-test="attribute-type-select"]').click();
    cy.get('[data-test="select-item-option"]').contains('Number').click();
    cy.get('[data-test="attribute-type-save-button"]').click();
    cy.wait('@updateAttribute').its('status').should('eq', 200);
    cy.waitForModalHidden();
    cy.get('[data-test="attribute-type-dialog"]').should('not.exist');

    // check values in the fourth column

    cy.get('.number-input').eq(0).should('have.text', 'four');
    cy.get('.number-input').eq(1).should('have.text', '69');
    cy.get('.number-input').eq(2).should('have.text', '0');

    // change number in the first row

    cy.get('.number-input').first().should('have.text', 'four').click({force: true});
    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').type('4');
    cy.focused().should('have.class', 'number-input').should('have.value', '4').trigger('keydown', {code: 'Enter'});

    cy.wait('@patchDocumentData').its('status').should('eq', 200);
    cy.get('.number-input').first().should('have.text', '4');

    // change number in the third row

    cy.get('[data-test="table-data-cell"]').eq(13).click({force: true});
    cy.focused().should('have.attr', 'data-test', 'table-hidden-input').type('1');
    cy.focused().should('have.class', 'number-input').should('have.value', '1').trigger('keydown', {code: 'Enter'});

    cy.wait('@patchDocumentData').its('status').should('eq', 200);
    cy.get('.number-input').eq(2).should('have.text', '1');

    // remove number in the fourth row

    cy.get('.number-input').eq(3).should('have.text', '0').dblclick();
    cy.focused()
      .should('have.class', 'number-input')
      .should('have.value', '0')
      .clear()
      .trigger('keydown', {code: 'Enter'});

    cy.wait('@patchDocumentData').its('status').should('eq', 200);
    cy.get('.number-input').eq(3).should('not.exist');
  });
});
