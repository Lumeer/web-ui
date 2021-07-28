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
import {COLOR_GREEN} from '../../../../core/constants';

declare var Blockly: any;

export class GetAttributeBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.getAttributeBlock:Gets the value of an attribute in the given record.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function, MasterBlockType.Link, MasterBlockType.Value];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.GET_ATTRIBUTE] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.GET_ATTRIBUTE,
          message0: '%{BKY_BLOCK_GET_ATTRIBUTE}', // get %1 of %2
          args0: [
            {
              type: 'field_dropdown',
              name: 'ATTR',
              options: [['?', '?']],
            },
            {
              type: 'input_value',
              name: 'DOCUMENT',
            },
          ],
          output: '',
          colour: COLOR_GREEN,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.GET_ATTRIBUTE] = function (block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'DOCUMENT', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const attrId = block.getFieldValue('ATTR');

      if (!argument0) {
        return '';
      }

      const code =
        this_.blocklyUtils.getLumeerVariable() + '.getDocumentAttribute(' + argument0 + ", '" + attrId + "')";

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
