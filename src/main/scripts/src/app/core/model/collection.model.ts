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

import {Collection} from '../dto/collection';

export const defaultIcon = 'fa-book';
export const defaultIconColor = '#000000';

export class CollectionModel implements Collection {

  public code: string;
  public name: string = '';
  public color: string = defaultIconColor;
  public icon: string = defaultIcon;
  public documentCount: number;
  public pickerVisible: boolean = false;

  public toDto(): Collection {
    return {
      code: this.code,
      name: this.name,
      color: this.color,
      icon: this.icon,
      documentCount: this.documentCount
    };
  }

}
