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
import {COLOR_GREEN} from '../../../../core/constants';
import {BlocklyUtils, MasterBlockType} from '../blockly-utils';
import {isNotNullOrUndefined} from '../../../utils/common.utils';

declare var Blockly: any;

export class DeleteDocumentBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    const limit = BlocklyUtils.CREATE_DELETE_DOCUMENTS_LINKS_LIMIT;
    this.tooltip = $localize`:@@blockly.tooltip.deleteDocumentBlock:Deletes an existing record. To prevent large damage, only up to ${limit}:limit: documents can be deleted within a single sequence of automations and functions.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.DELETE_DOCUMENT] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.DELETE_DOCUMENT,
          message0: '%{BKY_BLOCK_DELETE_DOCUMENT}', // delete record %1
          args0: [
            {
              type: 'input_value',
              name: 'DOCUMENT',
            },
          ],
          previousStatement: null,
          nextStatement: null,
          colour: COLOR_GREEN,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };

    Blockly.JavaScript[BlocklyUtils.DELETE_DOCUMENT] = function (block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'DOCUMENT', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;

      return this_.blocklyUtils.getLumeerVariable() + '.removeDocument(' + argument0 + ')';
    };
  }

  public getDocumentVariablesXml(workspace: any): string {
    return '<xml><block type="' + BlocklyUtils.DELETE_DOCUMENT + '"></block></xml>';
  }

  public onWorkspaceChange(workspace, changeEvent) {
    const block = workspace.getBlockById(changeEvent.blockId);

    if (changeEvent instanceof Blockly.Events.Move) {
      const newParentId = changeEvent.newParentId;

      if (isNotNullOrUndefined(newParentId)) {
        const parentBlock = workspace.getBlockById(newParentId);

        if (isNotNullOrUndefined(parentBlock) && parentBlock.type === BlocklyUtils.DELETE_DOCUMENT) {
          if (!block.outputConnection?.check_[0]?.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX)) {
            this.blocklyUtils.tryDisconnect(block, block.outputConnection);
          }
        }
      }
    }
  }
}
