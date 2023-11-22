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
import {isNotNullOrUndefined} from '@lumeer/utils';

import {COLOR_PRIMARY} from '../../../../core/constants';
import {BlocklyUtils, MasterBlockType} from '../blockly-utils';
import {BlocklyComponent} from './blockly-component';

declare var Blockly: any;

export class DeleteLinkBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    const limit = BlocklyUtils.CREATE_DELETE_DOCUMENTS_LINKS_LIMIT;
    this.tooltip = $localize`:@@blockly.tooltip.deleteLinkBlock:Deletes an existing link. To prevent large damage, only up to ${limit}:limit: links can be deleted within a single sequence of automations and functions.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Link];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.DELETE_LINK] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.DELETE_LINK,
          message0: '%{BKY_BLOCK_DELETE_LINK}', // delete link %1
          args0: [
            {
              type: 'input_value',
              name: 'LINK',
            },
          ],
          previousStatement: null,
          nextStatement: null,
          colour: COLOR_PRIMARY,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };

    Blockly.JavaScript[BlocklyUtils.DELETE_LINK] = function (block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'LINK', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;

      return this_.blocklyUtils.getLumeerVariable() + '.removeLink(' + argument0 + ');\n';
    };
  }

  public getLinkVariablesXml(workspace: any): string {
    return '<xml><block type="' + BlocklyUtils.DELETE_LINK + '"></block></xml>';
  }

  public onWorkspaceChange(workspace, changeEvent) {
    const block = workspace.getBlockById(changeEvent.blockId);

    if (changeEvent instanceof Blockly.Events.Move) {
      const newParentId = changeEvent.newParentId;

      if (isNotNullOrUndefined(newParentId)) {
        const parentBlock = workspace.getBlockById(newParentId);

        if (isNotNullOrUndefined(parentBlock) && parentBlock.type === BlocklyUtils.DELETE_LINK) {
          if (!block.outputConnection?.check_[0]?.endsWith(BlocklyUtils.LINK_VAR_SUFFIX)) {
            this.blocklyUtils.tryDisconnect(block, block.outputConnection);
          }
        }
      }
    }
  }
}
