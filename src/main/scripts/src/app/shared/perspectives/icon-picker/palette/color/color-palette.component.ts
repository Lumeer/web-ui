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

import {Component, Input} from '@angular/core';

import {Palette} from '../palette';
import * as Const from '../../../../const';

@Component({
  selector: 'color-palette',
  templateUrl: './color-palette.component.html',
  styleUrls: ['./color-palette.component.scss']
})
export class ColorPaletteComponent extends Palette {

  @Input('color')
  public active: string;

  public colors = Const.colors;

  public colorHighlight(color: string): string {
    if (color === this.selected) {
      return this.darken(color, 80);
    }

    if (color === this.active) {
      return this.darken(color, 40);
    }

    return 'transparent';
  }

  public darken(color: string, amount: number): string {
    const hexToNumber = (start: number) => parseInt(color.substr(start, 2), 16);
    const subtractAmount = (num: number) => Math.max(0, (num - amount));

    const darkerColors: string = [hexToNumber(1), hexToNumber(3), hexToNumber(5)]
      .map(subtractAmount)
      .join(', ');

    return `rgb(${darkerColors})`;
  };

}
