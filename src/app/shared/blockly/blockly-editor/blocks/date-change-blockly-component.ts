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
import {COLOR_PINK} from '../../../../core/constants';
import {BlocklyUtils, MasterBlockType} from '../blockly-utils';
import {BlocklyComponent} from './blockly-component';

declare var Blockly: any;

export class DateChangeBlocklyComponent extends BlocklyComponent {
  private tooltip: string;
  private units: string[];
  private ops: string[];

  private readonly BUSINESS_DAY = 'businessDay';

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.dateChangeBlock:Changes a date object returning the new updated date object. Apply date to ISO to store it in a date/time attribute.`;
    this.units =
      $localize`:@@blockly.dropdown.units.dateChangeBlock:second(s),minute(s),hour(s),day(s),business day(s),week(s),month(s),month(s) (stick to end of month),quarter(s),quarter(s) (stick to end of month),year(s),year(s) (stick to end of month)`
        .replace(/ /g, '\u00A0')
        .split(',');
    this.ops = $localize`:@@blockly.dropdown.ops.dateChangeBlock:add,subtract,set`.split(',');
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Link, MasterBlockType.Function];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.DATE_CHANGE] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.DATE_CHANGE,
          message0: '%{BKY_BLOCK_DATE_CHANGE}', // %1 %2 %3 to/from/in date %4
          args0: [
            {
              type: 'field_dropdown',
              name: 'OP',
              options: [
                [this_.ops[0], 'add'],
                [this_.ops[1], 'subtract'],
                [this_.ops[2], 'set'],
              ],
            },
            {
              type: 'input_value',
              name: 'COUNT',
            },
            {
              type: 'field_dropdown',
              name: 'UNIT',
              options: [
                [this_.units[0], 'seconds'],
                [this_.units[1], 'minutes'],
                [this_.units[2], 'hours'],
                [this_.units[3], 'days'],
                [this_.units[4], 'businessDays'],
                [this_.units[5], 'weeks'],
                [this_.units[6], 'months'],
                [this_.units[7], 'sticky_months'],
                [this_.units[8], 'quarters'],
                [this_.units[9], 'sticky_quarters'],
                [this_.units[10], 'years'],
                [this_.units[11], 'sticky_years'],
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
    Blockly.JavaScript.forBlock[BlocklyUtils.DATE_CHANGE] = function (block) {
      const unit: string = block.getFieldValue('UNIT');
      const op: string = block.getFieldValue('OP');
      const count = Blockly.JavaScript.valueToCode(block, 'COUNT', Blockly.JavaScript.ORDER_ATOMIC) || null;
      const input_date = Blockly.JavaScript.valueToCode(block, 'DATE', Blockly.JavaScript.ORDER_ATOMIC) || null;

      // evaluated by the engine (sticky units keep the last day of the month)
      const code = `new Date(${this_.blocklyUtils.getLumeerVariable()}.changeDate(${input_date}, '${op}', (${count}), '${unit}'))`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
