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

export class GetVariableBlocklyComponent extends BlocklyComponent {
  private tooltip: string;
  private variableOptions = [];

  public constructor(public blocklyUtils: BlocklyUtils, private variables: string[]) {
    super(blocklyUtils);

    variables.forEach(variable => this.variableOptions.push([variable.replace(/ /g, '\u00A0'), variable]));

    if (this.variableOptions.length === 0) {
      this.variableOptions.push(['?', '']);
    }

    this.tooltip = $localize`:@@blockly.tooltip.getVariableBlock:Gets the value of a project variable (including hidden secured variables).`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Function, MasterBlockType.Link];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.GET_RESOURCE_VARIABLE] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.GET_RESOURCE_VARIABLE,
          message0: 'get value of project variable %1', //'%{BKY_BLOCK_GET_RESOURCE_VARIABLE}', // get value of project variable %1
          args0: [
            {
              type: 'field_dropdown',
              name: 'VARIABLE_NAME',
              options: this_.variableOptions,
            },
          ],
          output: '',
          colour: COLOR_CYAN,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.GET_RESOURCE_VARIABLE] = function (block) {
      const variableId = block.getFieldValue('VARIABLE_NAME') || null;

      if (!variableId) {
        return '';
      }

      const code = this_.blocklyUtils.getLumeerVariable() + `.getVariable('${variableId}')`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
