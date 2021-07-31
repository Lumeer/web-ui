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

export function parseSelectTranslation(value: string, params: Record<string, any>): string {
  return Object.keys(params).reduce((previousValue, key) => {
    const firstPartRegex = `{${key},\\s*select\\s*,`;
    const regex = new RegExp(`${firstPartRegex}.*?}\\s*}`);
    let resultArray = previousValue.match(regex);
    while (resultArray?.[0]) {
      const result = resultArray?.[0].replace(new RegExp(firstPartRegex), '').trim();
      const selectParams = parseSelectParameters(result);
      const replaceValue = selectParams[params[key]] || '';
      previousValue = previousValue.replace(regex, replaceValue);
      resultArray = previousValue.match(regex);
    }
    return previousValue;
  }, value);
}

function parseSelectParameters(value: string): Record<string, string> {
  const params = {};

  let currentValue = value;
  while (currentValue.length > 1) {
    const startIndexOfParam = currentValue.indexOf('{');
    const endIndexOfParam = currentValue.indexOf('}');
    const key = currentValue.substring(0, startIndexOfParam).trim();
    params[key] = currentValue.substring(startIndexOfParam + 1, endIndexOfParam);
    currentValue = currentValue.substring(endIndexOfParam + 1, currentValue.length);
  }

  return params;
}
