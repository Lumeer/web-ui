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

export class ShowMessageBlocklyComponent extends BlocklyComponent {
  private tooltip: string;
  private types: string[];

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    const limit = BlocklyUtils.SHOW_MESSAGES_LIMIT;
    this.tooltip = $localize`:@@blockly.tooltip.showMessageBlock:Show a message to the user. Works only when the automation is initiated via an Action button. At most ${limit}:limit: messages can be shown from a single automation and function sequence execution to prevent interface clogging.`;
    this.types = $localize`:@@blockly.dropdown.values.showMessageBlock:success,info,warning,error`.split(',');
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function, MasterBlockType.Link, MasterBlockType.Value];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.SHOW_MESSAGE] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.SHOW_MESSAGE,
          message0: '%{BKY_BLOCK_SHOW_MESSAGE}', // display %1 message %2
          args0: [
            {
              type: 'field_dropdown',
              name: 'TYPE',
              options: [
                [this_.types[0], 'SUCCESS'],
                [this_.types[1], 'INFO'],
                [this_.types[2], 'WARNING'],
                [this_.types[3], 'ERROR'],
              ],
            },
            {
              type: 'input_value',
              name: 'MESSAGE',
              check: 'String',
            },
          ],
          previousStatement: null,
          nextStatement: null,
          colour: COLOR_CYAN,
          tooltip: this_.tooltip,
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.SHOW_MESSAGE] = function (block) {
      const message_type = block.getFieldValue('TYPE');
      const value_message = Blockly.JavaScript.valueToCode(block, 'MESSAGE', Blockly.JavaScript.ORDER_ATOMIC) || null;

      const code =
        this_.blocklyUtils.getLumeerVariable() + ".showMessage('" + message_type + "', " + value_message + ');\n';

      return code;
    };
  }
}
