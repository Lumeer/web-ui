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

import {Component, EventEmitter, Input, Output} from '@angular/core';

import * as Const from '../../../../const';
import {PaletteComponent} from '../palette.component';

@Component({
  selector: 'icon-palette',
  templateUrl: './icon-palette.component.html',
  styleUrls: ['./icon-palette.component.scss']
})
export class IconPaletteComponent extends PaletteComponent {

  @Input('icon')
  public active: string;

  public icons = Const.someIcons;

  public iconHighlight(icon: string): string {
    if (icon === this.selected) {
      return 'selected';
    }

    if (icon === this.active) {
      return 'active';
    }

    return '';
  }

}
