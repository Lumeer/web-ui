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

test('do login', async ({page, request}) => {
  await page.goto('/ui');
  await page.click('a:text("Sign up")');
  await page.locator('input[placeholder="your@work.email"]').fill(userEmail);
  await page.locator('input[type=password]').fill(userPassword);
  await page.click('button:has(span:text("Sign Up"))');

  if (await page.locator('div[id=authorize-modal]').isVisible()) {
    await page.click('button[id=allow]');
  }

  const formData = new URLSearchParams();
  formData.append('userName', userEmail);
  formData.append('password', userPassword);

  const x = await request.post('http://localhost:8080/lumeer-engine/rest/users/login', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: formData.toString(),
  });

  const parsed_body = JSON.parse(await x.text());
  process.env.TEST_AUTH_TOKEN = parsed_body['access_token'];
});
