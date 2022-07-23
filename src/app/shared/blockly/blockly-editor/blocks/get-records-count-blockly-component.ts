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
import {COLOR_CYAN, COLOR_GREEN} from '../../../../core/constants';
import {isNotNullOrUndefined} from '../../../utils/common.utils';

declare var Blockly: any;

export class GetRecordsCountBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.getRecordsCountBlock:Gets the number of records in an array or a list. Ideal for counting linked records. Counts even records with all empty values.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Link, MasterBlockType.Function];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.GET_RECORDS_COUNT] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.GET_RECORDS_COUNT,
          message0: '%{BKY_BLOCK_GET_RECORDS_COUNT}', // records count %1
          args0: [
            {
              type: 'input_value',
              name: 'RECORDS',
            },
          ],
          output: '',
          colour: COLOR_GREEN,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.GET_RECORDS_COUNT] = function (block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'RECORDS', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;

      const code = this_.blocklyUtils.getLumeerVariable() + `.getListSize(${argument0})`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }

  public getDocumentVariablesXml(workspace: any): string {
    return '<xml><block type="' + BlocklyUtils.GET_RECORDS_COUNT + '"></block></xml>';
  }

  private checkInput(input, block) {
    // is the input connected?
    if (isNotNullOrUndefined(input.connection.targetConnection?.check_)) {
      const inputType =
        input.connection.targetConnection?.check_ instanceof Array
          ? input.connection.targetConnection?.check_[0]
          : input.connection.targetConnection?.check_;

      // something unsupported got connected
      if (!inputType.endsWith(BlocklyUtils.DOCUMENT_ARRAY_TYPE_SUFFIX)) {
        this.blocklyUtils.tryDisconnect(block, input.connection);
      }
    }
  }

  private checkWorkspaceChange(block) {
    if (isNotNullOrUndefined(block) && block.type === BlocklyUtils.GET_RECORDS_COUNT) {
      const records_input = block.getInput('RECORDS');
      this.checkInput(records_input, block);
    }
  }

  public onWorkspaceChange(workspace, changeEvent) {
    if (
      changeEvent instanceof Blockly.Events.Create ||
      changeEvent instanceof Blockly.Events.Change ||
      changeEvent instanceof Blockly.Events.Move
    ) {
      const block = workspace.getBlockById(changeEvent.blockId);
      this.checkWorkspaceChange(block);

      if (changeEvent.newParentId) {
        const parent = workspace.getBlockById(changeEvent.newParentId);
        this.checkWorkspaceChange(parent);
      }

      if (changeEvent.oldParentId) {
        const parent = workspace.getBlockById(changeEvent.oldParentId);
        this.checkWorkspaceChange(parent);
      }
    }
  }
}
