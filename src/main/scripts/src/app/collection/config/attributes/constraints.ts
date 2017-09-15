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

import {ConstraintSuggestions} from './constraint-suggestions';

export const suggestions: ConstraintSuggestions[] = [
  {
    type: 'numeric',
    color: '#5c93ff',
    list: [
      'Is Number', 'Number', '=', '>=', '<=', '<', '>', 'Rounded to', 'Is Decimal', 'Decimal', 'Is Odd', 'Odd',
      'Is Even', 'Even', 'Less', 'Less Than', 'More', 'More Than'
    ]
  },
  {
    type: 'text',
    color: '#ff513e',
    list: [
      'Is Word', 'Word', 'Shorter than', 'Shorter', 'Longer than', 'Longer ', 'Words', 'Contains Numbers', 'Uppercase',
      'Lowercase', 'Camelcase'
    ]
  },
  {
    type: 'special',
    color: '#6bf643',
    list: [
      'Full Name', 'Name', 'Date', 'Time', 'Money', 'One of'
    ]
  }
];
