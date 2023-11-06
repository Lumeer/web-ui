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

import {test, expect, Locator, Page} from '@playwright/test';
import {prepareTableViaApi} from './utils/helpers';

test.describe.configure({mode: 'serial'});

const tableName = 'kanbanTable';

test.beforeAll(async ({request}) => {
  await prepareTableViaApi(request, tableName);
});

const prepareKanbanBoard = async (page: Page) => {
  await page.goto('http://localhost:7000/ui/w/TSTLM/SCRUM/view/search/all');

  await page.getByRole('link', {name: 'Tables'}).click();
  await expect(page.getByRole('link', {name: tableName})).toBeVisible();

  const dataLink = await page
    .getByRole('link')
    .filter({has: page.locator(`div:text("${tableName}")`)})
    .getAttribute('href');

  const newUrl = dataLink.replace('table', 'kanban');
  await page.goto(newUrl);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', {name: 'Select attribute'}).waitFor();
  await expect(page.getByRole('button', {name: 'Select attribute'})).toBeVisible();
  await page.getByRole('button', {name: 'Select attribute'}).click();
  //in some cases without timeout it fails
  await page.waitForTimeout(500);
  await page.locator('a').filter({hasText: 'Status'}).click();
  await page.waitForTimeout(500);
};

test('Kanban board set header', async ({page}) => {
  await page.goto('http://localhost:7000/ui/w/TSTLM/SCRUM/view/search/all');

  await page.getByRole('link', {name: 'Tables'}).click();
  const dataLink = await page
    .getByRole('link')
    .filter({has: page.locator(`div:text("${tableName}")`)})
    .getAttribute('href');

  const newUrl = dataLink.replace('table', 'kanban');
  await page.goto(newUrl);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', {name: 'Select attribute'}).click();
  await expect(page.locator('a').filter({hasText: 'Status'})).toBeVisible();
  await page.waitForTimeout(500);

  await page.locator('a').filter({hasText: 'Status'}).click();

  await expect(page.locator('kanban-column')).toHaveCount(3);

  const columns = await page.locator('kanban-column').all();

  const checkStatus = async (col: Locator, status: 'Done' | 'In progress' | 'In backlog') => {
    const posts = await col.locator('post-it').all();

    await Promise.all(
      posts.map(async p => {
        const locator = p.locator('post-it-row').filter({hasText: ' Status'}).locator('span');
        await expect(locator).toHaveText(status);
      })
    );
  };

  await expect(columns[0].locator('kanban-column-header')).toHaveText('Done');
  await expect(columns[0].locator('post-it')).toHaveCount(1);
  await checkStatus(columns[0], 'Done');

  await expect(columns[1].locator('kanban-column-header')).toHaveText('In progress');
  await expect(columns[1].locator('post-it')).toHaveCount(3);
  await checkStatus(columns[1], 'In progress');

  await expect(columns[2].locator('kanban-column-header')).toHaveText('In backlog');
  await expect(columns[2].locator('post-it')).toHaveCount(1);
  await checkStatus(columns[2], 'In backlog');
});

test('dragging', async ({page}) => {
  await prepareKanbanBoard(page);

  // simulating drag and drop
  await page.locator('post-it:has-text("Analyze UI tests scenarios")').hover();
  await page.mouse.down();
  // needs to be twice to simulate dragover
  await page.locator('kanban-column').nth(0).locator('post-it').nth(0).hover();
  await page.locator('kanban-column').nth(0).locator('post-it').nth(0).hover();
  await page.mouse.up();

  //wait to register the change of status state
  await page.waitForTimeout(1000);
  await expect(page.locator('post-it:has-text("Analyze UI tests scenarios")')).toContainText('Done');

  await expect(page.locator('kanban-column').nth(0).locator('post-it')).toHaveCount(2);
  await expect(page.locator('kanban-column').nth(1).locator('post-it')).toHaveCount(2);

  // simulating drag and drop
  await page.locator('post-it:has-text("Analyze UI tests scenarios")').hover();
  await page.mouse.down();
  // needs to be twice to simulate dragover
  await page.locator('kanban-column').nth(1).locator('post-it').nth(0).hover();
  await page.locator('kanban-column').nth(1).locator('post-it').nth(0).hover();
  await page.mouse.up();

  //wait to register the change of status state
  await page.waitForTimeout(1000);
  await expect(page.locator('post-it:has-text("Analyze UI tests scenarios")')).toContainText('In progress');

  await expect(page.locator('kanban-column').nth(0).locator('post-it')).toHaveCount(1);
  await expect(page.locator('kanban-column').nth(1).locator('post-it')).toHaveCount(3);
});

test('tuning the rows', async ({page}) => {
  await prepareKanbanBoard(page);

  await page.locator('settings-button button').click();
  await page.locator('attribute-settings').filter({hasText: 'Created'}).click();
  await page.locator('attribute-settings').filter({hasText: 'Description'}).click();
  await page.locator('settings-button button').click();

  const postsRowsLocator = (await page.locator('post-it').all()).map(p => p.locator('post-it-row'));

  await Promise.all(
    postsRowsLocator.map(async p => {
      await expect(p).toHaveCount(4);
    })
  );

  await page.locator('settings-button button').click();
  await page.locator('attribute-settings').filter({hasText: 'Created'}).click();
  await page.locator('attribute-settings').filter({hasText: 'Description'}).click();
  await page.locator('settings-button button').click();

  await Promise.all(
    postsRowsLocator.map(async p => {
      await expect(p).toHaveCount(6);
    })
  );
});

test('drag the whole columns', async ({page}) => {
  await prepareKanbanBoard(page);

  await page.locator('kanban-column').nth(1).locator('kanban-column-header').hover();
  await page.mouse.down();
  await page.locator('kanban-column').locator('kanban-column-header').nth(0).hover();
  await page.locator('kanban-column').locator('kanban-column-header').nth(0).hover();
  await page.mouse.up();

  await expect(page.locator('kanban-column-header').nth(0)).toHaveText('In progress');
  await expect(page.locator('kanban-column-header').nth(1)).toHaveText('Done');

  await page.locator('kanban-column').nth(0).locator('kanban-column-header').hover();
  await page.mouse.down();
  await page.locator('kanban-column').locator('kanban-column-header').nth(1).hover();
  await page.locator('kanban-column').locator('kanban-column-header').nth(1).hover();
  await page.mouse.up();

  await page.waitForTimeout(1000);

  await expect(page.locator('kanban-column-header').nth(0)).toHaveText('Done');
  await expect(page.locator('kanban-column-header').nth(1)).toHaveText('In progress');
});

test('use due dates in kanban board', async ({page}) => {
  await prepareKanbanBoard(page);

  await page.getByRole('button', {name: 'Select due date'}).click();
  await page.locator('a').filter({hasText: 'Created'}).click();
  await Promise.all(
    (
      await page.locator('post-it-header').all()
    ).map(async p => {
      await expect(p).toContainText('Past due');
    })
  );

  await page.locator('kanban-stem-config data-input').click();
  await page.locator('a').filter({hasText: 'Done'}).click();
  await page.keyboard.press('Enter');
  await expect(page.locator('kanban-column:has-text("Done")')).not.toContainText('Past due');
});

test('summarize the cards', async ({page}) => {
  await prepareKanbanBoard(page);

  await page.getByRole('button', {name: 'Select attribute'}).click();
  await page.locator('a').filter({hasText: 'Points'}).click();

  await expect(page.locator('kanban-column-header').nth(0)).toContainText('11');
  await expect(page.locator('kanban-column-header').nth(1)).toContainText('37');
  await expect(page.locator('kanban-column-header').nth(2)).toContainText('3');
});

test('Add new record', async ({page}) => {
  await prepareKanbanBoard(page);

  await page
    .locator('kanban-column')
    .filter({hasText: 'In backlog'})
    .locator('button:has-text("Create New Record")')
    .click();

  await page.locator('data-resource-data-row').filter({hasText: 'Title'}).getByRole('textbox').dblclick();
  await page.locator('data-resource-data-row').filter({hasText: 'Title'}).getByRole('textbox').fill('New record');
  await page.locator('data-resource-data-row').filter({hasText: 'Title'}).getByRole('textbox').click();

  await page.locator('data-resource-data-row').filter({hasText: 'Information'}).getByRole('textbox').click();
  await page.waitForTimeout(500);
  await page.locator('data-resource-data-row').filter({hasText: 'Information'}).getByRole('textbox').dblclick();
  await page
    .locator('data-resource-data-row')
    .filter({hasText: 'Information'})
    .getByRole('textbox')
    .fill('Test information');
  await page.keyboard.press('Enter');

  await page.locator('button').filter({hasText: 'Done'}).click();

  await expect(
    page.locator('kanban-column').filter({hasText: 'In backlog'}).locator('post-it').filter({hasText: 'New record'})
  ).toBeVisible();
});

test('edit record', async ({page}) => {
  await prepareKanbanBoard(page);

  await page.getByText('Test information', {exact: true}).dblclick();
  await page.getByRole('textbox', {name: 'Test information'}).fill('Test information edited');
  await page.keyboard.press('Enter');

  await expect(page.locator('post-it-row:has-text("Test information edited")')).toBeVisible();
});

test('remove record', async ({page}) => {
  await prepareKanbanBoard(page);

  await page.locator('post-it:has-text("New Record")').getByTitle('Delete').click();
  await page.getByRole('button', {name: 'Yes'}).click();

  await expect(page.locator('post-it-row:has-text("New Record")')).not.toBeVisible();
});
