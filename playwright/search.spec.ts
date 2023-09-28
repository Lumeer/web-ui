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

import {test, expect} from '@playwright/test';

test.describe.configure({mode: 'serial'});

test('import table test', async ({page}) => {
  await page.goto('http://localhost:7000/ui/w/TSTLM/SCRUM/view/search/all');

  //await page.locator('button:has-text("Import Table")').click();
  await page.setInputFiles('input[type="file"]', 'playwright/data.csv');

  await expect(page.getByRole('link').filter({has: page.locator(`div:text("data")`)})).toBeVisible();

  await page
    .getByRole('link')
    .filter({has: page.locator(`div:text("data")`)})
    .click();
  await page.waitForTimeout(200);
});

test('basic full text search test', async ({page}) => {
  await page.goto('http://localhost:7000/ui/w/TSTLM/SCRUM/view/search/all');
  await page.locator('input[placeholder="Type anything you search for…"]').click();
  await page.locator('input[placeholder="Type anything you search for…"]').fill('browse');
  await page.locator('search-box').press('Enter');

  await page.getByRole('link', {name: 'User stories'}).click();
  await page.waitForLoadState('networkidle');

  // 2 for result, +1 for placeholder row.
  await expect(page.locator('table-body').locator('table-primary-row')).toHaveCount(2 + 1);
  const rows = await page.locator('table-body').locator('table-primary-row').all();
  await expect(rows[0]).toHaveText(/.*browse.*/);
  await expect(rows[1]).toHaveText(/.*browse.*/);
});

test('search test with specifying table', async ({page}) => {
  await page.goto('http://localhost:7000/ui/w/TSTLM/SCRUM/view/search/all');
  await page.locator('input[placeholder="Type anything you search for…"]').click();
  await page.locator('input[placeholder="Type anything you search for…"]').fill('Tasks');

  await page.getByText('Tasks Table').click();

  await page.locator('input[placeholder="Search or filter…"]').click();
  await page.getByText('Assignee Attribute').click();

  await page.locator('data-input div').click();
  await page.locator('a:has-text("uitest@lumeer.io")').click();
  await page.locator('input[placeholder="Search or filter…"]').press('Enter');

  await expect(page.locator('tasks-group task-wrapper')).toHaveCount(6);

  await page.waitForTimeout(200);
});
