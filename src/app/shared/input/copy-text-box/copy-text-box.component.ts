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

import {ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {ClipboardService} from '../../../core/service/clipboard.service';

@Component({
  selector: 'copy-text-box',
  templateUrl: './copy-text-box.component.html',
  styleUrls: ['./copy-text-box.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyTextBoxComponent implements OnInit {
  @Input()
  public label: string;

  @Input()
  public value: string;

  public copied$ = new BehaviorSubject<boolean>(false);
  public copiedText: string;

  @ViewChild('copyInputBox')
  private copyInputBoxElement: ElementRef<HTMLInputElement>;

  constructor(private clipboardService: ClipboardService) {}

  public ngOnInit(): void {
    this.copiedText = $localize`:@@copyTextBox.clipboard.copied:Copied!`;
  }

  public copyValue() {
    this.clipboardService.copy(this.value);
    this.copied$.next(true);
    setTimeout(() => this.copied$.next(false), 3000);
  }
}
