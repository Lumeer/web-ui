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
import {COLOR_AMBER} from '../../../../core/constants';

declare var Blockly: any;

export class ShareViewBlocklyComponent extends BlocklyComponent {
  private tooltip: string;
  private shareOptions: string[];

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.shareViewBlock:Shares a view with the given user. Set the rights to 'none' to cancel sharing.`;

    this.shareOptions = $localize`:@@blockly.dropdown.rights.shareViewBlock:none|read|write|manage`.split('|');
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.SHARE_VIEW] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.SHARE_VIEW,
          message0: '%{BKY_BLOCK_SHARE_VIEW}', // share view %1 with user %2 and %3 access
          lastDummyAlign0: 'RIGHT',
          args0: [
            {
              type: 'input_value',
              name: 'VIEW_ID',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'USER_EMAIL',
              align: 'RIGHT',
            },
            {
              type: 'field_dropdown',
              name: 'ROLES',
              options: [
                [this_.shareOptions[0], 'none'],
                [this_.shareOptions[1], 'read'],
                [this_.shareOptions[2], 'read,write'],
                [this_.shareOptions[3], 'read,write,manage'],
              ],
            },
          ],
          previousStatement: null,
          nextStatement: null,
          inputsInline: false,
          colour: COLOR_AMBER,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.SHARE_VIEW] = function (block) {
      const viewId = Blockly.JavaScript.valueToCode(block, 'VIEW_ID', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const userEmail =
        Blockly.JavaScript.valueToCode(block, 'USER_EMAIL', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const roles = block.getFieldValue('ROLES') || false;

      if (!userEmail || !viewId) {
        return '';
      }

      return this_.blocklyUtils.getLumeerVariable() + `.shareView(${viewId}, ${userEmail}, '${roles}');\n`;
    };
  }
}
