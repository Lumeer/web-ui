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

declare var Blockly: any;

export class NavigateByIdBlocklyComponent extends BlocklyComponent {
  private tooltip: string;
  private windowOptions: string[];
  private sidebarOptions: string[];

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.navigateByIdBlock:Opens the given view (specified by ID, as read from an attribute of type View) and record. It can open the view in the same browser tab or in a new one. Where possible (e.g. Workflow), a sidebar can be opened.`;

    this.windowOptions = $localize`:@@blockly.dropdown.window.navigateBlock:the same,a new`.split(',');
    this.sidebarOptions = $localize`:@@blockly.dropdown.sidebar.navigateBlock:closed,opened`.split(',');
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Link];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.NAVIGATE_TO_VIEW_BY_ID] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.NAVIGATE_TO_VIEW_BY_ID,
          message0: '%{BKY_BLOCK_NAVIGATE_TO_VIEW_BY_ID}', // navigate to view %1 in %2 browser tab %3 with the sidebar %4 %5 and focus on record %6
          args0: [
            {
              type: 'input_value',
              name: 'VIEW_ID',
              align: 'RIGHT',
            },
            {
              type: 'field_dropdown',
              name: 'NEW_WINDOW',
              options: [
                [this_.windowOptions[0], 'false'],
                [this_.windowOptions[1], 'true'],
              ],
            },
            {
              type: 'input_dummy',
              align: 'RIGHT',
            },
            {
              type: 'field_dropdown',
              name: 'SIDEBAR',
              options: [
                [this_.sidebarOptions[0], 'false'],
                [this_.sidebarOptions[1], 'true'],
              ],
            },
            {
              type: 'input_dummy',
              align: 'RIGHT',
            },
            {
              type: 'input_value',
              name: 'DOCUMENT',
              align: 'RIGHT',
            },
          ],
          previousStatement: null,
          nextStatement: null,
          colour: COLOR_AMBER,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.NAVIGATE_TO_VIEW_BY_ID] = function (block) {
      const viewId = Blockly.JavaScript.valueToCode(block, 'VIEW_ID', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const newWindow = block.getFieldValue('NEW_WINDOW') || false;
      const sidebar = block.getFieldValue('SIDEBAR') || false;
      const document = Blockly.JavaScript.valueToCode(block, 'DOCUMENT', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;

      if (!document || !viewId) {
        return '';
      }

      return this_.blocklyUtils.getLumeerVariable() + `.navigate(${viewId}, ${document}, ${sidebar}, ${newWindow});\n`;
    };
  }
}
