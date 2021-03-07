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

import {COLOR_PRIMARY, COLOR_SUCCESS} from '../../../../core/constants';
import {BlocklyUtils, MasterBlockType} from '../blockly-utils';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkDocumentsNoReturnBlocklyComponent} from './link-documents-no-return-blockly-component';
import {BlocklyComponent} from './blockly-component';
import {View} from '../../../../core/store/views/view';

declare var Blockly: any;

export class ReadDocumentsBlocklyComponent extends BlocklyComponent {
  protected tooltip: string;
  protected viewOptions = [];

  public constructor(public blocklyUtils: BlocklyUtils, public i18n: I18n, protected views: View[]) {
    super(blocklyUtils, i18n);

    views.forEach(view => this.viewOptions.push([view.name, view.id]));

    if (this.viewOptions.length === 0) {
      this.viewOptions.push(['?', '']);
    }

    this.tooltip = i18n(
      {
        id: 'blockly.tooltip.readDocumentsBlock',
        value:
          'Read records returned from the selected view. If there are multiple tables or links used, only records from the first table are returned. At most {{limit}} records are returned.',
      },
      {limit: BlocklyUtils.MAXIMUM_DOCUMENTS_RETURNED}
    );
  }

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Function];
  }

  public registerBlock(workspace: any): void {
    const this_ = this;

    Blockly.Blocks[BlocklyUtils.READ_DOCUMENTS] = {
      init: function () {
        this.jsonInit({
          type: BlocklyUtils.READ_DOCUMENTS,
          message0: 'read records from %1', //'%{BKY_BLOCK_CREATE_DOCUMENT}', // create record in %1,
          args0: [
            {
              type: 'field_dropdown',
              name: 'VIEW_ID',
              options: this_.viewOptions,
            },
          ],
          output: '',
          colour: COLOR_SUCCESS,
          tooltip: this_.tooltip,
          helpUrl: '',
        });
      },
    };

    Blockly.JavaScript[BlocklyUtils.READ_DOCUMENTS] = function (block) {
      const viewId = block.getFieldValue('VIEW_ID') || null;

      const code = this_.blocklyUtils.getLumeerVariable() + `.readView('${viewId}')`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }

  public getDocumentVariablesXml(workspace: any): string {
    return '<xml><block type="' + BlocklyUtils.READ_DOCUMENTS + '"></block></xml>';
  }

  public onWorkspaceChange(workspace, changeEvent) {
    super.onWorkspaceChange(workspace, changeEvent);

    if (
      changeEvent instanceof Blockly.Events.Create ||
      changeEvent instanceof Blockly.Events.Change ||
      changeEvent instanceof Blockly.Events.Move
    ) {
      const block = workspace.getBlockById(changeEvent.blockId);

      if (block.type === BlocklyUtils.READ_DOCUMENTS) {
        const viewId = block.getField('VIEW_ID').value_;
        const view = this.views.find(v => v.id === viewId);

        if (view) {
          const collectionId = view.query?.stems[0]?.collectionId;
          if (collectionId) {
            block.setOutput(true, collectionId + BlocklyUtils.DOCUMENT_ARRAY_TYPE_SUFFIX);
          }
        }
      }
    }
  }
}
