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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {HtmlModifier} from '../../../../shared/utils/html-modifier';
import {Perspective, perspectiveIconsMap} from '../../perspective';

@Component({
  selector: 'smartdoc-bottom-panel',
  templateUrl: './smartdoc-bottom-panel.component.html',
  styleUrls: ['./smartdoc-bottom-panel.component.scss']
})
export class SmartDocBottomPanelComponent {

  @Input()
  public selected: boolean;

  @Input()
  public showMover: boolean;

  @Input()
  public partIndex: number;

  @Input()
  public documentId: string;

  @Input()
  public perspectives: Perspective[] = [];

  @Input()
  public selectedPerspective: Perspective;

  @Output()
  public switchPerspective = new EventEmitter<Perspective>();

  @Output()
  public copyPart = new EventEmitter();

  @Output()
  public removePart = new EventEmitter();

  public onSwitchPerspective(perspective: Perspective) {
    this.switchPerspective.emit(perspective);
  }

  public onCopyPart() {
    this.copyPart.emit();
  }

  public onRemovePart() {
    this.removePart.emit();
  }

  public perspectiveIcon(perspective: Perspective): string {
    return perspectiveIconsMap[perspective];
  }

  public removeHtmlComments(html: HTMLElement): string {
    return HtmlModifier.removeHtmlComments(html);
  }

}
