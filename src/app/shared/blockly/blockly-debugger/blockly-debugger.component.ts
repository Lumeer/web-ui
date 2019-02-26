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

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

export enum BlocklyDebugDisplay {
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
export class BlocklyDebuggerComponent implements OnInit {
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

  @ViewChild('myDiv')
  private myDiv: ElementRef;

  @Output()
  public displayEvent = new EventEmitter<BlocklyDebugDisplay>();

  public readonly displayTypes = BlocklyDebugDisplay;

  public ngOnInit(): void {
    this.onWindowResize();
  }

  public display(type: BlocklyDebugDisplay, event?: Event) {
    event && event.stopPropagation();
    this.displayEvent.emit(type);
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.recomputeWidth(this.myDiv);
  }

  public recomputeWidth(div: ElementRef) {
    if (div) {
      const parentDiv = (div.nativeElement as HTMLElement).offsetParent as HTMLElement;
      const paddingLeft = +window
        .getComputedStyle(parentDiv)
        .getPropertyValue('padding-left')
        .replace('px', '');
      const paddingRight = +window
        .getComputedStyle(parentDiv)
        .getPropertyValue('padding-right')
        .replace('px', '');
      const formWidth = parentDiv.clientWidth - parentDiv.offsetLeft - paddingLeft - paddingRight;
      document.body.style.setProperty('--blockly-log-width', `${formWidth}px`);
    }
  }
}
