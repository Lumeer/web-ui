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

import {Component, ElementRef, HostBinding, HostListener} from '@angular/core';
import {defaultTextEditorOptions} from '../../../../../../../shared/modal/text-editor/text-editor.utils';
import {Blur, Focus} from 'ngx-quill';

@Component({
  selector: 'dashboard-notes',
  templateUrl: './dashboard-notes.component.html',
  styleUrls: ['./dashboard-notes.component.scss'],
})
export class DashboardNotesComponent {
  public readonly defaultOptions = defaultTextEditorOptions;

  @HostBinding('class.editing')
  public editing: boolean;

  public text: string;

  constructor(private element: ElementRef) {}

  public onFocus(focus: Focus) {
    this.editing = true;
    this.computeEditorHeightAfterTimeout();
  }

  public onBlur(blur: Blur) {
    this.editing = false;
    this.computeEditorHeightAfterTimeout();
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.computeEditorHeight();
  }

  public ngAfterViewInit() {
    this.computeEditorHeightAfterTimeout();
  }

  private computeEditorHeightAfterTimeout() {
    setTimeout(() => this.computeEditorHeight());
  }

  private computeEditorHeight() {
    const toolbar = this.element.nativeElement.querySelector('.ql-toolbar');
    const toolbarHeight = toolbar ? +toolbar.clientHeight : 0;

    const height = +this.element.nativeElement.parentElement.clientHeight - toolbarHeight;

    this.element.nativeElement.style.setProperty('--editor-height', `${height}px`);
  }
}
