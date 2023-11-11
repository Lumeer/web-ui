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

import {COLOR_AMBER} from '../../../../core/constants';
import {BlocklyUtils, MasterBlockType} from '../blockly-utils';
import {BlocklyComponent} from './blockly-component';
import {View} from '../../../../core/store/views/view';

declare var Blockly: any;

export class GetViewNameBlocklyComponent extends BlocklyComponent {
  protected tooltip: string;

  public constructor(
    public blocklyUtils: BlocklyUtils,
    protected views: View[]
  ) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.getViewNameBlock:Gets the name of the view specified by ID (as read from an attribute of type View).`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Link, MasterBlockType.Function];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.GET_VIEW_NAME] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.GET_VIEW_NAME,
          message0: '%{BKY_BLOCK_GET_VIEW_NAME}', // get view name from id %1
          args0: [
            {
              type: 'input_value',
              name: 'VIEW_ID',
            },
          ],
          output: 'String',
          colour: COLOR_AMBER,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };

    Blockly.JavaScript[BlocklyUtils.GET_VIEW_NAME] = function (block) {
      const viewId = Blockly.JavaScript.valueToCode(block, 'VIEW_ID', Blockly.JavaScript.ORDER_ATOMIC) || null;

      if (!viewId) {
        return '';
      }

      const code = this_.blocklyUtils.getLumeerVariable() + `.getViewName(${viewId})`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
