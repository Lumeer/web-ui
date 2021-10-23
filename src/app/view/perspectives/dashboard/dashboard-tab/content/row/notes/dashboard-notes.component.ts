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

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {defaultTextEditorOptions} from '../../../../../../../shared/modal/text-editor/text-editor.utils';
import {DashboardNotesCellData} from '../../../../../../../core/store/dashboard-data/dashboard-data';

@Component({
  selector: 'dashboard-notes',
  templateUrl: './dashboard-notes.component.html',
  styleUrls: ['./dashboard-notes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardNotesComponent implements OnChanges, AfterViewInit {
  @Input()
  public data: DashboardNotesCellData;

  @Output()
  public dataChange = new EventEmitter<DashboardNotesCellData>();

  public readonly defaultOptions = defaultTextEditorOptions;

  @HostBinding('class.editing')
  public editing: boolean;

  public content: string;

  constructor(private element: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.data) {
      this.content = this.data?.content || '';
    }
  }

  public onFocus() {
    this.editing = true;
    this.computeEditorHeightAfterTimeout();
  }

  public onBlur() {
    this.editing = false;
    this.computeEditorHeightAfterTimeout();
    this.checkContentChange();
  }

  private checkContentChange() {
    if (this.content !== this.data?.content) {
      this.dataChange.emit({content: this.content});
    }
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

  public onContentChange() {
    if (!this.editing) {
      this.checkContentChange();
    }
  }
}
