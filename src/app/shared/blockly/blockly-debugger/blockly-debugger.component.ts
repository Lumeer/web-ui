/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {ChangeDetectionStrategy, Component, Input} from '@angular/core';

export const enum BlocklyDebugDisplay {
  DisplayNone = '',
  DisplayJs = 'js',
  DisplayError = 'error',
  DisplayLog = 'log',
}

@Component({
  selector: 'blockly-debugger',
  templateUrl: './blockly-debugger.component.html',
  styleUrls: ['./blockly-debugger.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocklyDebuggerComponent {
  @Input()
  public displayDebug: BlocklyDebugDisplay = BlocklyDebugDisplay.DisplayNone;

  @Input()
  public blocklyJs = '';

  @Input()
  public blocklyResultTimestamp = 0;

  @Input()
  public blocklyError = '';

  @Input()
  public blocklyDryRunResult = '';

  public displayNone = BlocklyDebugDisplay.DisplayNone;
  public displayJs = BlocklyDebugDisplay.DisplayJs;
  public displayLog = BlocklyDebugDisplay.DisplayLog;
  public displayError = BlocklyDebugDisplay.DisplayError;

  public display(type: BlocklyDebugDisplay) {
    this.displayDebug = type;
  }
}
