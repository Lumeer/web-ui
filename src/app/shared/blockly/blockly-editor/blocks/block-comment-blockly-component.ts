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

export class BlockCommentBlocklyComponent extends BlocklyComponent {
  private tooltip: string;
  private sampleComment: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.blockCommentBlock:Add any comment to your automation.`;
    this.sampleComment = $localize`:@@blockly.sampleComment.blockCommentBlock:Your comment goes here...`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Link];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.BLOCK_COMMENT] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.BLOCK_COMMENT,
          message0: '/* %1 */',
          args0: [
            {
              type: 'field_input',
              name: 'COMMENT',
              text: this_.sampleComment,
            },
          ],
          previousStatement: null,
          nextStatement: null,
          colour: COLOR_CYAN,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.BLOCK_COMMENT] = function (block) {
      const comment = block.getFieldValue('COMMENT');

      return `/* ${comment} */\n`;
    };
  }
}
