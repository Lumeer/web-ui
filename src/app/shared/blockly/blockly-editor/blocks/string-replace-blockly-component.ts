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

export class StringReplaceBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.stringReplaceBlock:Replaces a regular expression pattern in a given string.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function, MasterBlockType.Link, MasterBlockType.Value];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.STRING_REPLACE] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.STRING_REPLACE,
          message0: '%{BKY_BLOCK_STRING_REPLACE}', // print %1 of %2
          args0: [
            {
              type: 'input_value',
              name: 'STR',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'PAT',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'FLAGS',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'REPL',
              align: 'RIGHT',
            },
          ],
          output: null,
          colour: '%{BKY_TEXTS_HUE}',
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.STRING_REPLACE] = function (block) {
      const strArg = Blockly.JavaScript.valueToCode(block, 'STR', Blockly.JavaScript.ORDER_MEMBER) || "''";
      const patArg = Blockly.JavaScript.valueToCode(block, 'PAT', Blockly.JavaScript.ORDER_NONE) || "''";
      const flagsArg = Blockly.JavaScript.valueToCode(block, 'FLAGS', Blockly.JavaScript.ORDER_NONE) || "''";
      const replArg = Blockly.JavaScript.valueToCode(block, 'REPL', Blockly.JavaScript.ORDER_NONE) || "''";

      if (!strArg || !patArg || !replArg) {
        return '';
      }

      const code = `${strArg}.replace(new RegExp(${patArg}, ${flagsArg}), ${replArg})`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
