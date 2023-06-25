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
import dotenv from 'dotenv';

dotenv.config();

const userEmail = process.env.USER_EMAIL ?? '';
const userPassword = process.env.USER_PASSWORD ?? '';

test('On boarding path', async ({page, request}) => {
  await page.goto('http://localhost:7000/ui');

  await expect(page.locator('form[class=auth0-lock-widget]')).toBeVisible();

  await page.locator('input[placeholder="your@work.email"]').fill(userEmail);
  await page.locator('input[type=password]').fill(userPassword);
  await page.click('button[type=submit]');

  await page.waitForLoadState('networkidle');

  await expect(page.locator('div[class=card-body]')).toBeVisible();
  await page.click('button:has(span:text("Yes"))');

  await page.waitForLoadState('networkidle');
  await expect(page.locator('form')).toBeVisible();
  await page.check('input[id=agreement]');
  await page.click('button[type=submit]');

  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[id=newsletter]')).toBeEnabled();
  await expect(page.locator('button[type=submit]:has-text("Continue")')).toBeEnabled();
  await page.click('button[type=submit]:has-text("Continue")');

  await page.click('div:text("Scrum")');
  await page.locator('button[type=button]:has-text("Use this template")').click();
  await page.locator('button[type=button]:has-text("I\'ll do it later")').click();

  await expect(page.locator('modal-wrapper')).toBeVisible();

  await request.post('http://localhost:8080/lumeer-engine/rest/users/current/emailVerified', {
    headers: {
      Authorization: `Bearer ${process.env.TEST_AUTH_TOKEN}`,
    },
  });

  await page.waitForLoadState('networkidle');

  await expect(page.locator('iframe[title="Lumeer: Quick Application Overview"]')).toBeVisible();
});
