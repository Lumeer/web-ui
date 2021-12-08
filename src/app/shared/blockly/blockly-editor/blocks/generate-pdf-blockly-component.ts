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

export class GeneratePdfBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.generatePdfBlock:Generates PDF from the given HTML string and saves it as a file to the given attribute.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.GENERATE_PDF] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.GENERATE_PDF,
          message0: '%{BKY_BLOCK_GENERATE_PDF}', // generate PDF from HTML %1 save it to %2 in record %3 with file name %4 overwrite existing %5
          args0: [
            {
              type: 'input_value',
              name: 'HTML',
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
              name: 'FILENAME',
              align: 'RIGHT',
            },
            {
              type: 'field_checkbox',
              name: 'OVERWRITE',
              checked: true,
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
    Blockly.JavaScript[BlocklyUtils.GENERATE_PDF] = function (block) {
      const value_html = Blockly.JavaScript.valueToCode(block, 'HTML', Blockly.JavaScript.ORDER_ATOMIC) || null;
      const dropdown_attr = block.getFieldValue('ATTR');
      const value_document = Blockly.JavaScript.valueToCode(block, 'DOCUMENT', Blockly.JavaScript.ORDER_ATOMIC) || null;
      const value_filename = Blockly.JavaScript.valueToCode(block, 'FILENAME', Blockly.JavaScript.ORDER_ATOMIC) || null;
      const checkbox_overwrite = block.getFieldValue('OVERWRITE') == 'TRUE';

      if (!value_html || !value_document || !value_filename) {
        return '';
      }

      return (
        this_.blocklyUtils.getLumeerVariable() +
        '.writePdf(' +
        value_document +
        ", '" +
        dropdown_attr +
        "', " +
        value_filename +
        ', ' +
        checkbox_overwrite +
        ', ' +
        value_html +
        ');\n'
      );
    };
  }
}
