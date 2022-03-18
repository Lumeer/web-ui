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

export class SendSmtpEmailBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.sendSmtpEmailBlock:Sends an email using your custom SMTP server.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Link];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.SEND_SMTP_EMAIL] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.SEND_SMTP_EMAIL,
          message0: '%{BKY_BLOCK_SEND_SMTP_EMAIL}', // send email to address(es) %1 with subject %2 body %3 attachments from %4 in %5 using from name %6 and SMTP configuration %7
          args0: [
            {
              type: 'input_value',
              name: 'EMAIL',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'SUBJECT',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'BODY',
              align: 'RIGHT',
            },
            {
              type: 'field_dropdown',
              name: 'ATTR',
              options: [['?', '?']],
            },
            {
              type: 'input_value',
              name: 'DOCUMENT',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'FROM',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'SMTP_CONFIG',
              check: 'SMTP',
              align: 'RIGHT',
            },
          ],
          inputsInline: false,
          previousStatement: null,
          nextStatement: null,
          colour: COLOR_CYAN,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };

    Blockly.JavaScript[BlocklyUtils.SEND_SMTP_EMAIL] = function (block) {
      const value_email = Blockly.JavaScript.valueToCode(block, 'EMAIL', Blockly.JavaScript.ORDER_ATOMIC);
      const value_subject = Blockly.JavaScript.valueToCode(block, 'SUBJECT', Blockly.JavaScript.ORDER_ATOMIC);
      const value_body = Blockly.JavaScript.valueToCode(block, 'BODY', Blockly.JavaScript.ORDER_ATOMIC);
      const dropdown_attr = block.getFieldValue('ATTR');
      const value_document = Blockly.JavaScript.valueToCode(block, 'DOCUMENT', Blockly.JavaScript.ORDER_ATOMIC);
      const value_from = Blockly.JavaScript.valueToCode(block, 'FROM', Blockly.JavaScript.ORDER_ATOMIC);
      const value_smtp_config = Blockly.JavaScript.valueToCode(block, 'SMTP_CONFIG', Blockly.JavaScript.ORDER_ATOMIC);

      return (
        this_.blocklyUtils.getLumeerVariable() +
        `.sendEmail(${value_email}, ${value_from}, ${value_subject}, ${value_body}, ${
          !!value_document ? value_document : null
        }, '${dropdown_attr}', ${value_smtp_config});\n`
      );
    };
  }
}
