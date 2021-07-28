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

declare var Blockly: any;

export class CreateDocumentBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    const limit = BlocklyUtils.CREATE_DELETE_DOCUMENTS_LINKS_LIMIT;
    this.tooltip = $localize`:@@blockly.tooltip.createDocumentBlock2:Creates a new record. Assign it to a variable to change its attributes. To prevent endless loops, only up to ${limit}:limit: documents can be created within a single sequence of automations and functions.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.CREATE_DOCUMENT] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.CREATE_DOCUMENT,
          message0: '%{BKY_BLOCK_CREATE_DOCUMENT}', // create record in %1,
          args0: [
            {
              type: 'field_dropdown',
              name: 'COLLECTION_ID',
              options: function () {
                return (this_.blocklyUtils.getCollections() || []).map(collection => [
                  collection.name.replace(/ /g, '\u00A0'),
                  collection.id,
                ]);
              },
            },
          ],
          output: '',
          colour: COLOR_GREEN,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };

    Blockly.JavaScript[BlocklyUtils.CREATE_DOCUMENT] = function (block) {
      const collectionId = block.getFieldValue('COLLECTION_ID');

      const code = this_.blocklyUtils.getLumeerVariable() + ".createDocument('" + collectionId + "')";

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }

  public getDocumentVariablesXml(workspace: any): string {
    return '<xml><block type="' + BlocklyUtils.CREATE_DOCUMENT + '"></block></xml>';
  }

  public onWorkspaceChange(workspace, changeEvent) {
    const block = workspace.getBlockById(changeEvent.blockId);

    if (changeEvent instanceof Blockly.Events.Create) {
      if (block.type === BlocklyUtils.CREATE_DOCUMENT) {
        block.outputConnection.check_ = this.blocklyUtils.getCollections()[0]?.id + BlocklyUtils.DOCUMENT_VAR_SUFFIX;
      }
    } else if (changeEvent instanceof Blockly.Events.Change) {
      if (
        block.type === BlocklyUtils.CREATE_DOCUMENT &&
        changeEvent.element === 'field' &&
        changeEvent.name === 'COLLECTION_ID'
      ) {
        block.outputConnection.check_ = changeEvent.newValue + BlocklyUtils.DOCUMENT_VAR_SUFFIX;

        this.blocklyUtils.checkVariablesType(changeEvent, workspace);
      }
    }
  }
}
