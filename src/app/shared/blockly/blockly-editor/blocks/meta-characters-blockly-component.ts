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
import {COLOR_PINK} from '../../../../core/constants';
import {BlocklyUtils, MasterBlockType} from '../blockly-utils';
import {BlocklyComponent} from './blockly-component';

declare var Blockly: any;

export class MetaCharactersBlocklyComponent extends BlocklyComponent {
  private tooltip: string;
  private cr: string;
  private lf: string;
  private tab: string;

  public constructor(public blocklyUtils: BlocklyUtils) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.metaCharactersBlock:Gets a special meta character.`;
    this.lf = $localize`:@@blockly.text.metaCharactersBlock.lf:Line Feed`;
    this.cr = $localize`:@@blockly.text.metaCharactersBlock.cr:Carriage Return`;
    this.tab = $localize`:@@blockly.text.metaCharactersBlock.tab:Tab`;
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Link, MasterBlockType.Function];
  }

  public registerBlock(workspace: any) {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.META_CHARACTERS] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.META_CHARACTERS,
          message0: 'special character %1', //'%{BKY_BLOCK_META_CHARACTERS}', // now
          args0: [
            {
              type: 'field_dropdown',
              name: 'CHARACTER',
              options: [
                [`${this_.lf} (\\n)`, '\\n'],
                [`${this_.cr} (\\r)`, '\\r'],
                [`${this_.cr} ${this.lf} (\\r\\n)`, '\\r\\n'],
                [`${this_.tab} (\\t)`, '\\t'],
              ],
            },
          ],
          output: 'String',
          colour: '%{BKY_TEXTS_HUE}',
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.META_CHARACTERS] = function (block) {
      var code = "'" + (block.getFieldValue('CHARACTER') || '') + "'";
      return [code, Blockly.JavaScript.ORDER_ATOMIC];
    };
  }
}
