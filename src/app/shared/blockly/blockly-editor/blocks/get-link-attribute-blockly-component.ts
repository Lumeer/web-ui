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
import {COLOR_PRIMARY} from '../../../../core/constants';
import {I18n} from '@ngx-translate/i18n-polyfill';

declare var Blockly: any;

export class GetLinkAttributeBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils, public i18n: I18n) {
    super(blocklyUtils, i18n);

    this.tooltip = i18n({
      id: 'blockly.tooltip.getLinkAttributeBlock',
      value: 'Gets the value of an attribute in the given link.',
    });
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function, MasterBlockType.Link, MasterBlockType.Value];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.GET_LINK_ATTRIBUTE] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.GET_LINK_ATTRIBUTE,
          message0: '%{BKY_BLOCK_GET_LINK_ATTRIBUTE}', // get %1 of link %2
          args0: [
            {
              type: 'field_dropdown',
              name: 'ATTR',
              options: [['?', '?']],
            },
            {
              type: 'input_value',
              name: 'LINK',
            },
          ],
          output: '',
          colour: COLOR_PRIMARY,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.GET_LINK_ATTRIBUTE] = function (block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'LINK', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const attrId = block.getFieldValue('ATTR');

      if (!argument0) {
        return '';
      }

      const code = this_.blocklyUtils.getLumeerVariable() + '.getLinkAttribute(' + argument0 + ", '" + attrId + "')";

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }

  public getDocumentVariablesXml(workspace: any): string {
    return null;
  }
}
