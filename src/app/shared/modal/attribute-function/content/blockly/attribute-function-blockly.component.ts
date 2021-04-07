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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges} from '@angular/core';
import {AbstractControl, FormGroup} from '@angular/forms';
import {
  BLOCKLY_FUNCTION_TOOLBOX,
  BLOCKLY_VALUE_TOOLBOX,
} from '../../../../blockly/blockly-editor/blockly-editor-toolbox';
import {
  BLOCKLY_FUNCTION_BUTTONS,
  BLOCKLY_VALUE_BUTTONS,
  MasterBlockType,
} from '../../../../blockly/blockly-editor/blockly-utils';
import {Attribute, AttributeFunction, Collection} from '../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {BlocklyDebugDisplay} from '../../../../blockly/blockly-debugger/blockly-debugger.component';
import {RuleVariable} from '../../../../blockly/rule-variable-type';
import {attributeHasEditableFunction} from '../../../../utils/attribute.utils';
import {View} from '../../../../../core/store/views/view';

@Component({
  selector: 'attribute-function-blockly',
  templateUrl: './attribute-function-blockly.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeFunctionBlocklyComponent implements OnChanges {
  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public views: View[];

  @Input()
  public collection: Collection;

  @Input()
  public linkType: LinkType;

  @Input()
  public attribute: Attribute;

  @Input()
  public attributeFunction: AttributeFunction;

  @Input()
  public form: FormGroup;

  public variables: RuleVariable[];
  public masterType: MasterBlockType;
  public toolbox: string;
  public debugButtons: BlocklyDebugDisplay[];
  public isFunction: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collection || changes.linkType || changes.attribute) {
      this.checkVariables();
    }
  }

  private checkVariables() {
    this.isFunction = attributeHasEditableFunction(this.attribute);
    if (this.collection) {
      if (this.isFunction) {
        this.variables = [{name: 'thisRecord', collectionId: this.collection.id} as RuleVariable];
        this.masterType = MasterBlockType.Value;
      } else {
        this.variables = [
          {name: 'oldRecord', collectionId: this.collection.id},
          {name: 'newRecord', collectionId: this.collection.id},
        ];
      }
    } else if (this.linkType) {
      if (this.isFunction) {
        this.variables = [{name: 'thisLink', linkTypeId: this.linkType.id} as RuleVariable];
        this.masterType = MasterBlockType.Link;
      } else {
        this.variables = [
          {name: 'oldLink', linkTypeId: this.linkType.id},
          {name: 'newLink', linkTypeId: this.linkType.id},
        ];
      }
    } else {
      this.variables = [];
    }

    if (this.isFunction) {
      this.toolbox = BLOCKLY_VALUE_TOOLBOX;
      this.debugButtons = BLOCKLY_VALUE_BUTTONS;
    } else {
      this.masterType = MasterBlockType.Function;
      this.toolbox = BLOCKLY_FUNCTION_TOOLBOX;
      this.debugButtons = BLOCKLY_FUNCTION_BUTTONS;
    }
  }

  public get jsControl(): AbstractControl {
    return this.form.controls.js;
  }

  public get xmlControl(): AbstractControl {
    return this.form.controls.xml;
  }

  public get editableControl(): AbstractControl {
    return this.form.controls.editable;
  }

  public get dryRunControl(): AbstractControl {
    return this.form.controls.dryRun;
  }

  public get displayControl(): AbstractControl {
    return this.form.controls.display;
  }

  public onJsUpdate(js: string) {
    this.jsControl.patchValue(js);
  }

  public onXmlUpdate(xml: string) {
    this.xmlControl.patchValue(xml);
  }

  public onDisplay(type: BlocklyDebugDisplay) {
    if (type !== BlocklyDebugDisplay.DisplayNone && this.displayControl.value === type) {
      this.displayControl.patchValue(BlocklyDebugDisplay.DisplayNone);
    } else {
      this.displayControl.patchValue(type);
    }
  }
}
