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

export class SendEmailBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.sendEmailBlock:Opens a new email using the system default email application.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.SEND_EMAIL] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.SEND_EMAIL,
          message0: '%{BKY_BLOCK_SEND_EMAIL}', // send email to address %1 with subject %2 and body %3
          args0: [
            {
              type: 'input_value',
              name: 'EMAIL',
              check: 'String',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'SUBJECT',
              check: 'String',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'BODY',
              check: 'String',
              align: 'RIGHT',
            },
          ],
          previousStatement: null,
          nextStatement: null,
          colour: COLOR_CYAN,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.SEND_EMAIL] = function (block) {
      const email = Blockly.JavaScript.valueToCode(block, 'EMAIL', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const subject = Blockly.JavaScript.valueToCode(block, 'SUBJECT', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const body = Blockly.JavaScript.valueToCode(block, 'BODY', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;

      if (!email) {
        return '';
      }

      return this_.blocklyUtils.getLumeerVariable() + `.sendEmail(${email}, ${subject}, ${body});\n`;
    };
  }
}
