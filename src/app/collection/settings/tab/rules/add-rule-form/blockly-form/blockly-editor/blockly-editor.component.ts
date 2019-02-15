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

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../../../../core/store/app.state';
import {ActivatedRoute} from '@angular/router';
import {DialogService} from '../../../../../../../dialog/dialog.service';
import {DOCUMENT} from '@angular/common';
import {LinkType} from '../../../../../../../core/store/link-types/link.type';
import {Collection} from '../../../../../../../core/store/collections/collection';
import {RuleVariable} from '../../../rule-variable-type';
import {shadeColor} from '../../../../../../../shared/utils/html-modifier';
import {COLOR_DARK, COLOR_GRAY200, COLOR_GREEN, COLOR_PRIMARY, COLOR_RED} from '../../../../../../../core/constants';
import {ContrastColorPipe} from '../../../../../../../shared/pipes/contrast-color.pipe';
import {BlocklyService} from '../../../../../../../core/service/blockly.service';
import {BLOCKLY_TOOLBOX} from './blockly-editor-toolbox';

declare var Blockly: any;

const DOCUMENT_TYPE_SUFFIX = '_document';
const DOCUMENT_ARRAY_TYPE_SUFFIX = '_document_array';
const LINK_TYPE_SUFFIX = '_link';
const ARRAY_TYPE_SUFFIX = '_array';
const FOREACH_DOCUMENT_ARRAY = 'foreach_document_array';
const GET_ATTRIBUTE = 'get_attribute';
const SET_ATTRIBUTE = 'set_attribute';
const VARIABLES_GET_PREFIX = 'variables_get_';
const UNKNOWN = 'unknown';
const STATEMENT_CONTAINER = 'statement_container';

@Component({
  selector: 'blockly-editor',
  templateUrl: './blockly-editor.component.html',
  styleUrls: ['./blockly-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocklyEditorComponent implements AfterViewInit {
  @Input()
  public collections: Collection[] = [];

  @Input()
  public linkTypes: LinkType[] = [];

  @Input()
  public variables: RuleVariable[] = [];

  @Input()
  public xml: string = '';

  @ViewChild('loading')
  private loadingElement: ElementRef;

  @Output()
  public onJsUpdate = new EventEmitter<string>();

  @Output()
  public onXmlUpdate = new EventEmitter<string>();

  public blocklyId = String(Math.floor(Math.random() * 1000000000000000) + 1);

  private workspace: any;
  private lumeerVar: string;

  constructor(
    private store$: Store<AppState>,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private contrastColorPipe: ContrastColorPipe,
    private blocklyService: BlocklyService,
    private renderer2: Renderer2,
    @Inject(DOCUMENT) private document
  ) {}

  public ngAfterViewInit(): void {
    this.blocklyService.loadBlockly(this.renderer2, this.document, this.blocklyOnLoad.bind(this));
  }

  public blocklyOnLoad(): void {
    if (!(window as any).Blockly) {
      setTimeout(() => this.blocklyOnLoad(), 500);
    } else {
      this.workspace = (window as any).Blockly.init(this.blocklyId, BLOCKLY_TOOLBOX);
      this.loadingElement.nativeElement.remove();
      this.initBlockly();
    }
  }

  public initBlockly() {
    this.registerCustomBlocks();

    this.workspace.addChangeListener(this.onWorkspaceChange.bind(this));

    this.workspace.registerToolboxCategoryCallback('DOCUMENT_VARIABLES', this.registerDocumentVariables);
    this.workspace.registerToolboxCategoryCallback('LINKS', this.registerLinks);

    if (this.xml) {
      // initiate from previously stored XML
      const dom: Element = Blockly.Xml.textToDom(this.xml);
      const vars = dom.getElementsByTagName('variable');
      for (let i = 0; i < vars.length; i++) {
        const varType = vars.item(i).attributes.getNamedItem('type').value;
        if (varType.endsWith(DOCUMENT_TYPE_SUFFIX)) {
          this.ensureVariableTypeBlock(varType);
        }
      }
      for (let i = 0; i < this.linkTypes.length; i++) {
        this.ensureLinkTypeBlock(this.linkTypes[i]);
      }
      Blockly.Xml.domToWorkspace(dom, this.workspace);
      this.ensureTypeChecks();
    } else {
      // initiate empty state
      const containerBlock = this.workspace.newBlock(STATEMENT_CONTAINER);
      containerBlock.setDeletable(false);
      containerBlock.initSvg();
      containerBlock.render();
    }

    // make sure we have all variables created (no matter how the workspace was initiated - either from XML or empty)
    this.variables.forEach(variable => {
      if (this.workspace.getVariable(variable.name) == null) {
        this.workspace.createVariable(variable.name, variable.collectionId + DOCUMENT_TYPE_SUFFIX, null);
      }
    });
  }

  private registerCustomBlocks(): void {
    const coreVarTypes = this.variables.map(variable => variable.collectionId + DOCUMENT_TYPE_SUFFIX);
    const collectionTypes = this.collections.map(c => c.id + DOCUMENT_TYPE_SUFFIX);
    const collection = this.getCollection(this.variables[0].collectionId);

    Blockly.Blocks[STATEMENT_CONTAINER] = {
      init: function() {
        this.jsonInit({
          type: STATEMENT_CONTAINER,
          message0: 'On document event in %1 %2 %3 do %4',
          args0: [
            {
              type: 'field_fa',
              icon: collection.icon,
              iconColor: collection.color,
            },
            {
              type: 'field_label',
              text: collection.name,
            },
            {
              type: 'input_dummy',
            },
            {
              type: 'input_statement',
              name: 'COMMANDS',
            },
          ],
          colour: COLOR_DARK,
        });
      },
    };
    const this_ = this;
    Blockly.JavaScript[STATEMENT_CONTAINER] = function(block) {
      const lumeerVar = Blockly.JavaScript.variableDB_.getDistinctName('lumeer', Blockly.Variables.NAME_TYPE);
      this_.lumeerVar = lumeerVar;
      const code = 'var ' + lumeerVar + " = Polyglot.import('lumeer');\n";
      return code + Blockly.JavaScript.statementToCode(block, 'COMMANDS') + '\n';
    };

    Blockly.Blocks[FOREACH_DOCUMENT_ARRAY] = {
      init: function() {
        this.jsonInit({
          type: FOREACH_DOCUMENT_ARRAY,
          message0: 'for each document %1 in %2',
          args0: [
            {
              type: 'field_variable',
              name: 'VAR',
              variable: null,
            },
            {
              type: 'input_value',
              name: 'LIST',
              check: null,
            },
          ],
          message1: 'do this %1',
          args1: [
            {
              type: 'input_statement',
              name: 'DO',
            },
          ],
          previousStatement: null,
          nextStatement: null,
          colour: COLOR_RED,
        });
      },
    };
    Blockly.JavaScript[FOREACH_DOCUMENT_ARRAY] = Blockly.JavaScript['controls_forEach'];

    Blockly.Blocks[GET_ATTRIBUTE] = {
      init: function() {
        this.jsonInit({
          type: GET_ATTRIBUTE,
          message0: 'get %1 of %2',
          args0: [
            {
              type: 'field_dropdown',
              name: 'ATTR',
              options: [['?', '?']],
            },
            {
              type: 'input_value',
              name: 'DOCUMENT',
            },
          ],
          output: '',
          colour: COLOR_GREEN,
          tooltip: '',
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[GET_ATTRIBUTE] = function(block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'DOCUMENT', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const attrId = block.getFieldValue('ATTR');

      if (!argument0) {
        return '';
      }

      const code = this_.lumeerVar + '.getDocumentAttribute(' + argument0 + ", '" + attrId + "')";

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    Blockly.Blocks[SET_ATTRIBUTE] = {
      init: function() {
        this.jsonInit({
          type: SET_ATTRIBUTE,
          message0: 'set %1 of %2 to %3',
          args0: [
            {
              type: 'field_dropdown',
              name: 'ATTR',
              options: [['?', '?']],
            },
            {
              type: 'input_value',
              name: 'DOCUMENT',
              check: [...coreVarTypes, ...collectionTypes],
            },
            {
              type: 'input_value',
              name: 'VALUE',
              check: ['', 'Number', 'String', 'Boolean'], // only regular variables
            },
          ],
          previousStatement: null,
          nextStatement: null,
          colour: COLOR_GREEN,
        });
      },
    };
    Blockly.JavaScript[SET_ATTRIBUTE] = function(block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'DOCUMENT', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const argument1 = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const attrId = block.getFieldValue('ATTR');

      if (!argument0 || !argument1) {
        return '';
      }

      const code = this_.lumeerVar + '.setDocumentAttribute(' + argument0 + ", '" + attrId + "', " + argument1 + ')';

      return code;
    };
  }

  private ensureTypeChecks(): void {
    // first fix variables and links
    this.workspace.getAllBlocks(false).forEach(block => {
      this.preventDeletionOfInitialVariables(block);

      // set output type of all links
      if (block.type.endsWith(LINK_TYPE_SUFFIX)) {
        const children = block.getChildren(false);
        if (children && children.length > 0) {
          const child = children[0];
          const childType = child.type;
          const linkParts = block.type.split('_');
          const counterpart =
            linkParts[0] === childType.replace(DOCUMENT_TYPE_SUFFIX, '') ? linkParts[1] : linkParts[0];
          block.setOutput(true, counterpart + DOCUMENT_ARRAY_TYPE_SUFFIX);
        }
      }
    });

    // second fix getters and setters
    this.workspace.getAllBlocks(false).forEach(block => {
      const children = block.getChildren(false);

      // document getters and setters
      if (block.type === GET_ATTRIBUTE || block.type === SET_ATTRIBUTE) {
        if (children && children.length > 0) {
          const child = children[0];
          const childOutputType =
            child.outputConnection && child.outputConnection.check_ && child.outputConnection.check_[0]
              ? child.outputConnection.check_[0]
              : '';

          if (childOutputType.endsWith(DOCUMENT_TYPE_SUFFIX) || childOutputType.endsWith(DOCUMENT_ARRAY_TYPE_SUFFIX)) {
            const value = block.getField('ATTR').getValue();
            this.setterAndGetterOutputType(block, child, true);
            block.getField('ATTR').setValue(value);
          }
        }
      }

      // foreach cycle
      if (block.type === FOREACH_DOCUMENT_ARRAY) {
        if (children && children.length > 0) {
          const child = children[0];
          const childOutputType =
            child.outputConnection && child.outputConnection.check_ && child.outputConnection.check_[0]
              ? child.outputConnection.check_[0]
              : '';

          if (childOutputType.endsWith(DOCUMENT_ARRAY_TYPE_SUFFIX)) {
            const newType = childOutputType.replace(ARRAY_TYPE_SUFFIX, '');
            this.updateVariableType(this.workspace, block.getField('VAR').getVariable(), newType);
            block.getField('VAR').setTypes_([newType], newType);
          }
        }
      }
    });
  }

  private preventDeletionOfInitialVariables(block: any): void {
    if (block.type.startsWith(VARIABLES_GET_PREFIX)) {
      if (this.variables.map(v => v.name).indexOf(block.getField('VAR').getVariable().name) >= 0) {
        block.setEditable(false);
      }
    }
  }

  private setterAndGetterOutputType(parentBlock: any, block: any, skipDisconnect = false) {
    const options = parentBlock.getField('ATTR').getOptions();
    const originalLength = options.length;
    const blockOutputType =
      block.outputConnection && block.outputConnection.check_ && block.outputConnection.check_[0]
        ? block.outputConnection.check_[0]
        : '';
    const collection = this.getCollection(blockOutputType.split('_')[0]);

    let defaultValue = '',
      defaultText = '';
    collection.attributes.forEach(attribute => {
      options.push([attribute.name, attribute.id]);
      if (attribute.id === collection.defaultAttributeId) {
        defaultValue = attribute.id;
        defaultText = attribute.name;
      }
    });

    if (!defaultValue && collection.attributes) {
      defaultValue = collection.attributes[0].id;
      defaultText = collection.attributes[0].name;
    }

    parentBlock.getField('ATTR').setValue(defaultValue);

    // force attribute name render when the same value was already selected
    parentBlock.getField('ATTR').text_ = defaultText;
    parentBlock.getField('ATTR').forceRerender();
    options.splice(0, originalLength);

    if (parentBlock.type === GET_ATTRIBUTE) {
      const newType = block.type.endsWith('_link') ? ['Array'] : [''];
      const parentBlockOutputType =
        parentBlock.outputConnection && parentBlock.outputConnection.check_ && parentBlock.outputConnection.check_[0]
          ? parentBlock.outputConnection.check_[0]
          : '';
      if (!skipDisconnect && parentBlockOutputType !== newType[0]) {
        this.tryDisconnect(parentBlock, parentBlock.outputConnection);
      }
      parentBlock.outputConnection.check_ = newType;
    }
  }

  private onWorkspaceChange(changeEvent): void {
    const workspace = this.workspace;

    if (changeEvent instanceof Blockly.Events.Create) {
      const block = workspace.getBlockById(changeEvent.blockId);

      // make sure the default blocks do not offer documents etc in variable dropdowns
      this.ensureEmptyTypes(block);

      // prevent deletion of the initial variables
      this.preventDeletionOfInitialVariables(block);

      if (block.type === GET_ATTRIBUTE) {
        block.outputConnection.check_ = [UNKNOWN];
      }
    }

    if (changeEvent.newParentId) {
      // is there a new connection made?
      const block = workspace.getBlockById(changeEvent.blockId);
      const blockOutputType =
        block.outputConnection && block.outputConnection.check_ && block.outputConnection.check_[0]
          ? block.outputConnection.check_[0]
          : '';
      const parentBlock = workspace.getBlockById(changeEvent.newParentId);

      // is it a document being connected to ...
      if (blockOutputType.endsWith(DOCUMENT_TYPE_SUFFIX)) {
        // ...a link?
        if (parentBlock.type.endsWith(LINK_TYPE_SUFFIX)) {
          // set the output type to the opposite of what is connected on the input (links are symmetric)
          const linkParts = parentBlock.type.split('_');
          const counterpart =
            linkParts[0] === blockOutputType.replace(DOCUMENT_TYPE_SUFFIX, '') ? linkParts[1] : linkParts[0];
          parentBlock.setOutput(true, counterpart + DOCUMENT_ARRAY_TYPE_SUFFIX);
        }
      }

      // disconnect invalid foreach input
      if (parentBlock.type === FOREACH_DOCUMENT_ARRAY) {
        if (parentBlock.getInput('LIST').connection.targetConnection.sourceBlock_.id === block.id) {
          if (!blockOutputType.endsWith(DOCUMENT_ARRAY_TYPE_SUFFIX)) {
            parentBlock.getInput('LIST').connection.disconnect();
          } else {
            // otherwise set a correct type of the cycle variable
            const newType = blockOutputType.replace(ARRAY_TYPE_SUFFIX, '');
            this.updateVariableType(workspace, parentBlock.getField('VAR').getVariable(), newType);
            parentBlock.getField('VAR').setTypes_([newType], newType);
          }
        }
      }

      // populate document attribute names in document attr getter and setter
      if (
        (blockOutputType.endsWith(DOCUMENT_TYPE_SUFFIX) || blockOutputType.endsWith(DOCUMENT_ARRAY_TYPE_SUFFIX)) &&
        (parentBlock.type === GET_ATTRIBUTE || parentBlock.type === SET_ATTRIBUTE)
      ) {
        this.setterAndGetterOutputType(parentBlock, block);
      }
    } else if (changeEvent.oldParentId) {
      // reset output type and disconnect when linked document is removed
      const block = workspace.getBlockById(changeEvent.blockId);
      if (block) {
        // when replacing a shadow block, the original block might not exist anymore
        const blockOutputType =
          block.outputConnection && block.outputConnection.check_ && block.outputConnection.check_[0]
            ? block.outputConnection.check_[0]
            : '';
        const parentBlock = workspace.getBlockById(changeEvent.oldParentId);

        // document being removed from link
        if (blockOutputType.endsWith(DOCUMENT_TYPE_SUFFIX)) {
          if (parentBlock.type.endsWith(LINK_TYPE_SUFFIX) && parentBlock.outputConnection) {
            parentBlock.setOutput(true, UNKNOWN);
            this.tryDisconnect(parentBlock, parentBlock.outputConnection);
          }
        }

        // document or link being removed from attr getter
        if (blockOutputType.endsWith(DOCUMENT_TYPE_SUFFIX) || blockOutputType.endsWith(LINK_TYPE_SUFFIX)) {
          if (parentBlock.type === GET_ATTRIBUTE && parentBlock.outputConnection) {
            parentBlock.setOutput(true, UNKNOWN);
            this.tryDisconnect(parentBlock, parentBlock.outputConnection);
          }
        }

        // reset list of attributes upon disconnection
        if (parentBlock.type === GET_ATTRIBUTE) {
          const options = parentBlock.getField('ATTR').getOptions();
          const originalLength = options.length;
          parentBlock.getField('ATTR').setValue('?');
          options.push(['?', '?']);
          options.splice(0, originalLength);
        }

        // reset list of attributes upon disconnection
        if (
          parentBlock.type === SET_ATTRIBUTE &&
          parentBlock.getInput('DOCUMENT').connection.targetConnection === null
        ) {
          const options = parentBlock.getField('ATTR').getOptions();
          const originalLength = options.length;
          parentBlock.getField('ATTR').setValue('?');
          options.push(['?', '?']);
          options.splice(0, originalLength);
        }
      }
    }

    // render new state
    this.generateXml();
    this.generateJs();
  }

  private ensureEmptyTypes(block): void {
    for (let i = 0, input; (input = block.inputList[i]); i++) {
      for (let j = 0, field; (field = input.fieldRow[j]); j++) {
        if (field instanceof Blockly.FieldVariable && field.variableTypes === null) {
          field.setTypes_([''], '');
        }
      }
    }
  }

  private tryDisconnect(block, connection): void {
    try {
      connection.disconnect();
    } catch (e) {
      //nps
    }
    block.moveBy(Blockly.SNAP_RADIUS, Blockly.SNAP_RADIUS);
  }

  private updateVariableType(workspace, variable, newType): void {
    const variableMap = workspace.getVariableMap();
    const type = variable.type;

    if (type === newType) {
      return;
    }

    // Remove the variable from the original list of type
    const variableList = variableMap.getVariablesOfType(type);
    const variableIndex = variableList.indexOf(variable);
    variableMap.variableMap_[type].splice(variableIndex, 1);

    // And put it to the new one (either brand new, or existing one)
    variable.type = newType;
    if (!variableMap.variableMap_[newType]) {
      variableMap.variableMap_[newType] = [variable];
    } else {
      variableMap.variableMap_[newType].push(variable);
    }
  }

  private registerDocumentVariables(workspace): any[] {
    const xmlList = [];

    workspace.getAllVariables().forEach(variable => {
      if (variable.type.endsWith(DOCUMENT_TYPE_SUFFIX)) {
        this.ensureVariableTypeBlock(variable.type);
        const blockText =
          '<xml>' +
          '<block type="' +
          VARIABLES_GET_PREFIX +
          variable.type +
          '">' +
          '<field name="VAR" id="' +
          variable.getId() +
          '" variabletype="' +
          variable.type +
          '">' +
          variable.name +
          '</field>' +
          '</block>' +
          '</xml>';
        const block = Blockly.Xml.textToDom(blockText).firstChild;
        xmlList.push(block);
      }
    });

    xmlList.push(Blockly.Xml.textToDom('<xml><sep gap="48"></sep></xml>').firstChild);
    xmlList.push(Blockly.Xml.textToDom('<xml><block type="' + GET_ATTRIBUTE + '"></block></xml>').firstChild);
    xmlList.push(Blockly.Xml.textToDom('<xml><block type="' + SET_ATTRIBUTE + '"></block></xml>').firstChild);

    return xmlList;
  }

  private getCollection(id: string): Collection {
    return this.collections.find(collection => collection.id === id);
  }

  private ensureVariableTypeBlock(type: string): void {
    if (!Blockly.Blocks[VARIABLES_GET_PREFIX + type]) {
      const collection = this.getCollection(type.replace(DOCUMENT_TYPE_SUFFIX, ''));

      const this_ = this;
      Blockly.Blocks[VARIABLES_GET_PREFIX + type] = {
        init: function() {
          this.jsonInit({
            type: VARIABLES_GET_PREFIX + type,
            message0: '%1 %2 %3',
            args0: [
              {
                type: 'field_fa',
                icon: collection.icon,
                iconColor: collection.color,
              },
              {
                type: 'field_label',
                text: collection.name,
                class: this_.contrastColor(collection.color, 'text-primary', 'text-light'),
              },
              {
                type: 'field_variable',
                name: 'VAR',
                variable: '%{BKY_VARIABLES_DEFAULT_NAME}',
                variableTypes: [type],
                defaultType: type,
              },
            ],
            colour: this_.shadeColor(collection.color, 0.5), // TODO: how many percent should go here?
            output: type,
          });
        },
      };
      Blockly.JavaScript[VARIABLES_GET_PREFIX + type] = Blockly.JavaScript['variables_get'];
    }
  }

  private getBlocklyLinkType(linkType: LinkType): string {
    return linkType.collectionIds[0] + '_' + linkType.collectionIds[1] + LINK_TYPE_SUFFIX;
  }

  private registerLinks(workspace): any[] {
    const xmlList = [];

    this.linkTypes.forEach(linkType => {
      this.ensureLinkTypeBlock(linkType);

      const blockText = '<xml>' + '<block type="' + this.getBlocklyLinkType(linkType) + '">' + '</block>' + '</xml>';
      const block = Blockly.Xml.textToDom(blockText).firstChild;
      xmlList.push(block);
    });

    return xmlList;
  }

  private ensureLinkTypeBlock(linkType: LinkType) {
    const type = this.getBlocklyLinkType(linkType);
    const linkTypeId = linkType.id;

    if (!Blockly.Blocks[type]) {
      const c1 = this.getCollection(linkType.collectionIds[0]);
      const c2 = this.getCollection(linkType.collectionIds[1]);

      Blockly.Blocks[type] = {
        init: function() {
          this.jsonInit({
            type: type,
            message0: '%1%2 %3 %4',
            args0: [
              {
                type: 'field_fa',
                icon: c1.icon,
                iconColor: c1.color,
              },
              {
                type: 'field_fa',
                icon: c2.icon,
                iconColor: c2.color,
              },
              {
                type: 'field_label',
                text: linkType.name,
                class: 'text-primary',
              },
              {
                type: 'input_value',
                name: 'DOCUMENT',
                check: [
                  linkType.collectionIds[0] + DOCUMENT_TYPE_SUFFIX,
                  linkType.collectionIds[1] + DOCUMENT_TYPE_SUFFIX,
                ],
              },
            ],
            output: UNKNOWN,
            colour: COLOR_GRAY200,
            tooltip: '',
            helpUrl: '',
          });
        },
      };

      const this_ = this;
      Blockly.JavaScript[type] = function(block) {
        const lumeerVar = this_.lumeerVar
          ? this_.lumeerVar
          : Blockly.JavaScript.variableDB_.getDistinctName('lumeer', Blockly.Variables.NAME_TYPE);
        if (!this_.lumeerVar) {
          this_.lumeerVar = lumeerVar;
        }

        const argument0 =
          Blockly.JavaScript.valueToCode(block, 'DOCUMENT', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;

        if (!argument0) {
          return '';
        }

        const code = lumeerVar + '.getLinkedDocuments(' + argument0 + ", '" + linkTypeId + "')";

        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };
    }
  }

  // bridge for functions running outside of ng zone
  private shadeColor(color: string, percent: number): string {
    return shadeColor(color, percent);
  }

  // bridge for functions running outside of ng zone
  private contrastColor(color?: string, dark?: string, light?: string): string {
    return color ? this.contrastColorPipe.transform(color, {dark, light}) : dark ? dark : COLOR_PRIMARY;
  }

  private generateXml(): void {
    this.onXmlUpdate.emit(Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(this.workspace)));
  }

  private generateJs(): void {
    this.onJsUpdate.emit(Blockly.JavaScript.workspaceToCode(this.workspace));
  }
}
