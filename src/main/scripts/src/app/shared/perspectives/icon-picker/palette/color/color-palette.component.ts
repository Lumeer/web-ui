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

import {PaletteComponent} from '../palette.component';
import * as Const from '../../../../const';

@Component({
  selector: 'color-palette',
  templateUrl: './color-palette.component.html',
  styleUrls: ['./color-palette.component.scss']
})
export class ColorPaletteComponent extends PaletteComponent {

  @Input('color')
  public active: string;

  public colors = Const.someColors;

  public colorHighlight(color: string): string {
    if (color === this.selected) {
      return this.darken(color, 80);
    }

    if (color === this.active) {
      return this.darken(color, 40);
    }

    return 'transparent';
  }

  public darken(color: string, ammount: number): string {
    let hexToNumber = (start: number) => parseInt(color.substr(start, 2), 16);
    let r: number = hexToNumber(1);

    let g: number = hexToNumber(3);
    let b: number = hexToNumber(5);

    let positive = (num: number) => Math.max(num, 0);
    let subtractAmmount = (num: number) => positive(num - ammount);

    let darkR = subtractAmmount(r);
    let darkG = subtractAmmount(g);
    let darkB = subtractAmmount(b);

    return `rgb(${(darkR)}, ${darkG}, ${darkB})`;
  };

}
