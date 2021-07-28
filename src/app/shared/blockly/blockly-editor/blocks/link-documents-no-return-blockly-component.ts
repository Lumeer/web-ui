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
import {COLOR_PRIMARY} from '../../../../core/constants';
import {BlocklyUtils, MasterBlockType} from '../blockly-utils';
import {isNotNullOrUndefined, isNullOrUndefined} from '../../../utils/common.utils';
import {LinkType} from '../../../../core/store/link-types/link.type';

declare var Blockly: any;

export class LinkDocumentsNoReturnBlocklyComponent extends BlocklyComponent {
  protected tooltip: string;
  protected linkTypeOptions = [];

  public constructor(public blocklyUtils: BlocklyUtils, protected linkTypes: LinkType[]) {
    super(blocklyUtils);

    linkTypes.forEach(linkType => this.linkTypeOptions.push([linkType.name.replace(/ /g, '\u00A0'), linkType.id]));

    if (this.linkTypeOptions.length === 0) {
      this.linkTypeOptions.push(['?', '']);
    }

    this.tooltip = $localize`:@@blockly.tooltip.linkDocumentsNoReturnBlock:Links two records using the selected link type.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.LINK_DOCUMENTS_NO_RETURN] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.LINK_DOCUMENTS_NO_RETURN,
          message0: '%{BKY_BLOCK_LINK_DOCUMENTS_NO_RETURN}', // link records via %1 %2 %3
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
          previousStatement: null,
          nextStatement: null,
          colour: COLOR_PRIMARY,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };

    Blockly.JavaScript[BlocklyUtils.LINK_DOCUMENTS_NO_RETURN] = function (block) {
      const dropdown_linktype = block.getFieldValue('LINKTYPE') || null;
      const value_document1 =
        Blockly.JavaScript.valueToCode(block, 'DOCUMENT1', Blockly.JavaScript.ORDER_ATOMIC) || null;
      const value_document2 =
        Blockly.JavaScript.valueToCode(block, 'DOCUMENT2', Blockly.JavaScript.ORDER_ATOMIC) || null;

      return (
        this_.blocklyUtils.getLumeerVariable() +
        '.linkDocuments(' +
        value_document1 +
        ', ' +
        value_document2 +
        ", '" +
        dropdown_linktype +
        "');\n"
      );
    };
  }

  public getLinkVariablesXml(workspace: any): string {
    return '<xml><block type="' + BlocklyUtils.LINK_DOCUMENTS_NO_RETURN + '"></block></xml>';
  }

  private processWorkspaceChange(workspace, changeEvent, block) {
    const linkTypeId = block.getField('LINKTYPE').value_;

    // what types can we have based on the selected link type?
    const linkType = this.linkTypes?.find(lt => lt.id === linkTypeId);

    if (linkType) {
      const checks = linkType.collectionIds;

      // disconnect invalid types
      block.inputList.forEach(input => {
        if (isNotNullOrUndefined(input.connection.targetConnection)) {
          if (
            checks[0] + BlocklyUtils.DOCUMENT_VAR_SUFFIX !==
              input.connection.targetConnection?.sourceBlock_?.outputConnection?.check_[0] &&
            checks[1] + BlocklyUtils.DOCUMENT_VAR_SUFFIX !==
              input.connection.targetConnection?.sourceBlock_?.outputConnection?.check_[0]
          ) {
            this.blocklyUtils.tryDisconnect(
              input.connection.targetConnection.sourceBlock_,
              input.connection.targetConnection
            );
          }
        }
      });

      // what do we already have connected on inputs?
      const connected = [];
      block.inputList.forEach(input => {
        if (isNotNullOrUndefined(input.connection.targetConnection?.check_)) {
          const check = input.connection.targetConnection?.check_;
          if (check instanceof Array) {
            connected.push(...input.connection.targetConnection?.check_);
          } else {
            connected.push(input.connection.targetConnection?.check_);
          }
        }
      });

      // what types can we set for the unconnected inputs
      const checkTypes = [];
      if (connected.length === 1) {
        if (connected[0] === checks[0] + BlocklyUtils.DOCUMENT_VAR_SUFFIX) {
          checkTypes.push(checks[1] + BlocklyUtils.DOCUMENT_VAR_SUFFIX);
        } else {
          checkTypes.push(checks[0] + BlocklyUtils.DOCUMENT_VAR_SUFFIX);
        }
      } else {
        checkTypes.push(checks[0] + BlocklyUtils.DOCUMENT_VAR_SUFFIX);
        checkTypes.push(checks[1] + BlocklyUtils.DOCUMENT_VAR_SUFFIX);
      }

      // set the type only where there isn't anything connected
      block.inputList.forEach(input => {
        if (isNullOrUndefined(input.connection.targetConnection?.check_)) {
          input.setCheck(checkTypes);
        }
      });
    }
  }

  public onWorkspaceChange(workspace, changeEvent) {
    if (
      changeEvent instanceof Blockly.Events.Create ||
      changeEvent instanceof Blockly.Events.Change ||
      changeEvent instanceof Blockly.Events.Move
    ) {
      const block = workspace.getBlockById(changeEvent.blockId);

      if (isNotNullOrUndefined(block) && block.type === BlocklyUtils.LINK_DOCUMENTS_NO_RETURN) {
        this.processWorkspaceChange(workspace, changeEvent, block);
      } else {
        const newParent = workspace.getBlockById(changeEvent.newParentId);

        if (newParent?.type === BlocklyUtils.LINK_DOCUMENTS_NO_RETURN) {
          this.processWorkspaceChange(workspace, changeEvent, newParent);
        }
      }
    }
  }
}
