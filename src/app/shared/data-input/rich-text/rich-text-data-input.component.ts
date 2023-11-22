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
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {BsModalRef} from 'ngx-bootstrap/modal';
import {DeviceDetectorService} from 'ngx-device-detector';
import {ContentChange, QuillEditorComponent} from 'ngx-quill';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {map} from 'rxjs/operators';

import {ConstraintType, DataValue, TextDataValue} from '@lumeer/data-filters';
import {isNotNullOrUndefined, unescapeHtml} from '@lumeer/utils';

import {ModalData} from '../../../core/model/modal-data';
import {AppState} from '../../../core/store/app.state';
import {Workspace} from '../../../core/store/navigation/workspace';
import {ModalSettings} from '../../../core/store/view-settings/view-settings';
import {ViewSettingsAction} from '../../../core/store/view-settings/view-settings.action';
import {selectViewSettingsById} from '../../../core/store/view-settings/view-settings.state';
import {viewSettingsIdByWorkspace} from '../../../core/store/view-settings/view-settings.util';
import {animateOpacityEnterLeave} from '../../animations';
import {KeyCode, keyboardEventCode} from '../../key-code';
import {TextEditorModalComponent} from '../../modal/text-editor/text-editor-modal.component';
import {defaultTextEditorBubbleOptions} from '../../modal/text-editor/text-editor.utils';
import {preventEvent} from '../../utils/common.utils';
import {clickedInsideElement} from '../../utils/html-modifier';
import {CommonDataInputConfiguration} from '../data-input-configuration';
import {DataInputModalService} from '../data-input-modal.service';
import {DataInputSaveAction, keyboardEventInputSaveAction} from '../data-input-save-action';
import {constraintTypeClass} from '../pipes/constraint-class.pipe';
import {RichTextDropdownComponent} from './dropdown/rich-text-dropdown.component';

const modalKey = 'rich-text';

@Component({
  selector: 'rich-text-data-input',
  templateUrl: './rich-text-data-input.component.html',
  styleUrls: ['./rich-text-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [animateOpacityEnterLeave],
})
export class RichTextDataInputComponent implements OnChanges, OnDestroy {
  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public commonConfiguration: CommonDataInputConfiguration;

  @Input()
  public value: TextDataValue;

  @Input()
  public placeholder: string;

  @Input()
  public editableInReadonly: boolean;

  @Input()
  public fontColor: string;

  @Input()
  public workspace: Workspace;

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

  @HostBinding('class.multiline')
  public multilineMode: boolean;

  @ViewChild(QuillEditorComponent)
  public textEditor: QuillEditorComponent;

  @ViewChild(RichTextDropdownComponent)
  public dropdown: RichTextDropdownComponent;

  public readonly inputClass = constraintTypeClass(ConstraintType.Text);

  public text = '';
  public valid = true;

  private modalRef: BsModalRef;
  private modalSubscription = new Subscription();
  private preventSave: boolean;
  private keyDownListener: (event: KeyboardEvent) => void;
  private mouseDownListener: (event: MouseEvent) => void;
  private pasteValueAfterEditorCreation: boolean;

  public mouseEntered$ = new BehaviorSubject(false);
  public modalData$: Observable<ModalData>;

  public readonly modules = defaultTextEditorBubbleOptions;

  constructor(
    public element: ElementRef,
    private modalService: DataInputModalService,
    private renderer: Renderer2,
    private store$: Store<AppState>,
    private deviceDetector: DeviceDetectorService
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    let valueSet = false;
    if (changes.readonly) {
      if (!this.readonly && this.focus) {
        this.addKeyDownListener();
        this.initValue();
        valueSet = true;
      } else {
        this.removeListeners();
      }
    }
    if (!valueSet && changes.value && this.value) {
      this.initValue();
    }
    if (changes.workspace) {
      this.modalData$ = this.store$.pipe(
        select(selectViewSettingsById(viewSettingsIdByWorkspace(this.workspace))),
        map(settings => settings?.modals?.settings?.find(s => s.key === modalKey)?.data)
      );
    }
    this.refreshBackgroundClass(this.value);
  }

  private addKeyDownListener() {
    this.removeListeners();

    this.keyDownListener = event => this.onKeyDown(event);
    this.element.nativeElement.addEventListener('keydown', this.keyDownListener);

    this.mouseDownListener = event => this.onMouseDown(event);
    document.addEventListener('mouseup', this.mouseDownListener);
  }

  private removeListeners() {
    if (this.keyDownListener) {
      this.element.nativeElement.removeEventListener('keydown', this.keyDownListener);
    }
    this.keyDownListener = null;
    if (this.mouseDownListener) {
      document.removeEventListener('mouseup', this.mouseDownListener);
    }
    this.mouseDownListener = null;
  }

  private initValue() {
    this.text = this.value.format();
    if (isNotNullOrUndefined(this.value.inputValue)) {
      this.pasteValueAfterEditorCreation = true;
    }
    this.valid = this.value.isValid();
    this.multilineMode = numberOfPTags(this.text) > 1;
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
    this.preventSaveAndBlur();

    if (this.deviceDetector.isMobile()) {
      this.openModal();
    } else {
      this.dropdown?.open();
    }
  }

  private openModal() {
    const content = this.text;
    this.modalRef = this.modalService.show(TextEditorModalComponent, {
      keyboard: true,
      backdrop: 'static',
      class: 'modal-xxl modal-h-100',
      initialState: {
        readonly: this.readonly && !this.editableInReadonly,
        content,
        minLength: this.value?.config?.minLength,
        maxLength: this.value?.config?.maxLength,
      },
    });

    this.modalSubscription.add(this.modalRef.content.onSave$.subscribe(value => this.onSave(value)));
    this.modalSubscription.add(this.modalRef.content.onCancel$.subscribe(() => this.onCancel()));
  }

  public onSave(value: string) {
    this.saveValue(value, DataInputSaveAction.Button);
  }

  public onCancel() {
    this.cancel.emit();
  }

  public ngOnDestroy() {
    this.modalSubscription.unsubscribe();
  }

  public contentChanged(event: ContentChange) {
    this.text = event.html || '';
    const newValue = this.value.parseInput(this.text);
    this.valueChange.emit(newValue);
    this.refreshBackgroundClass(newValue);
  }

  public onEditorCreated(editor: any) {
    this.checkPasteValue();
    // we need to handle blur this way because method from quill api is not triggered on button or href click
    // editor.root.addEventListener('blur', () => this.onBlur();
    editor.setSelection(Number.MAX_SAFE_INTEGER, 1);

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

  public onMouseDown(event: MouseEvent) {
    if (!clickedInsideElement(event, 'rich-text-data-input') && !this.readonly) {
      this.saveValue(this.text, DataInputSaveAction.Blur);
      this.cancel.emit();
    }
  }

  private checkPasteValue() {
    if (this.pasteValueAfterEditorCreation) {
      const text = this.value.format();
      const textToPaste = unescapeHtml(text);
      const editor = this.textEditor?.quillEditor;
      const value = editor?.clipboard.convert(textToPaste);
      editor?.setContents(value);
      setTimeout(() => editor?.setSelection(Number.MAX_SAFE_INTEGER, 1));
    }

    this.pasteValueAfterEditorCreation = false;
  }

  private preventEnterInEditor(editor: any) {
    delete editor.keyboard.bindings[13];
    editor.keyboard.addBinding({key: 'enter'}, () => {
      return false;
    });
  }

  private onKeyDown(event: KeyboardEvent) {
    switch (keyboardEventCode(event)) {
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

  public onBlur() {
    this.removeListeners();
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

  @HostListener('mouseenter')
  public onMouseEnter() {
    this.mouseEntered$.next(true);
  }

  @HostListener('mouseleave')
  public onMouseLeave() {
    this.mouseEntered$.next(false);
  }

  public onModalDataChange(data: ModalData) {
    const modal: ModalSettings = {
      key: modalKey,
      data,
    };
    const settingsId = viewSettingsIdByWorkspace(this.workspace);
    this.store$.dispatch(new ViewSettingsAction.SetModal({settingsId, modal}));
  }
}

function numberOfPTags(value: string): number {
  const match = value.match(/<p.*?>.+?<\/p>/g);
  return match ? match.length : 0;
}
