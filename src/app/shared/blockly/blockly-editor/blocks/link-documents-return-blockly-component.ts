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

export class LinkDocumentsReturnBlocklyComponent extends LinkDocumentsNoReturnBlocklyComponent {
  public constructor(public blocklyUtils: BlocklyUtils, protected linkTypes: LinkType[]) {
    super(blocklyUtils, linkTypes);
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.LINK_DOCUMENTS_RETURN] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.LINK_DOCUMENTS_RETURN,
          message0: '%{BKY_BLOCK_LINK_DOCUMENTS_RETURN}', // link records via %1 %2 %3
          args0: [
            {
              type: 'field_dropdown',
              name: 'LINKTYPE',
              options: this_.linkTypeOptions,
            },
            {
              type: 'input_value',
              name: 'DOCUMENT1',
            },
            {
              type: 'input_value',
              name: 'DOCUMENT2',
            },
          ],
          output: '',
          colour: COLOR_PRIMARY,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };

    Blockly.JavaScript[BlocklyUtils.LINK_DOCUMENTS_RETURN] = function (block) {
      const dropdown_linktype = block.getFieldValue('LINKTYPE') || null;
      const value_document1 =
        Blockly.JavaScript.valueToCode(block, 'DOCUMENT1', Blockly.JavaScript.ORDER_ATOMIC) || null;
      const value_document2 =
        Blockly.JavaScript.valueToCode(block, 'DOCUMENT2', Blockly.JavaScript.ORDER_ATOMIC) || null;

      const code =
        this_.blocklyUtils.getLumeerVariable() +
        '.linkDocuments(' +
        value_document1 +
        ', ' +
        value_document2 +
        ", '" +
        dropdown_linktype +
        "')";

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }

  public getLinkVariablesXml(workspace: any): string {
    return '<xml><block type="' + BlocklyUtils.LINK_DOCUMENTS_RETURN + '"></block></xml>';
  }

  public onWorkspaceChange(workspace, changeEvent) {
    super.onWorkspaceChange(workspace, changeEvent);

    if (
      changeEvent instanceof Blockly.Events.Create ||
      changeEvent instanceof Blockly.Events.Change ||
      changeEvent instanceof Blockly.Events.Move
    ) {
      const block = workspace.getBlockById(changeEvent.blockId);

      if (isNotNullOrUndefined(block) && block.type === BlocklyUtils.LINK_DOCUMENTS_RETURN) {
        const linkTypeId = block.getField('LINKTYPE').value_;
        block.setOutput(true, linkTypeId + BlocklyUtils.LINK_VAR_SUFFIX);
      }
    }
  }
}
