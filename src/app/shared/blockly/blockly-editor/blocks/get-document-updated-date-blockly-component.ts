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
import {isNotNullOrUndefined} from '../../../utils/common.utils';
import {GetDocumentPropertyAbstractBlocklyComponent} from './get-document-property-abstract-blockly-component';

declare var Blockly: any;

export class GetDocumentUpdatedDateBlocklyComponent extends GetDocumentPropertyAbstractBlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);
    this.thisType = BlocklyUtils.GET_DOCUMENT_UPDATED_DATE;

    this.tooltip = $localize`:@@blockly.tooltip.getDocumentUpdatedDateBlock:Gets the last update date of the given record.`;
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.GET_DOCUMENT_UPDATED_DATE] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.GET_DOCUMENT_UPDATED_DATE,
          message0: '%{BKY_BLOCK_GET_DOCUMENT_UPDATED_DATE}', // get last update date of %1
          args0: [
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
    Blockly.JavaScript[BlocklyUtils.GET_DOCUMENT_UPDATED_DATE] = function (block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'DOCUMENT', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;

      if (!argument0) {
        return '';
      }

      const code = this_.blocklyUtils.getLumeerVariable() + '.getDocumentUpdateDate(' + argument0 + ')';

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
