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

import {BlocklyUtils, MasterBlockType} from '../blockly-utils';
import {I18n} from '@ngx-translate/i18n-polyfill';

export abstract class BlocklyComponent {
  public constructor(public blocklyUtils: BlocklyUtils, public i18n: I18n) {}

  public abstract getVisibility(): MasterBlockType[];

  public abstract registerBlock(workspace: any): void;

  public getDocumentVariablesXml(workspace: any): string {
    return null;
  }

  public getLinkVariablesXml(workspace: any): string {
    return null;
  }

  // tslint:disable-next-line:no-empty
  public onWorkspaceChange(workspace, changeEvent) {}
}
