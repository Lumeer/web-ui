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
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import {environment} from '../../../../../../../../environments/environment';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../../../../core/store/app.state';
import {ActivatedRoute} from '@angular/router';
import {DialogService} from '../../../../../../../dialog/dialog.service';
import {DOCUMENT} from '@angular/common';
import {LinkType} from '../../../../../../../core/store/link-types/link.type';
import {Collection} from '../../../../../../../core/store/collections/collection';
import {Variable} from '../../../variable-type';
import {shadeColor} from '../../../../../../../shared/utils/html-modifier';

declare var Blockly: any;

@Component({
  selector: 'blockly-editor',
  templateUrl: './blockly-editor.component.html',
  styleUrls: ['./blockly-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocklyEditorComponent implements AfterViewInit, OnDestroy {
  @Input('collections')
  public collections: Collection[];

  @Input('linkTypes')
  public linkTypes: LinkType[];

  @Input('variables')
  public variables: Variable[];

  @ViewChild('loading')
  private loadingElement: ElementRef;

  public blocklyId = String(Math.floor(Math.random() * 1000000000000000) + 1);

  private workspace: any;
  private lumeerVar: string;

  public static THESE = new Map();

  private static readonly DOCUMENT_TYPE_SUFFIX = '_document';
  private static readonly DOCUMENT_ARRAY_TYPE_SUFFIX = '_document_array';
  private static readonly LINK_TYPE_SUFFIX = '_link';
  private static readonly ARRAY_TYPE_SUFFIX = '_array';
  private static readonly FOREACH_DOCUMENT_ARRAY = 'foreach_document_array';
  private static readonly GET_ATTRIBUTE = 'get_attribute';
  private static readonly SET_ATTRIBUTE = 'set_attribute';
  private static readonly VARIABLES_GET_PREFIX = 'variables_get_';
  private static readonly UNKNOWN = 'unknown';
  private static readonly STATEMENT_CONTAINER = 'statement_container';

  private static readonly $red = '#e74c3c';
  private static readonly $green = '#00b388';
  private static readonly $gray200 = '#ecf0f1';

  constructor(
    private store$: Store<AppState>,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private renderer2: Renderer2,
    @Inject(DOCUMENT) private document
  ) {}

  public ngAfterViewInit(): void {
    const script = this.renderer2.createElement('script');
    script.type = 'text/javascript';
    script.src = environment.blocklyCdn;
    script.onload = () => {
      this.blocklyOnLoad();
    };
    this.renderer2.appendChild(this.document.body, script);
  }

  public blocklyOnLoad(): void {
    if (!(window as any).Blockly) {
      setTimeout(() => this.blocklyOnLoad(), 500);
    } else {
      this.workspace = (window as any).Blockly.init(this.blocklyId);
      this.loadingElement.nativeElement.remove();
      this.initBlockly();
    }
  }

  public initBlockly() {
    const coreVarTypes = this.variables.map(
      variable => variable.collectionId + BlocklyEditorComponent.DOCUMENT_TYPE_SUFFIX
    );
    const collectionTypes = this.collections.map(c => c.id + BlocklyEditorComponent.DOCUMENT_TYPE_SUFFIX);
    const collection = this.getCollection(this.variables[0].collectionId);
    const color = this.shadeColor(collection.color, 0.7);

    //Blockly.HSV_VALUE = 0.85;

    //this.workspace = Blockly.inject('blockly', {toolbox: toolbox.BLOCKLY_TOOLBOX});

    Blockly.Blocks[BlocklyEditorComponent.STATEMENT_CONTAINER] = {
      init: function() {
        this.jsonInit({
          type: BlocklyEditorComponent.STATEMENT_CONTAINER,
          message0: 'On document update in %1 %2 %3 do %4',
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
          colour: color,
        });
      },
    };
    const this_ = this;
    Blockly.JavaScript[BlocklyEditorComponent.STATEMENT_CONTAINER] = function(block) {
      const lumeerVar = Blockly.JavaScript.variableDB_.getDistinctName('lumeer', Blockly.Variables.NAME_TYPE);
      this_.lumeerVar = lumeerVar;
      const code = 'var ' + lumeerVar + " = Polyglot.import('lumeer');\n";
      return code + Blockly.JavaScript.statementToCode(block, 'COMMANDS') + '\n';
    };

    Blockly.Blocks[BlocklyEditorComponent.FOREACH_DOCUMENT_ARRAY] = {
      init: function() {
        this.jsonInit({
          type: BlocklyEditorComponent.FOREACH_DOCUMENT_ARRAY,
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
          colour: BlocklyEditorComponent.$red,
        });
      },
    };
    Blockly.JavaScript[BlocklyEditorComponent.FOREACH_DOCUMENT_ARRAY] = Blockly.JavaScript['controls_forEach'];

    Blockly.Blocks[BlocklyEditorComponent.GET_ATTRIBUTE] = {
      init: function() {
        this.jsonInit({
          type: BlocklyEditorComponent.GET_ATTRIBUTE,
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
          colour: BlocklyEditorComponent.$green,
          tooltip: '',
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[BlocklyEditorComponent.GET_ATTRIBUTE] = function(block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'DOCUMENT', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const attrId = block.getFieldValue('ATTR');

      if (!argument0) {
        return '';
      }

      const code = this_.lumeerVar + '.getDocumentAttribute(' + argument0 + ", '" + attrId + "')";

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    Blockly.Blocks[BlocklyEditorComponent.SET_ATTRIBUTE] = {
      init: function() {
        this.jsonInit({
          type: BlocklyEditorComponent.SET_ATTRIBUTE,
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
          colour: BlocklyEditorComponent.$green,
        });
      },
    };
    Blockly.JavaScript[BlocklyEditorComponent.SET_ATTRIBUTE] = function(block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'DOCUMENT', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const argument1 = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const attrId = block.getFieldValue('ATTR');

      if (!argument0 || !argument1) {
        return '';
      }

      const code = this_.lumeerVar + '.setDocumentAttribute(' + argument0 + ", '" + attrId + "', " + argument1 + ')';

      return code;
    };

    BlocklyEditorComponent.THESE.set(this.workspace.id, this); // TODO: is there a better way?

    this.workspace.addChangeListener(changeEvent => this.onWorkspaceChange(changeEvent));

    this.workspace.registerToolboxCategoryCallback('DOCUMENT_VARIABLES', this.registerDocumentVariables);
    this.workspace.registerToolboxCategoryCallback('LINKS', this.registerLinks);

    this.variables.forEach(variable =>
      this.workspace.createVariable(
        variable.name,
        variable.collectionId + BlocklyEditorComponent.DOCUMENT_TYPE_SUFFIX,
        null
      )
    );

    const containerBlock = this.workspace.newBlock(BlocklyEditorComponent.STATEMENT_CONTAINER);
    containerBlock.setDeletable(false);
    containerBlock.initSvg();
    containerBlock.render();
  }

  public ngOnDestroy(): void {
    BlocklyEditorComponent.THESE.delete(this.workspace.id);
  }

  private onWorkspaceChange(changeEvent): void {
    const this_ = BlocklyEditorComponent.THESE.get(changeEvent.workspaceId);
    const workspace = this_.workspace;

    if (changeEvent instanceof Blockly.Events.Create) {
      const block = workspace.getBlockById(changeEvent.blockId);

      // make sure the default blocks do not offer documents etc in variable dropdowns
      this_.ensureEmptyTypes(block);

      // prevent deletion of the initial variables
      if (block.type.startsWith(BlocklyEditorComponent.VARIABLES_GET_PREFIX)) {
        if (this_.variables.map(v => v.name).indexOf(block.getField('VAR').getVariable().name) >= 0) {
          block.setEditable(false);
        }
      }

      if (block.type === BlocklyEditorComponent.GET_ATTRIBUTE) {
        block.outputConnection.check_ = [BlocklyEditorComponent.UNKNOWN];
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
      if (blockOutputType.endsWith(BlocklyEditorComponent.DOCUMENT_TYPE_SUFFIX)) {
        // ...a link?
        if (parentBlock.type.endsWith(BlocklyEditorComponent.LINK_TYPE_SUFFIX)) {
          // set the output type to the opposite of what is connected on the input (links are symmetric)
          const linkParts = parentBlock.type.split('_');
          const counterpart =
            linkParts[0] === blockOutputType.replace(BlocklyEditorComponent.DOCUMENT_TYPE_SUFFIX, '')
              ? linkParts[1]
              : linkParts[0];
          parentBlock.setOutput(true, counterpart + BlocklyEditorComponent.DOCUMENT_ARRAY_TYPE_SUFFIX);
        }
      }

      // disconnect invalid foreach input
      if (parentBlock.type === BlocklyEditorComponent.FOREACH_DOCUMENT_ARRAY) {
        if (parentBlock.getInput('LIST').connection.targetConnection.sourceBlock_.id === block.id) {
          if (!blockOutputType.endsWith(BlocklyEditorComponent.DOCUMENT_ARRAY_TYPE_SUFFIX)) {
            parentBlock.getInput('LIST').connection.disconnect();
          } else {
            const newType = blockOutputType.replace(BlocklyEditorComponent.ARRAY_TYPE_SUFFIX, '');
            this_.updateVariableType(workspace, parentBlock.getField('VAR').getVariable(), newType);
            parentBlock.getField('VAR').setTypes_([newType], newType);
          }
        }
      }

      // populate document attribute names in document attr getter and setter
      if (
        (blockOutputType.endsWith(BlocklyEditorComponent.DOCUMENT_TYPE_SUFFIX) ||
          blockOutputType.endsWith(BlocklyEditorComponent.DOCUMENT_ARRAY_TYPE_SUFFIX)) &&
        (parentBlock.type === BlocklyEditorComponent.GET_ATTRIBUTE ||
          parentBlock.type === BlocklyEditorComponent.SET_ATTRIBUTE)
      ) {
        const options = parentBlock.getField('ATTR').getOptions();
        const originalLength = options.length;
        const collection = this_.getCollection(blockOutputType.split('_')[0]);

        let defaultValue = '';
        collection.attributes.forEach(attribute => {
          options.push([attribute.name, attribute.id]);

          if (attribute.id === collection.defaultAttributeId) {
            defaultValue = attribute.id;
          }
        });

        if (!defaultValue) {
          defaultValue = collection.attributes[0].id;
        }

        parentBlock.getField('ATTR').setValue(defaultValue);
        options.splice(0, originalLength);

        if (parentBlock.type === BlocklyEditorComponent.GET_ATTRIBUTE) {
          const newType = block.type.endsWith('_link') ? ['Array'] : [''];
          if (parentBlock.outputConnection.check_[0] !== newType[0]) {
            this_.tryDisconnect(parentBlock, parentBlock.outputConnection);
          }
          parentBlock.outputConnection.check_ = newType;
        }
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
        if (blockOutputType.endsWith(BlocklyEditorComponent.DOCUMENT_TYPE_SUFFIX)) {
          if (parentBlock.type.endsWith(BlocklyEditorComponent.LINK_TYPE_SUFFIX) && parentBlock.outputConnection) {
            parentBlock.setOutput(true, BlocklyEditorComponent.UNKNOWN);
            this_.tryDisconnect(parentBlock, parentBlock.outputConnection);
          }
        }

        // document or link being removed from attr getter
        if (
          blockOutputType.endsWith(BlocklyEditorComponent.DOCUMENT_TYPE_SUFFIX) ||
          blockOutputType.endsWith(BlocklyEditorComponent.LINK_TYPE_SUFFIX)
        ) {
          if (parentBlock.type === BlocklyEditorComponent.GET_ATTRIBUTE && parentBlock.outputConnection) {
            parentBlock.setOutput(true, BlocklyEditorComponent.UNKNOWN);
            this_.tryDisconnect(parentBlock, parentBlock.outputConnection);
          }
        }

        // reset list of attributes upon disconnection
        if (parentBlock.type === BlocklyEditorComponent.GET_ATTRIBUTE) {
          const options = parentBlock.getField('ATTR').getOptions();
          const originalLength = options.length;
          parentBlock.getField('ATTR').setValue('?');
          options.push(['?', '?']);
          options.splice(0, originalLength);
        }

        if (
          parentBlock.type === BlocklyEditorComponent.SET_ATTRIBUTE &&
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
    this_.code = Blockly.JavaScript.workspaceToCode(workspace);
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
    const this_ = BlocklyEditorComponent.THESE.get(workspace.id);

    workspace.getAllVariables().forEach(variable => {
      if (variable.type.endsWith(BlocklyEditorComponent.DOCUMENT_TYPE_SUFFIX)) {
        this_.ensureVariableTypeBlock(this_, variable.type);
        const blockText =
          '<xml>' +
          '<block type="' +
          BlocklyEditorComponent.VARIABLES_GET_PREFIX +
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
    xmlList.push(
      Blockly.Xml.textToDom('<xml><block type="' + BlocklyEditorComponent.GET_ATTRIBUTE + '"></block></xml>').firstChild
    );
    xmlList.push(
      Blockly.Xml.textToDom('<xml><block type="' + BlocklyEditorComponent.SET_ATTRIBUTE + '"></block></xml>').firstChild
    );

    return xmlList;
  }

  private getCollection(id: string): Collection {
    return this.collections.find(collection => collection.id === id);
  }

  private ensureVariableTypeBlock(this_: BlocklyEditorComponent, type: string): void {
    if (!Blockly.Blocks[type]) {
      const collection = this_.getCollection(type.replace(BlocklyEditorComponent.DOCUMENT_TYPE_SUFFIX, ''));

      Blockly.Blocks[BlocklyEditorComponent.VARIABLES_GET_PREFIX + type] = {
        init: function() {
          this.jsonInit({
            type: BlocklyEditorComponent.VARIABLES_GET_PREFIX + type,
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
      Blockly.JavaScript[BlocklyEditorComponent.VARIABLES_GET_PREFIX + type] = Blockly.JavaScript['variables_get'];
    }
  }

  private getBlocklyLinkType(linkType: LinkType): string {
    return linkType.collectionIds[0] + '_' + linkType.collectionIds[1] + BlocklyEditorComponent.LINK_TYPE_SUFFIX;
  }

  private registerLinks(workspace): any[] {
    const xmlList = [];
    const this_: BlocklyEditorComponent = BlocklyEditorComponent.THESE.get(workspace.id);

    this_.linkTypes.forEach(linkType => {
      this_.ensureLinkTypeBlock(this_, linkType);

      const blockText = '<xml>' + '<block type="' + this_.getBlocklyLinkType(linkType) + '">' + '</block>' + '</xml>';
      const block = Blockly.Xml.textToDom(blockText).firstChild;
      xmlList.push(block);
    });

    return xmlList;
  }

  private ensureLinkTypeBlock(this_: BlocklyEditorComponent, linkType: LinkType) {
    const type = this_.getBlocklyLinkType(linkType);
    const linkTypeId = linkType.id;

    if (!Blockly.Blocks[type]) {
      const c1 = this_.getCollection(linkType.collectionIds[0]);
      const c2 = this_.getCollection(linkType.collectionIds[1]);

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
                  linkType.collectionIds[0] + BlocklyEditorComponent.DOCUMENT_TYPE_SUFFIX,
                  linkType.collectionIds[1] + BlocklyEditorComponent.DOCUMENT_TYPE_SUFFIX,
                ],
              },
            ],
            output: BlocklyEditorComponent.UNKNOWN,
            colour: BlocklyEditorComponent.$gray200,
            tooltip: '',
            helpUrl: '',
          });
        },
      };
      const lumeerVar = this_.lumeerVar;
      Blockly.JavaScript[type] = function(block) {
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

  public generateXml(): void {
    const xml = Blockly.Xml.workspaceToDom(this.workspace);
    const xml_text = Blockly.Xml.domToPrettyText(xml);

    console.log(xml_text);
  }
}
