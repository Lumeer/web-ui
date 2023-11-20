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
import {isNotNullOrUndefined} from '@lumeer/utils';

declare var Blockly: any;

export abstract class GetDocumentPropertyAbstractBlocklyComponent extends BlocklyComponent {
  protected thisType = '';

  public getVisibility(): MasterBlockType[] {
    return [MasterBlockType.Rule, MasterBlockType.Link, MasterBlockType.Function];
  }

  public getDocumentVariablesXml(workspace: any): string {
    return '<xml><block type="' + this.thisType + '"></block></xml>';
  }

  private checkWorkspaceChange(workspace, changeEvent, block) {
    if (isNotNullOrUndefined(block) && block.type === this.thisType) {
      const input = block.getInput('DOCUMENT');

      // is the input connected?
      if (isNotNullOrUndefined(input.connection.targetConnection?.check_)) {
        const inputType =
          input.connection.targetConnection?.check_ instanceof Array
            ? input.connection.targetConnection?.check_[0]
            : input.connection.targetConnection?.check_;

        // something unsupported got connected
        if (!inputType.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX)) {
          this.blocklyUtils.tryDisconnect(block, input.connection);
        }
      }
    }
  }

  public onWorkspaceChange(workspace, changeEvent) {
    if (
      changeEvent instanceof Blockly.Events.Create ||
      changeEvent instanceof Blockly.Events.Change ||
      changeEvent instanceof Blockly.Events.Move
    ) {
      const block = workspace.getBlockById(changeEvent.blockId);
      this.checkWorkspaceChange(workspace, changeEvent, block);

      if (changeEvent.newParentId) {
        const parent = workspace.getBlockById(changeEvent.newParentId);
        this.checkWorkspaceChange(workspace, changeEvent, parent);
      }

      if (changeEvent.oldParentId) {
        const parent = workspace.getBlockById(changeEvent.oldParentId);
        this.checkWorkspaceChange(workspace, changeEvent, parent);
      }
    }
  }
}
