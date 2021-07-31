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

declare var Blockly: any;

export class IsEmptyBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.isEmpty:Returns true if the input is null, undefined, empty string, array, object or an array containing an empty value.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function, MasterBlockType.Link, MasterBlockType.Value];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.IS_EMPTY] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.IS_EMPTY,
          message0: '%{BKY_BLOCK_IS_EMPTY}', // is empty %1
          args0: [
            {
              type: 'input_value',
              name: 'VAR',
            },
          ],
          output: '',
          colour: 210, // blockly logic
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.IS_EMPTY] = function (block) {
      const val = Blockly.JavaScript.valueToCode(block, 'VAR', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;

      const code = `lumeer_isEmpty(${val})`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
