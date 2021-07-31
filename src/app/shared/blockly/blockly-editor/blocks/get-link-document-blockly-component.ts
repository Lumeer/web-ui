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
import {COLOR_PRIMARY} from '../../../../core/constants';

declare var Blockly: any;

export class GetLinkDocumentBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.createDocumentBlock:Gets a record linked to the given document via the selected link.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function, MasterBlockType.Link, MasterBlockType.Value];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    const coreLinkVarTypes = this.blocklyUtils
      .getVariables()
      .filter(variable => !!variable && variable.linkTypeId)
      .map(variable => variable.linkTypeId + BlocklyUtils.LINK_VAR_SUFFIX);
    const linkTypes = this.blocklyUtils.getLinkTypes().map(l => l.id + BlocklyUtils.LINK_VAR_SUFFIX);

    Blockly.Blocks[BlocklyUtils.GET_LINK_DOCUMENT] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.GET_LINK_DOCUMENT,
          message0: '%{BKY_BLOCK_GET_LINK_DOCUMENT}', // record from %1 linked via %2
          args0: [
            {
              type: 'field_dropdown',
              name: 'COLLECTION',
              options: [['?', '?']],
            },
            {
              type: 'input_value',
              name: 'LINK',
              check: uniqueValues([...coreLinkVarTypes, ...linkTypes]),
            },
          ],
          colour: COLOR_PRIMARY,
          output: BlocklyUtils.GET_LINK_DOCUMENT_UNKNOWN,
          tooltip: this_.tooltip,
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.GET_LINK_DOCUMENT] = function (block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'LINK', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const collectionId = block.getFieldValue('COLLECTION');

      if (!argument0) {
        return '';
      }

      const code =
        this_.blocklyUtils.getLumeerVariable() + '.getLinkDocument(' + argument0 + ", '" + collectionId + "'" + ')';

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
