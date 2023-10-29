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
import {loginApiCall} from './utils/apiCalls';

dotenv.config();

const authFile = 'playwright/.auth/user.json';

test.describe.configure({mode: 'serial'});

const userEmail = process.env.TEST_USER_EMAIL ?? '';
const userPassword = process.env.TEST_USER_PASSWORD ?? '';

test('On boarding path', async ({page, request}) => {
  await page.goto('http://localhost:7000/ui');

  await expect(page.locator('form[class=auth0-lock-widget]')).toBeVisible();
  await page.click('a:text("Sign up")');

  await page.locator('input[placeholder="your@work.email"]').fill(userEmail);
  await page.locator('input[type=password]').fill(userPassword);
  await page.click('button[type=submit]');

  await expect(page.locator('span:text("Authorize App")')).toBeVisible();
  await page.click('button[id="allow"]');

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

  const loginFormData = new URLSearchParams();
  loginFormData.append('userName', userEmail);
  loginFormData.append('password', userPassword);

  const loginReponse = await request.post('http://localhost:8080/lumeer-engine/rest/users/login', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: loginFormData.toString(),
  });

  const parsed_body = JSON.parse(await loginReponse.text());

  await request.post('http://localhost:8080/lumeer-engine/rest/users/current/emailVerified', {
    headers: {
      Authorization: `Bearer ${parsed_body['access_token']}`,
    },
  });

  await page.waitForTimeout(10000);

  if (await page.locator('button[type=button]:has-text("Reload")').isVisible()) {
    await page.locator('button[type=button]:has-text("Reload")').click();
  }

  await expect(page.locator('iframe[title="Lumeer: Quick Application Overview"]')).toBeVisible();

  await page.getByRole('button', {name: 'Get started'}).click();
  await page.waitForTimeout(1000);

  await page.getByRole('button', {name: 'Dismiss'}).click();
  await page.waitForTimeout(1000);

  await page.context().storageState({path: authFile});
});

test('prepare auth token', async ({request}) => {
  const loginParsedBody = await loginApiCall(request, userEmail, userPassword);
  const authToken = loginParsedBody['access_token'];

  if (!authToken) {
    throw new Error('could not login');
  }

  process.env.TEST_AUTH_TOKEN = authToken;
});
