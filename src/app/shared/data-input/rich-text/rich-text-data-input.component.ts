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
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import {DataValue} from '../../../core/model/data-value';
import {TextDataValue} from '../../../core/model/data-value/text.data-value';
import {UnknownDataValue} from '../../../core/model/data-value/unknown.data-value';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import {TextEditorModalComponent} from '../../modal/text-editor/text-editor-modal.component';
import {Subscription} from 'rxjs';

@Component({
  selector: 'rich-text-data-input',
  templateUrl: './rich-text-data-input.component.html',
  styleUrls: ['./rich-text-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RichTextDataInputComponent implements OnChanges, OnDestroy {
  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public skipValidation: boolean;

  @Input()
  public value: TextDataValue | UnknownDataValue;

  @Input()
  public placeholder: string;

  @Output()
  public valueChange = new EventEmitter<DataValue>();

  @Output()
  public save = new EventEmitter<DataValue>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public dataBlur = new EventEmitter();

  @Output()
  public onFocus = new EventEmitter<any>();

  public text = '';
  public valid = true;

  private modalRef: BsModalRef;
  private modalSubscription = new Subscription();

  constructor(private modalService: BsModalService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      this.text = this.value.format();

      this.openTextEditor();
    }
    if (changes.value && this.value) {
      this.text = this.value.format();
    }
    if (changes.focus && !this.focus) {
      this.closeTextEditor();
    }
  }

  private saveValue(value: string) {
    const dataValue = this.value.parseInput(value);
    this.save.emit(dataValue);
  }

  private closeTextEditor() {
    if (this.modalRef) {
      this.modalRef.hide();
    }
  }

  private openTextEditor() {
    this.modalRef = this.modalService.show(TextEditorModalComponent, {
      keyboard: true,
      backdrop: 'static',
      class: 'modal-xxl modal-xxl-height',
      initialState: {
        content: this.text,
        minLength: this.value && this.value.config && this.value.config.minLength,
        maxLength: this.value && this.value.config && this.value.config.maxLength,
      },
    });

    this.modalSubscription.add(
      this.modalRef.content.onSave.subscribe(content => {
        this.saveValue(content);
      })
    );
    this.modalSubscription.add(
      this.modalRef.content.onCancel.subscribe(() => {
        this.dataBlur.emit();
        this.cancel.emit();
      })
    );
  }

  public ngOnDestroy(): void {
    this.modalSubscription.unsubscribe();
  }
}
