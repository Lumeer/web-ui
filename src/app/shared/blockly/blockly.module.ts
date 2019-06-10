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

import {BlocklyEditorComponent} from './blockly-editor/blockly-editor.component';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BlocklyDebuggerComponent} from './blockly-debugger/blockly-debugger.component';
import {BlocklyDebuggerRemoteComponent} from './blockly-debugger/blockly-debugger-remote/blockly-debugger-remote.component';
import {PipesModule} from '../pipes/pipes.module';
import {DirectivesModule} from '../directives/directives.module';

@NgModule({
  declarations: [BlocklyEditorComponent, BlocklyDebuggerComponent, BlocklyDebuggerRemoteComponent],
  imports: [CommonModule, PipesModule, DirectivesModule],
  exports: [BlocklyEditorComponent, BlocklyDebuggerComponent, BlocklyDebuggerRemoteComponent],
})
export class BlocklyModule {}
