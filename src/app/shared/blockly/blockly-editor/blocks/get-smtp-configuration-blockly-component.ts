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
import {COLOR_AMBER, COLOR_CYAN} from '../../../../core/constants';

declare var Blockly: any;

export class GetSmtpConfigurationBlocklyComponent extends BlocklyComponent {
  private tooltip: string;
  private none: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.getSmtpConfigurationBlock:Gets the object representing SMTP configuration for sending emails.`;
    this.none = $localize`:@@blockly.select.getSmtpConfigurationBlock.none:none`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Link];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.GET_SMTP_CONFIGURATION] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.GET_SMTP_CONFIGURATION,
          lastDummyAlign0: 'RIGHT',
          message0:
            'get SMTP configuration with host %1 port %2 user %3 password %4 message author (from) %5 security %6', //'%{BKY_BLOCK_GET_SMTP_CONFFIGURATION}', // get SMTP configuration with host %1 port %2 user %3 password %4 message author (from) %5 security %6
          args0: [
            {
              type: 'input_value',
              name: 'HOST',
              check: 'String',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'PORT',
              check: 'Number',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'USER',
              check: 'String',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'PASSWORD',
              check: 'String',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'FROM',
              check: 'String',
              align: 'RIGHT',
            },
            {
              type: 'field_dropdown',
              name: 'SECURITY',
              options: [
                [this_.none, 'NONE'],
                ['SSL', 'SSL'],
                ['TLS', 'TLS'],
              ],
            },
          ],
          inputsInline: false,
          output: 'SMTP',
          colour: COLOR_CYAN,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.GET_SMTP_CONFIGURATION] = function (block) {
      const value_host = Blockly.JavaScript.valueToCode(block, 'HOST', Blockly.JavaScript.ORDER_ATOMIC);
      const value_port = Blockly.JavaScript.valueToCode(block, 'PORT', Blockly.JavaScript.ORDER_ATOMIC);
      const value_user = Blockly.JavaScript.valueToCode(block, 'USER', Blockly.JavaScript.ORDER_ATOMIC);
      const value_password = Blockly.JavaScript.valueToCode(block, 'PASSWORD', Blockly.JavaScript.ORDER_ATOMIC);
      const value_from = Blockly.JavaScript.valueToCode(block, 'FROM', Blockly.JavaScript.ORDER_ATOMIC);
      const dropdown_security = block.getFieldValue('SECURITY');

      const code = `{ host: ${value_host}, port: ${value_port}, user: ${value_user}, password: ${value_password}, from: ${value_from}, security: '${dropdown_security}' }`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
