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

import {COLOR_PRIMARY} from '../../../../core/constants';
import {BlocklyUtils, MasterBlockType} from '../blockly-utils';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkDocumentsNoReturnBlocklyComponent} from './link-documents-no-return-blockly-component';
import {isNotNullOrUndefined} from '../../../utils/common.utils';

declare var Blockly: any;

export class GetSiblingsBlocklyComponent extends LinkDocumentsNoReturnBlocklyComponent {
  public constructor(public blocklyUtils: BlocklyUtils, protected linkTypes: LinkType[]) {
    super(blocklyUtils, linkTypes);

    this.tooltip = $localize`:@@blockly.tooltip.getSiblingsBlock:Follows the link from the given record and then all the links back to the original table, returning all siblings.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.GET_SIBLINGS] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.GET_SIBLINGS,
          message0: '%{BKY_BLOCK_GET_SIBLINGS}', // get siblings via %1 %2
          args0: [
            {
              type: 'field_dropdown',
              name: 'LINKTYPE',
              options: this_.linkTypeOptions,
            },
            {
              type: 'input_value',
              name: 'DOCUMENT',
            },
          ],
          output: '',
          colour: COLOR_PRIMARY,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };

    Blockly.JavaScript[BlocklyUtils.GET_SIBLINGS] = function (block) {
      const dropdown_linktype = block.getFieldValue('LINKTYPE') || null;
      const value_document = Blockly.JavaScript.valueToCode(block, 'DOCUMENT', Blockly.JavaScript.ORDER_ATOMIC) || null;

      const code = this_.blocklyUtils.getLumeerVariable() + `.getSiblings('${dropdown_linktype}', ${value_document})`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }

  public getLinkVariablesXml(workspace: any): string {
    return '<xml><block type="' + BlocklyUtils.GET_SIBLINGS + '"></block></xml>';
  }

  private checkWorkspaceChange(workspace, changeEvent, block) {
    if (isNotNullOrUndefined(block) && block.type === BlocklyUtils.GET_SIBLINGS) {
      const linkTypeId = block.getField('LINKTYPE').value_;
      const linkType = this.linkTypes?.find(lt => lt.id === linkTypeId);

      if (linkType) {
        const checks = linkType?.collectionIds;
        const input = block.getInput('DOCUMENT');

        // is the input connected?
        if (isNotNullOrUndefined(input.connection.targetConnection?.check_)) {
          const inputType =
            input.connection.targetConnection?.check_ instanceof Array
              ? input.connection.targetConnection?.check_[0]
              : input.connection.targetConnection?.check_;

          if (inputType === checks[0] + BlocklyUtils.DOCUMENT_VAR_SUFFIX) {
            block.setOutput(true, checks[0] + BlocklyUtils.DOCUMENT_ARRAY_TYPE_SUFFIX);
          } else {
            block.setOutput(true, checks[1] + BlocklyUtils.DOCUMENT_ARRAY_TYPE_SUFFIX);
          }
        } else {
          // we don't know the output type
          block.setOutput(true, 'UNKNOWN');
          input.setCheck([checks[0] + BlocklyUtils.DOCUMENT_VAR_SUFFIX, checks[1] + BlocklyUtils.DOCUMENT_VAR_SUFFIX]);
        }
      }
    }
  }

  public onWorkspaceChange(workspace, changeEvent) {
    if (
      changeEvent instanceof Blockly.Events.Create ||
      changeEvent instanceof Blockly.Events.Change ||
      changeEvent instanceof Blockly.Events.Move
    ) {
      const block = workspace.getBlockById(changeEvent.blockId);
      this.checkWorkspaceChange(workspace, changeEvent, block);

      if (changeEvent.newParentId) {
        const parent = workspace.getBlockById(changeEvent.newParentId);
        this.checkWorkspaceChange(workspace, changeEvent, parent);
      }

      if (changeEvent.oldParentId) {
        const parent = workspace.getBlockById(changeEvent.oldParentId);
        this.checkWorkspaceChange(workspace, changeEvent, parent);
      }
    }
  }
}
