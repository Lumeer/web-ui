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

export class DateNowBlocklyComponent extends BlocklyComponent {
  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function, MasterBlockType.Link, MasterBlockType.Value];
  }

  public registerBlock(workspace: any): void {
    Blockly.Blocks[BlocklyUtils.DATE_NOW] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.DATE_NOW,
          message0: '%{BKY_BLOCK_DATE_NOW}', // now
          output: '',
          colour: COLOR_PINK,
          tooltip: '',
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.DATE_NOW] = function (block) {
      const code = '((new Date()).toISOString())';

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }

  public getDocumentVariablesXml(workspace: any): string {
    return null;
  }
}
