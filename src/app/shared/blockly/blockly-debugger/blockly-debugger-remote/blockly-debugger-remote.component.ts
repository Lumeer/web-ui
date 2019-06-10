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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {BlocklyDebugDisplay} from '../blockly-debugger.component';

@Component({
  selector: 'blockly-debugger-remote',
  templateUrl: './blockly-debugger-remote.component.html',
  styleUrls: ['./blockly-debugger-remote.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocklyDebuggerRemoteComponent {
  @Input()
  public displayButtons: BlocklyDebugDisplay[];

  @Output()
  public displayEvent = new EventEmitter<BlocklyDebugDisplay>();

  public readonly displayTypes = BlocklyDebugDisplay;

  public display(type: BlocklyDebugDisplay) {
    this.displayEvent.emit(type);
  }
}
