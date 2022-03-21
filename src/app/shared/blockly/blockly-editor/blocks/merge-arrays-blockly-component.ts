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

import {COLOR_AMBER} from '../../../../core/constants';
import {BlocklyUtils, MasterBlockType} from '../blockly-utils';
import {BlocklyComponent} from './blockly-component';
import {View} from '../../../../core/store/views/view';

declare var Blockly: any;

export class MergeArraysBlocklyComponent extends BlocklyComponent {
  protected tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.mergeArraysBlock:Merge two lists ([A1, A2, ...] + [B1, B2, ...] => [A1DB1, A2DB2, ...], where D is a delimiter). The values can be separated with a delimiter. Strings are also treated as arrays.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Link, MasterBlockType.Function];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.MERGE_ARRAYS] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.MERGE_ARRAYS,
          message0: 'merge array %1 and array %2 using delimiter %3', //'%{BKY_BLOCK_MERGE_ARRAYS}', // merge array %1 and array %2 using delimiter %3
          args0: [
            {
              type: 'input_value',
              name: 'ARRAY1',
            },
            {
              type: 'input_value',
              name: 'ARRAY2',
            },
            {
              type: 'input_value',
              name: 'DELIM',
              check: 'String',
            },
          ],
          output: '',
          inputsInline: true,
          colour: 260,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };

    Blockly.JavaScript[BlocklyUtils.MERGE_ARRAYS] = function (block) {
      const array1 = Blockly.JavaScript.valueToCode(block, 'ARRAY1', Blockly.JavaScript.ORDER_ATOMIC) || [];
      const array2 = Blockly.JavaScript.valueToCode(block, 'ARRAY2', Blockly.JavaScript.ORDER_ATOMIC) || [];
      const delim = Blockly.JavaScript.valueToCode(block, 'DELIM', Blockly.JavaScript.ORDER_ATOMIC) || '';

      const functionName = Blockly.JavaScript.provideFunction_('listsZigZag', [
        'function ' + Blockly.JavaScript.FUNCTION_NAME_PLACEHOLDER_ + '(a1, a2, d) {',
        '  var res = [];',
        '  let i = 0, j = 0, k = 0;',
        '  while (i < a1.length && j < a2.length) {',
        "    res[k++] = d ? '' + a1[i++] + d + a2[j++] : a1[i++] + a2[j++];",
        '  }',
        '  while (i < a1.length) res[k++] = a1[i++];',
        '  while (j < a2.length) res[k++] = a2[j++];',
        '  return res;',
        '}',
      ]);

      const code = `${functionName}(${array1}, ${array2}, ${delim})`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
