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
import {COLOR_SUCCESS} from '../../../../core/constants';
import {isNotNullOrUndefined} from '../../../utils/common.utils';

declare var Blockly: any;

export class CopyDocumentValuesSimpleBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.copyDocumentValuesSimpleBlock:Copy values of attributes with the same name between two records.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Link];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.COPY_DOCUMENT_VALUES_SIMPLE] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.COPY_DOCUMENT_VALUES_SIMPLE,
          lastDummyAlign0: 'RIGHT',
          message0: '%{BKY_BLOCK_COPY_DOCUMENT_VALUES_SIMPLE}', // copy values from %1 to %2
          args0: [
            {
              type: 'input_value',
              name: 'FROM_DOCUMENT',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'TO_DOCUMENT',
              align: 'RIGHT',
            },
          ],
          inputsInline: false,
          previousStatement: null,
          nextStatement: null,
          colour: COLOR_SUCCESS,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.COPY_DOCUMENT_VALUES_SIMPLE] = function (block) {
      const value_from_document =
        Blockly.JavaScript.valueToCode(block, 'FROM_DOCUMENT', Blockly.JavaScript.ORDER_ATOMIC) || null;
      const value_to_document =
        Blockly.JavaScript.valueToCode(block, 'TO_DOCUMENT', Blockly.JavaScript.ORDER_ATOMIC) || null;

      if (!value_from_document || !value_to_document) {
        return '';
      }

      return (
        this_.blocklyUtils.getLumeerVariable() +
        '.copyValues(' +
        value_from_document +
        ', ' +
        value_to_document +
        ', null);\n'
      );
    };
  }

  public getDocumentVariablesXml(workspace: any): string {
    return '<xml><block type="' + BlocklyUtils.COPY_DOCUMENT_VALUES_SIMPLE + '"></block></xml>';
  }

  private checkInput(input, block) {
    // is the input connected?
    if (isNotNullOrUndefined(input.connection.targetConnection?.check_)) {
      const inputType =
        input.connection.targetConnection?.check_ instanceof Array
          ? input.connection.targetConnection?.check_[0]
          : input.connection.targetConnection?.check_;

      // something unsupported got connected
      if (!inputType.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX)) {
        this.blocklyUtils.tryDisconnect(block, input.connection);
      }
    }
  }

  private checkWorkspaceChange(block) {
    if (isNotNullOrUndefined(block) && block.type === BlocklyUtils.COPY_DOCUMENT_VALUES_SIMPLE) {
      const from_input = block.getInput('FROM_DOCUMENT');
      this.checkInput(from_input, block);

      const to_input = block.getInput('TO_DOCUMENT');
      this.checkInput(to_input, block);
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
