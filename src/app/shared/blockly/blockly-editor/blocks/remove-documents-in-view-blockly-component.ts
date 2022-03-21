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
import {isNotNullOrUndefined} from '../../../utils/common.utils';

declare var Blockly: any;

export class RemoveDocumentsInViewBlocklyComponent extends BlocklyComponent {
  protected tooltip: string;
  protected viewOptions = [];

  public constructor(public blocklyUtils: BlocklyUtils, protected views: View[]) {
    super(blocklyUtils);

    views.forEach(view => this.viewOptions.push([view.name.replace(/ /g, '\u00A0'), view.id]));

    if (this.viewOptions.length === 0) {
      this.viewOptions.push(['?', '']);
    }

    const limit = BlocklyUtils.CREATE_DELETE_DOCUMENTS_LINKS_LIMIT;
    this.tooltip = $localize`:@@blockly.tooltip.removeDocumentsInViewBlock:Remove documents in the view specified by ID (as read from an attribute of type View). At most ${limit}:limit: records are deleted at once.`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Link];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.REMOVE_DOCUMENTS_IN_VIEW] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.REMOVE_DOCUMENTS_IN_VIEW,
          message0: 'remove documents in view %1', //'%{BKY_BLOCK_REMOVE_DOCUMENTS_IN_VIEW}', // read records from %1
          args0: [
            {
              type: 'input_value',
              name: 'VIEW_ID',
            },
          ],
          colour: COLOR_AMBER,
          tooltip: this_.tooltip,
          previousStatement: null,
          nextStatement: null,
          helpUrl: '',
        });
      },
    };

    Blockly.JavaScript[BlocklyUtils.REMOVE_DOCUMENTS_IN_VIEW] = function (block) {
      const viewId = Blockly.JavaScript.valueToCode(block, 'VIEW_ID', Blockly.JavaScript.ORDER_ATOMIC) || null;

      return this_.blocklyUtils.getLumeerVariable() + `.removeDocumentsInView(${viewId});\n`;
    };
  }
}
