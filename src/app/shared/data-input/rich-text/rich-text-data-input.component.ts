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
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {TextEditorModalComponent} from '../../modal/text-editor/text-editor-modal.component';
import {Subscription} from 'rxjs';
import {KeyCode} from '../../key-code';
import {ContentChange, QuillEditorComponent} from 'ngx-quill';
import {constraintTypeClass} from '../pipes/constraint-class.pipe';
import {isNotNullOrUndefined, preventEvent, unescapeHtml} from '../../utils/common.utils';
import {CommonDataInputConfiguration} from '../data-input-configuration';
import {DataInputSaveAction, keyboardEventInputSaveAction} from '../data-input-save-action';
import {DataInputModalService} from '../data-input-modal.service';
import {ConstraintType, DataValue, TextDataValue} from '@lumeer/data-filters';

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
  public commonConfiguration: CommonDataInputConfiguration;

  @Input()
  @HostBinding('class.multiline')
  public multilineMode: boolean;

  @Input()
  public value: TextDataValue;

  @Input()
  public placeholder: string;

  @Input()
  public editableInReadonly: boolean;

  @Output()
  public valueChange = new EventEmitter<DataValue>();

  @Output()
  public save = new EventEmitter<{action: DataInputSaveAction; dataValue: DataValue}>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public enterInvalid = new EventEmitter();

  @HostBinding('class.bg-danger-light')
  public invalidBackground = false;

  @ViewChild(QuillEditorComponent)
  public textEditor: QuillEditorComponent;

  public readonly inputClass = constraintTypeClass(ConstraintType.Text);

  public text = '';
  public valid = true;
  public isMultiline = true;

  private modalRef: BsModalRef;
  private modalSubscription = new Subscription();
  private preventSave: boolean;
  private keyDownListener: (event: KeyboardEvent) => void;

  public readonly modules = {
    toolbar: [['bold', 'italic', 'underline', 'strike', {script: 'sub'}, {script: 'super'}, 'clean']],
  };

  constructor(private modalService: DataInputModalService, private renderer: Renderer2, private element: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      this.addKeyDownListener();
      this.initValue();
    }
    if (changes.value && this.value) {
      this.initValue();
    }
    this.refreshBackgroundClass(this.value);
  }

  private addKeyDownListener() {
    this.removeKeyDownListener();

    this.keyDownListener = event => this.onKeyDown(event);
    this.element.nativeElement.addEventListener('keydown', this.keyDownListener);
  }

  private removeKeyDownListener() {
    if (this.keyDownListener) {
      this.element.nativeElement.removeEventListener('keydown', this.keyDownListener);
    }
    this.keyDownListener = null;
  }

  private initValue() {
    const text = this.value.format();
    if (isNotNullOrUndefined(this.value.inputValue)) {
      setTimeout(() => {
        const textToPaste = unescapeHtml(text);
        this.textEditor?.quillEditor?.clipboard.dangerouslyPasteHTML(textToPaste);
      });
    } else {
      this.text = text;
    }
    this.valid = this.value.isValid();
    this.isMultiline = numberOfPTags(this.text) > 1;
  }

  private refreshBackgroundClass(value: DataValue) {
    this.invalidBackground = !this.readonly && value && !value.isValid() && !this.commonConfiguration?.skipValidation;
  }

  private saveValue(value: string, action: DataInputSaveAction) {
    const dataValue = this.value.parseInput(value);
    if (this.commonConfiguration?.skipValidation || dataValue.isValid()) {
      this.save.emit({action, dataValue});
    }
  }

  public openTextEditor(event?: MouseEvent) {
    event && preventEvent(event);

    const content = this.text;
    this.preventSaveAndBlur();

    this.modalRef = this.modalService.show(TextEditorModalComponent, {
      keyboard: true,
      backdrop: 'static',
      class: 'modal-xxl modal-xxl-height',
      initialState: {
        readonly: this.readonly && !this.editableInReadonly,
        content,
        minLength: this.value?.config?.minLength,
        maxLength: this.value?.config?.maxLength,
      },
    });

    this.modalSubscription.add(
      this.modalRef.content.onSave$.subscribe(value => this.saveValue(value, DataInputSaveAction.Button))
    );
    this.modalSubscription.add(this.modalRef.content.onCancel$.subscribe(() => this.cancel.emit()));
  }

  public ngOnDestroy(): void {
    this.modalSubscription.unsubscribe();
  }

  public contentChanged(event: ContentChange) {
    this.text = event.html;
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
      editor.scrollingContainer.scrollLeft = Number.MAX_SAFE_INTEGER;
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

  private onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        const dataValue = this.value.parseInput(this.text);

        event.preventDefault();

        if (!this.commonConfiguration?.skipValidation && !dataValue.isValid()) {
          event.stopImmediatePropagation();
          this.enterInvalid.emit();
          return;
        }

        this.preventSaveAndBlur();
        this.saveDataValue(dataValue, event);
        return;
      case KeyCode.Escape:
        this.preventSaveAndBlur();
        this.cancel.emit();
        return;
    }
  }

  private saveDataValue(dataValue: TextDataValue, event: KeyboardEvent) {
    const action = keyboardEventInputSaveAction(event);
    if (this.commonConfiguration?.delaySaveAction) {
      // needs to be executed after parent event handlers
      setTimeout(() => this.save.emit({action, dataValue}));
    } else {
      this.save.emit({action, dataValue});
    }
  }

  private preventSaveAndBlur() {
    if (this.textEditor && this.textEditor.quillEditor) {
      this.preventSave = true;
      this.textEditor.quillEditor.root.blur();
    }
  }

  public onBlur(data: {editor: any; source: string}) {
    this.removeKeyDownListener();
    if (this.preventSave) {
      this.preventSave = false;
    } else {
      this.saveValue(this.text, DataInputSaveAction.Blur);
    }
  }

  public onDoubleClick() {
    if (this.readonly && !this.editableInReadonly) {
      this.openTextEditor();
    }
  }
}

function numberOfPTags(value: string): number {
  const match = value.match(/<p.*?>.+?<\/p>/g);
  return match ? match.length : 0;
}
