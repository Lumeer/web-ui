/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {ep} from '@fullcalendar/core/internal-common';
import {test, expect} from '@playwright/test';
import exp from 'constants';

test.describe.configure({mode: 'serial'});

test('import table test', async ({page}) => {
  await page.goto('http://localhost:7000/ui/w/TSTLM/SCRUM/view/search/all');

  await page.setInputFiles('input[type="file"]', 'playwright/data/data.csv');

  await expect(page.getByRole('link').filter({has: page.locator(`div:text("data")`)})).toBeVisible();

  await page
    .getByRole('link')
    .filter({has: page.locator(`div:text("data")`)})
    .click();
});

test('update imported table test', async ({page}) => {
  await page.goto('http://localhost:7000/ui/w/TSTLM/SCRUM/view/search/all');

  await expect(page.getByRole('link', {name: 'Tables'})).toBeVisible();

  await page.getByRole('link', {name: 'Tables'}).click();
  await page
    .getByRole('link')
    .filter({has: page.locator(`div:text("data")`)})
    .click();

  await page.locator('table-column-input:has-text("Created")').click({button: 'right'});
  await page.getByRole('menuitem', {name: 'Attribute settings...'}).click();

  await page.locator('button:has-text("None")').click();

  await page.locator('a').filter({hasText: 'Date'}).click();
  await page.getByRole('button', {name: 'DD.MM.YYYY'}).click();
  await page
    .locator('a')
    .filter({hasText: /^YYYY-MM-DD$/})
    .click();

  await page.getByRole('button', {name: 'Save'}).click();

  await page.locator('table-column-input:has-text("Status")').click({button: 'right'});
  await page.getByRole('menuitem', {name: 'Attribute settings...'}).click();
  await page.locator('button:has-text("None")').click();
  await page.locator('a').filter({hasText: 'Selection'}).click();
  await page.getByRole('button', {name: 'Save'}).click();

  await page.locator('table-column-input:has-text("Points")').click({button: 'right'});
  await page.getByRole('menuitem', {name: 'Attribute settings...'}).click();
  await page.locator('button:has-text("None")').click();
  await page.locator('a').filter({hasText: 'Number'}).click();
  await page.getByRole('button', {name: 'Save'}).click();
});
