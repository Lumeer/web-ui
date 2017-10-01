/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

export interface Constraints {

  type: string;
  color: string;
  list: string[];

}

export const constraints: Constraints[] = [
  {
    type: 'numeric',
    color: '#5c93ff',
    list: [
      'IsNumber', '=', '>=', '<=', '<', '>', 'RoundedTo:', 'Decimal', 'Odd', 'Even', 'LessThan:', 'MoreThan:'
    ]
  },
  {
    type: 'text',
    color: '#ff513e',
    list: [
      'IsWord', 'ShorterThan:', 'LongerThan:', 'HasWords:', 'WordCount:', 'ContainsNumbers:', 'Uppercase',
      'Lowercase'
    ]
  },
  {
    type: 'special',
    color: '#6bf643',
    list: [
      'IsFullName', 'IsName', 'IsDate', 'IsTime', 'IsMoney', 'OneOf:', 'IsGender'
    ]
  }
];
