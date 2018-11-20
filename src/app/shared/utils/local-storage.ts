/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

/**
 * Wrapper around Window.localStorage of WebStorage API
 */
export class LocalStorage {
  public static get(key: string): any {
    const data: string = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  public static set(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  public static remove(key: string) {
    localStorage.removeItem(key);
  }
}
