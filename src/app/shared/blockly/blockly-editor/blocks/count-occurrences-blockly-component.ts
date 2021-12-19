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

export class CountOccurrencesBlocklyComponent extends BlocklyComponent {
  private tooltip: string;
  private fieldValue: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.countOccurrences:Counts the occurrences of a given string in an array.`;
    this.fieldValue = $localize`:@@blockly.field.placeholder.value:value`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Link, MasterBlockType.Function];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.COUNT_OCCURRENCES] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.COUNT_OCCURRENCES,
          message0: '%{BKY_BLOCK_COUNT_OCCURRENCES}', // count occurrences of %1 in %2
          args0: [
            {
              type: 'input_value',
              name: 'NEEDLE',
              text: this_.fieldValue,
            },
            {
              type: 'input_value',
              name: 'VAR',
            },
          ],
          inputsInline: true,
          output: '',
          colour: 260, // blockly lists
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.COUNT_OCCURRENCES] = function (block) {
      const text_needle = Blockly.JavaScript.valueToCode(block, 'NEEDLE', Blockly.JavaScript.ORDER_MEMBER) || "''";
      const val = Blockly.JavaScript.valueToCode(block, 'VAR', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;

      const code = `(Array.isArray(${val}) && (${val}) ? (${val}).reduce((a, v) => (v === (${text_needle}) ? a + 1 : a), 0) : 0)`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
