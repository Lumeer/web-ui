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

export class MsToUnitBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.msToUnitBlock:Converts time in milliseconds or a duration attribute to the given time unit.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function, MasterBlockType.Link, MasterBlockType.Value];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.MS_TO_UNIT] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.MS_TO_UNIT,
          message0: '%{BKY_BLOCK_DATE_MILLIS_TO_UNIT}', // milliseconds to %1 %2
          args0: [
            {
              type: 'field_dropdown',
              name: 'UNIT',
              options: [
                [Blockly.Msg['SEQUENCE_OPTIONS_DAYS'], 'DAYS'],
                [Blockly.Msg['SEQUENCE_OPTIONS_HOURS'], 'HOURS'],
                [Blockly.Msg['SEQUENCE_OPTIONS_MINUTES'], 'MINUTES'],
                [Blockly.Msg['SEQUENCE_OPTIONS_SECONDS'], 'SECONDS'],
              ],
            },
            {
              type: 'input_value',
              name: 'MS',
              check: 'Number',
            },
          ],
          output: 'Number',
          colour: COLOR_PINK,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.MS_TO_UNIT] = function (block) {
      const dropdown_unit = block.getFieldValue('UNIT');
      const value_ms = Blockly.JavaScript.valueToCode(block, 'MS', Blockly.JavaScript.ORDER_ATOMIC);
      let code = '(' + value_ms + '/';

      switch (dropdown_unit) {
        case 'SECONDS':
          code += '1000)';
          break;
        case 'MINUTES':
          code += '60000)';
          break;
        case 'HOURS':
          code += '3600000)';
          break;
        case 'DAYS':
          code += '86400000)';
          break;
      }

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
