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
import {uniqueValues} from '../../../utils/array.utils';
import {COLOR_GREEN} from '../../../../core/constants';

declare var Blockly: any;

export class SetAttributeBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.setAttributeBlock:Sets the value of an attribute in the given record.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function, MasterBlockType.Link, MasterBlockType.Value];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    const coreCollectionVarTypes = this.blocklyUtils
      .getVariables()
      .filter(variable => !!variable && variable.collectionId)
      .map(variable => variable.collectionId + BlocklyUtils.DOCUMENT_VAR_SUFFIX);
    const collectionTypes = this.blocklyUtils.getCollections().map(c => c.id + BlocklyUtils.DOCUMENT_VAR_SUFFIX);

    Blockly.Blocks[BlocklyUtils.SET_ATTRIBUTE] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.SET_ATTRIBUTE,
          message0: '%{BKY_BLOCK_SET_ATTRIBUTE}', // set %1 of %2 to %3
          args0: [
            {
              type: 'field_dropdown',
              name: 'ATTR',
              options: [['?', '?']],
            },
            {
              type: 'input_value',
              name: 'DOCUMENT',
              check: uniqueValues([
                ...coreCollectionVarTypes,
                ...collectionTypes,
                BlocklyUtils.GET_LINK_DOCUMENT_UNKNOWN,
              ]),
            },
            {
              type: 'input_value',
              name: 'VALUE',
              check: ['', 'Number', 'String', 'Boolean', 'Colour'], // only regular variables
            },
          ],
          previousStatement: null,
          nextStatement: null,
          colour: COLOR_GREEN,
          tooltip: this_.tooltip,
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.SET_ATTRIBUTE] = function (block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'DOCUMENT', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const argument1 = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const attrId = block.getFieldValue('ATTR');

      if (!argument0 || !argument1) {
        return '';
      }

      return (
        this_.blocklyUtils.getLumeerVariable() +
        '.setDocumentAttribute(' +
        argument0 +
        ", '" +
        attrId +
        "', " +
        argument1 +
        ');\n'
      );
    };
  }
}
