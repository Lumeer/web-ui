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
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';

import {LinkDataValue, completeLinkValue, formatLinkValue} from '@lumeer/data-filters';

import {EmbeddedLinkModalComponent} from '../../modal/embedded-link/embedded-link-modal.component';
import {preventEvent} from '../../utils/common.utils';
import {CommonDataInputConfiguration} from '../data-input-configuration';
import {DataInputModalService} from '../data-input-modal.service';
import {DataInputSaveAction} from '../data-input-save-action';

@Component({
  selector: 'link-data-input',
  templateUrl: './link-data-input.component.html',
  styleUrls: ['./link-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'px-1 w-100 h-100 d-flex align-items-center'},
})
export class LinkDataInputComponent implements OnChanges {
  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public commonConfiguration: CommonDataInputConfiguration;

  @Input()
  public value: LinkDataValue;

  @Input()
  public fontColor: string;

  @Output()
  public valueChange = new EventEmitter<LinkDataValue>();

  @Output()
  public save = new EventEmitter<{action: DataInputSaveAction; dataValue: LinkDataValue}>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public enterInvalid = new EventEmitter();

  public linkValue: string;
  public completeLinkValue: SafeUrl;
  public titleValue: string;
  public rawLinkValue: string;
  public rawTitleValue: string;

  constructor(
    public element: ElementRef,
    private domSanitizer: DomSanitizer,
    private modalService: DataInputModalService
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.value && this.value) {
      this.linkValue = this.value.linkValue;
      this.completeLinkValue = this.domSanitizer.bypassSecurityTrustUrl(completeLinkValue(this.linkValue));
      this.titleValue = this.value.titleValue;
      this.rawLinkValue = this.value.rawLinkValue;
      this.rawTitleValue = this.value.rawTitleValue;
    }
  }

  public onCancel() {
    this.cancel.emit();
  }

  public onSave(data: {link: string; title: string; enter?: boolean}) {
    const formattedValue = formatLinkValue(data.link, data.title);
    const newValue = this.value.parseInput(formattedValue);
    const action = data.enter ? DataInputSaveAction.Enter : DataInputSaveAction.Button;
    this.save.next({action, dataValue: newValue});
  }

  public onLinkClick(event: MouseEvent) {
    preventEvent(event);

    this.modalService.show(EmbeddedLinkModalComponent, {
      keyboard: true,
      class: 'modal-xxl modal-h-100',
      initialState: {url: this.domSanitizer.bypassSecurityTrustResourceUrl(completeLinkValue(this.linkValue))},
    });
  }
}
