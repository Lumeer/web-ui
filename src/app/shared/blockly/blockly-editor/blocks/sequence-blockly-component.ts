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
import {COLOR_CYAN} from '../../../../core/constants';

declare var Blockly: any;

export class SequenceBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.sequenceBlock:Gets another value from the given sequence aligned to the given number of digits.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function, MasterBlockType.Link, MasterBlockType.Value];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.SEQUENCE_BLOCK] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.SEQUENCE_BLOCK,
          message0: '%{BKY_BLOCK_SEQUENCE_NEXT}', // next no. from %1 align to %2 digit(s)
          args0: [
            {
              type: 'field_input',
              name: 'SEQUENCE',
              text: 'sequenceName',
            },
            {
              type: 'field_number',
              name: 'DIGITS',
              value: 1,
              min: 1,
              maximum: 99,
            },
          ],
          output: 'String',
          colour: COLOR_CYAN,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.SEQUENCE_BLOCK] = function (block) {
      const sequence = block.getFieldValue('SEQUENCE');
      const digits = block.getFieldValue('DIGITS');

      const code = this_.blocklyUtils.getLumeerVariable() + ".getSequenceNumber('" + sequence + "', " + digits + ')';

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
