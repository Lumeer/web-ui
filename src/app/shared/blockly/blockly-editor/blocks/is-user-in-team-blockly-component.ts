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
import {COLOR_CYAN} from '../../../../core/constants';

declare var Blockly: any;

export class IsUserInTeamBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.isUserInTeamBlock:True if the current user is in the given team. Returns boolean, use "create text with" to convert to string for display.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Link, MasterBlockType.Function];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.IS_USER_IN_TEAM] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.IS_USER_IN_TEAM,
          message0: '%{BKY_BLOCK_IS_USER_IN_TEAM}', // is user in team %1
          args0: [
            {
              type: 'input_value',
              name: 'TEAM',
            },
          ],
          output: '',
          colour: COLOR_CYAN,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.IS_USER_IN_TEAM] = function (block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'TEAM', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;

      if (!argument0) {
        return '';
      }

      const code = this_.blocklyUtils.getLumeerVariable() + `.isUserInTeam(${argument0})`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
