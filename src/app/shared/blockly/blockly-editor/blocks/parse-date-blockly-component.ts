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

import {BlocklyComponent} from './blockly-component';
import {BlocklyUtils, MasterBlockType} from '../blockly-utils';
import {COLOR_PINK} from '../../../../core/constants';

declare var Blockly: any;

export class ParseDateBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.parseDateBlock:Parses a string date using given format returning milliseconds since epoch (Unix time).`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function, MasterBlockType.Link, MasterBlockType.Value];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.PARSE_DATE] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.PARSE_DATE,
          message0: '%{BKY_BLOCK_PARSE_DATE}', // parse date string %1 formatted as %2 with locale %3
          args0: [
            {
              type: 'input_value',
              name: 'DATE',
            },
            {
              type: 'input_value',
              name: 'FORMAT',
            },
            {
              type: 'input_value',
              name: 'LOCALE',
            },
          ],
          inputsInline: true,
          output: '',
          colour: COLOR_PINK,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.PARSE_DATE] = function (block) {
      const argumentDate = Blockly.JavaScript.valueToCode(block, 'DATE', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const argumentFormat =
        Blockly.JavaScript.valueToCode(block, 'FORMAT', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const argumentLocale =
        Blockly.JavaScript.valueToCode(block, 'LOCALE', Blockly.JavaScript.ORDER_ASSIGNMENT) || 'en';

      if (!argumentDate || !argumentFormat) {
        return '';
      }

      const code = 'parseMomentJsDate(' + argumentDate + ', ' + argumentFormat + ', ' + argumentLocale + ')';

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
