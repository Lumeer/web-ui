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
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {DataValue} from '../../../core/model/data-value';
import {TextDataValue} from '../../../core/model/data-value/text.data-value';
import {UnknownDataValue} from '../../../core/model/data-value/unknown.data-value';
import {BsModalRef} from 'ngx-bootstrap';
import {TextEditorModalComponent} from '../../modal/text-editor/text-editor-modal.component';
import {Subscription} from 'rxjs';
import {KeyCode} from '../../key-code';
import {ModalService} from '../../modal/modal.service';
import {QuillEditorComponent} from 'ngx-quill';
import {ConstraintType} from '../../../core/model/data/constraint';
import {constraintTypeClass} from '../pipes/constraint-class.pipe';

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
  @HostBinding('class.multiline')
  public multilineMode: boolean;

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
  public enterInvalid = new EventEmitter();

  @HostBinding('class.bg-danger-light')
  public invalidBackground = false;

  @ViewChild(QuillEditorComponent, {static: false})
  public textEditor: QuillEditorComponent;

  public readonly inputClass = constraintTypeClass(ConstraintType.Text);

  public text = '';
  public valid = true;
  public isMultiline = true;

  private modalRef: BsModalRef;
  private modalSubscription = new Subscription();
  private preventSave: boolean;

  public readonly modules = {
    toolbar: [['bold', 'italic', 'underline', 'strike', {script: 'sub'}, {script: 'super'}, 'clean']],
  };

  constructor(private modalService: ModalService, private renderer: Renderer2) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      this.initValue();
    }
    if (changes.value && this.value) {
      this.initValue();
    }
    this.refreshBackgroundClass(this.value);
  }

  private initValue() {
    this.text = this.value.format();
    this.valid = this.value.isValid();

    const numberOfPTagsMatch = this.text.match(/<p.*?>.+?<\/p>/g);
    this.isMultiline = numberOfPTagsMatch && numberOfPTagsMatch.length > 1;
  }

  private refreshBackgroundClass(value: DataValue) {
    this.invalidBackground = !this.readonly && value && !value.isValid() && !this.skipValidation;
  }

  private saveValue(value: string) {
    const dataValue = this.value.parseInput(value);
    if (this.skipValidation || dataValue.isValid()) {
      this.save.emit(dataValue);
    }
  }

  public openTextEditor(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const content = this.text;
    this.preventSaveAndBlur();

    this.modalRef = this.modalService.show(TextEditorModalComponent, {
      keyboard: true,
      backdrop: 'static',
      class: 'modal-xxl modal-xxl-height',
      initialState: {
        content,
        minLength: this.value && this.value.config && this.value.config.minLength,
        maxLength: this.value && this.value.config && this.value.config.maxLength,
      },
    });

    this.modalSubscription.add(this.modalRef.content.onSave$.subscribe(value => this.saveValue(value)));
    this.modalSubscription.add(this.modalRef.content.onCancel$.subscribe(() => this.cancel.emit()));
  }

  public ngOnDestroy(): void {
    this.modalSubscription.unsubscribe();
  }

  public contentChanged() {
    const newValue = this.value.parseInput(this.text);
    this.valueChange.emit(newValue);
    this.refreshBackgroundClass(newValue);
  }

  public onEditorCreated(editor: any) {
    editor.setSelection(Number.MAX_SAFE_INTEGER);

    const isMultiLine = editor.root.childElementCount > 1;
    if (isMultiLine) {
      this.renderer.setStyle(editor.root, 'overflow-x', 'auto');
      editor.scrollingContainer.scrollTop = Number.MAX_SAFE_INTEGER;
    } else {
      this.renderer.setStyle(editor.root, 'overflow-x', 'hidden');
      editor.scrollingContainer.scrollLeft = Number.MAX_SAFE_INTEGER;
    }

    this.preventEnterInEditor(editor);
  }

  private preventEnterInEditor(editor: any) {
    delete editor.keyboard.bindings[13];
    editor.keyboard.addBinding({key: 'enter'}, () => {
      return false;
    });
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        if (this.readonly) {
          event.preventDefault();
        } else {
          const dataValue = this.value.parseInput(this.text);

          event.preventDefault();

          if (!this.skipValidation && !dataValue.isValid()) {
            event.stopImmediatePropagation();
            this.enterInvalid.emit();
            return;
          }

          this.preventSaveAndBlur();
          // needs to be executed after parent event handlers
          setTimeout(() => this.save.emit(dataValue));
        }
        return;
      case KeyCode.Escape:
        this.preventSaveAndBlur();
        this.cancel.emit();
        return;
    }
  }

  private preventSaveAndBlur() {
    if (this.textEditor && this.textEditor.quillEditor) {
      this.preventSave = true;
      this.textEditor.quillEditor.root.blur();
    }
  }

  public onBlur(data: {editor: any; source: string}) {
    if (this.preventSave) {
      this.preventSave = false;
    } else {
      this.saveValue(this.text);
    }
  }
}
