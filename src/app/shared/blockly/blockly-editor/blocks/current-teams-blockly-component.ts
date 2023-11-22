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
import {COLOR_CYAN} from '../../../../core/constants';
import {BlocklyUtils, MasterBlockType} from '../blockly-utils';
import {BlocklyComponent} from './blockly-component';

declare var Blockly: any;

export class CurrentTeamsBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.currentTeamsBlock:Get teams the current user is member of. Returns list, use "make text from list" to display or store the value.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Link, MasterBlockType.Function];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.CURRENT_TEAMS] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.CURRENT_TEAMS,
          message0: '%{BKY_BLOCK_CURRENT_TEAMS}', // current teams
          output: '',
          colour: COLOR_CYAN,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.CURRENT_TEAMS] = function (block) {
      const code = this_.blocklyUtils.getLumeerVariable() + '.getUserTeams()';

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
