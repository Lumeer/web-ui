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
import {COLOR_PINK} from '../../../../core/constants';

declare var Blockly: any;

export class IsoToDateBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.isoToDateBlock:Converts date in an ISO string (from stored data) to the date object.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function, MasterBlockType.Link, MasterBlockType.Value];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.ISO_TO_DATE] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.ISO_TO_DATE,
          message0: '%{BKY_BLOCK_ISO_TO_DATE}', // ISO to date %1
          args0: [
            {
              type: 'input_value',
              name: 'ISO',
            },
          ],
          output: '',
          colour: COLOR_PINK,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.ISO_TO_DATE] = function (block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'ISO', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;

      if (!argument0) {
        return '';
      }

      const code = `(new Date(${argument0}))`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
