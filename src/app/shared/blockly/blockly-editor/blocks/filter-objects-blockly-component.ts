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

export class FilterObjectsBlocklyComponent extends BlocklyComponent {
  private tooltip: string;
  private fieldKey: string;
  private fieldValue: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.filterObjects:Filters object in an array by having the given key equal to a given value.`;
    this.fieldKey = $localize`:@@blockly.field.placeholder.key:key`;
    this.fieldValue = $localize`:@@blockly.field.placeholder.value:value`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function, MasterBlockType.Link, MasterBlockType.Value];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.FILTER_OBJECTS] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.FILTER_OBJECTS,
          message0: '%{BKY_BLOCK_FILTER_OBJECTS}', // filter objects where %1 = %2 in %3
          args0: [
            {
              type: 'field_input',
              name: 'KEY',
              text: this_.fieldKey,
            },
            {
              type: 'field_input',
              name: 'VALUE',
              text: this_.fieldValue,
            },
            {
              type: 'input_value',
              name: 'VAR',
            },
          ],
          output: '',
          colour: 260, // blockly lists
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.FILTER_OBJECTS] = function (block) {
      const text_key = block.getFieldValue('KEY');
      const text_value = block.getFieldValue('VALUE');
      const val = Blockly.JavaScript.valueToCode(block, 'VAR', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;

      const code = `(Array.isArray(${val}) && (${val}) ? (${val}).filter((o) => o['${text_key}'] === '${text_value}') : [])`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
