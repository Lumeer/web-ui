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

export class ShiftDateOfBlocklyComponent extends BlocklyComponent {
  private tooltip: string;
  private units: string[];
  private ops: string[];

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.shiftDateOfBlock:Aligns a date to either beginning or end of the closest time unit.`;
    this.units = $localize`:@@blockly.dropdown.units.shiftDateOfBlock:minute,hour,day,week,month,quarter,year`.split(
      ','
    );
    this.ops = $localize`:@@blockly.dropdown.ops.shiftDateOfBlock:start,end`.split(',');
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function, MasterBlockType.Link, MasterBlockType.Value];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.SHIFT_DATE_OF] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.SHIFT_DATE_OF,
          message0: '%{BKY_BLOCK_SHIFT_DATE_OF}', // %1 of %2 in %3
          args0: [
            {
              type: 'field_dropdown',
              name: 'OP',
              options: [
                [this_.ops[0], 'startOf'],
                [this_.ops[1], 'endOf'],
              ],
            },
            {
              type: 'field_dropdown',
              name: 'UNIT',
              options: [
                [this_.units[0], 'minute'],
                [this_.units[1], 'hour'],
                [this_.units[2], 'day'],
                [this_.units[3], 'week'],
                [this_.units[4], 'month'],
                [this_.units[5], 'quarter'],
                [this_.units[6], 'year'],
              ],
            },
            {
              type: 'input_value',
              name: 'DATE',
            },
          ],
          inputsInline: true,
          output: null,
          colour: COLOR_PINK,
          tooltip: this_.tooltip,
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.SHIFT_DATE_OF] = function (block) {
      const unit: string = block.getFieldValue('UNIT');
      const op: string = block.getFieldValue('OP');
      const input_date = Blockly.JavaScript.valueToCode(block, 'DATE', Blockly.JavaScript.ORDER_ATOMIC) || null;

      let code = '/** MomentJs **/ ';
      code += `moment(${input_date}).${op}('${unit}').toDate()`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
