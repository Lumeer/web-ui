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
import {COLOR_RED} from '../../../../core/constants';

declare var Blockly: any;

export class ForEachLinkArrayBlocklyComponent extends BlocklyComponent {
  private tooltip: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.forEachLinkBlock:Loops over all links in the given list.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function, MasterBlockType.Link, MasterBlockType.Value];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.FOREACH_LINK_ARRAY] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.FOREACH_LINK_ARRAY,
          message0: '%{BKY_BLOCK_FOREACH_LINK}', // for each link %1 in %2
          args0: [
            {
              type: 'field_variable',
              name: 'VAR',
              variable: null,
            },
            {
              type: 'input_value',
              name: 'LIST',
              check: null,
            },
          ],
          message1: '%{BKY_BLOCK_FOREACH_LINK_DO}', // do this %1
          args1: [
            {
              type: 'input_statement',
              name: 'DO',
            },
          ],
          previousStatement: null,
          nextStatement: null,
          colour: COLOR_RED,
          tooltip: this_.tooltip,
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.FOREACH_LINK_ARRAY] = Blockly.JavaScript['controls_forEach'];
  }
}
