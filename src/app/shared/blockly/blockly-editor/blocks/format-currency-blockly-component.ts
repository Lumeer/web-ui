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
import {TranslationService} from '../../../../core/service/translation.service';
import {LanguageTag} from '@lumeer/data-filters';
import {isNullOrUndefinedOrEmpty} from '../../../utils/common.utils';

declare var Blockly: any;

export class FormatCurrencyBlocklyComponent extends BlocklyComponent {
  private tooltip: string;
  private options = [];

  public constructor(public blocklyUtils: BlocklyUtils, private translationService: TranslationService) {
    super(blocklyUtils);

    this.tooltip = $localize`:@@blockly.tooltip.formatCurrencyBlock:Formats number as a currency using defined locale.`;

    Object.values(LanguageTag)
      .filter(k => isNaN(Number(k)))
      .forEach(tag => {
        if (tag !== 'en-CA') {
          // the same as fr-CA
          this.options.push([this.translationService.translateLanguageTag(tag as LanguageTag), tag]);
        }
      });

    this.options = this.options.sort((a, b) => a[0].localeCompare(b[0]));
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function, MasterBlockType.Link, MasterBlockType.Value];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.FORMAT_CURRENCY] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.FORMAT_CURRENCY,
          message0: '%{BKY_BLOCK_FORMAT_CURRENCY}', // format currency in locale %1 with %2 decimals %3
          args0: [
            {
              type: 'field_dropdown',
              name: 'LOCALE',
              options: this_.options,
            },
            {
              type: 'field_number',
              name: 'DECIMALS',
              value: 2,
            },
            {
              type: 'input_value',
              name: 'NUMBER',
              check: 'Number',
            },
          ],
          output: '',
          colour: COLOR_CYAN,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyUtils.FORMAT_CURRENCY] = function (block) {
      const locale = block.getFieldValue('LOCALE') || null;
      const decimals = block.getFieldValue('DECIMALS') || 0;
      const value_number = Blockly.JavaScript.valueToCode(block, 'NUMBER', Blockly.JavaScript.ORDER_ATOMIC) || null;
      const code = `/** numbro.js **/ lumeer_numbro('${locale}', ${decimals}, ${value_number})`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }
}
