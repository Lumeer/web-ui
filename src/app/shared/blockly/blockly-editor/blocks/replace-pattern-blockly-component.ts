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

export class ReplacePatternBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.replacePatternBlock:Replaces patterns specified as an array, hash map, object, or string in a given text or HTML. When patterns are in an array or in a string (only one can be used in a string), the pattern name and value are separated by the given splitter. Patterns need to appear in the form of \${pattern_name}.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Link, MasterBlockType.Function];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.REPLACE_PATTERN] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.REPLACE_PATTERN,
          message0: '%{BKY_BLOCK_REPLACE_PATTERN}', // in text or HTML %1 replace patterns %2 patterns are split using %3
          args0: [
            {
              type: 'input_value',
              name: 'TEXT',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'PATTERNS',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'SPLITTER',
              check: 'String',
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
    Blockly.JavaScript[BlocklyUtils.REPLACE_PATTERN] = function (block) {
      const value_text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
      const value_patterns = Blockly.JavaScript.valueToCode(block, 'PATTERNS', Blockly.JavaScript.ORDER_ATOMIC) || '';
      const value_splitter = Blockly.JavaScript.valueToCode(block, 'SPLITTER', Blockly.JavaScript.ORDER_ATOMIC) || ':';

      if (!value_text) {
        return '';
      }

      const code =
        this_.blocklyUtils.getLumeerVariable() + `.formatTemplate(${value_text}, ${value_patterns}, ${value_splitter})`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
