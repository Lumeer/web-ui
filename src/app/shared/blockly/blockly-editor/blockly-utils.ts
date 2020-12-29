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

import {LinkType} from '../../../core/store/link-types/link.type';
import {COLOR_GRAY200, COLOR_GRAY300, COLOR_GRAY400, COLOR_PRIMARY} from '../../../core/constants';
import {Attribute, Collection} from '../../../core/store/collections/collection';
import {ContrastColorPipe} from '../../pipes/contrast-color.pipe';
import {isArray, isNotNullOrUndefined} from '../../utils/common.utils';
import {RuleVariable} from '../rule-variable-type';
import {shadeColor} from '../../utils/html-modifier';
import {BlocklyComponent} from './blocks/blockly-component';
import {BlocklyDebugDisplay} from '../blockly-debugger/blockly-debugger.component';

declare var Blockly: any;

export const enum MasterBlockType {
  Function = 'Function',
  Value = 'Value',
  Link = 'Link',
}

export const BLOCKLY_VALUE_BUTTONS = [BlocklyDebugDisplay.DisplayJs, BlocklyDebugDisplay.DisplayError];

export const BLOCKLY_FUNCTION_BUTTONS = [
  BlocklyDebugDisplay.DisplayJs,
  BlocklyDebugDisplay.DisplayError,
  BlocklyDebugDisplay.DisplayLog,
];

export class BlocklyUtils {
  public static readonly DOCUMENT_VAR_SUFFIX = '_document';
  public static readonly LINK_VAR_SUFFIX = '_linkinst';
  public static readonly LINK_TYPE_ARRAY_SUFFIX = '_link_array';
  public static readonly DOCUMENT_ARRAY_TYPE_SUFFIX = '_document_array';
  public static readonly LINK_TYPE_BLOCK_SUFFIX = '_link';
  public static readonly LINK_INSTANCE_BLOCK_SUFFIX = '_link_instance';
  public static readonly ARRAY_TYPE_SUFFIX = '_array';
  public static readonly FOREACH_DOCUMENT_ARRAY = 'foreach_document_array';
  public static readonly FOREACH_LINK_ARRAY = 'foreach_link_array';
  public static readonly GET_ATTRIBUTE = 'get_attribute';
  public static readonly SET_ATTRIBUTE = 'set_attribute';
  public static readonly GET_LINK_ATTRIBUTE = 'get_link_attribute';
  public static readonly SET_LINK_ATTRIBUTE = 'set_link_attribute';
  public static readonly GET_LINK_DOCUMENT = 'get_link_document';
  public static readonly VARIABLES_GET_PREFIX = 'variables_get_';
  public static readonly VARIABLES_SET = 'variables_set';
  public static readonly UNKNOWN = 'unknown';
  public static readonly STATEMENT_CONTAINER = 'statement_container';
  public static readonly VALUE_CONTAINER = 'value_container';
  public static readonly LINK_CONTAINER = 'link_container';
  public static readonly SEQUENCE_BLOCK = 'sequence_block';
  public static readonly SHOW_MESSAGE = 'show_message';
  public static readonly MS_TO_DATE = 'ms_to_date';
  public static readonly DATE_TO_MS = 'date_to_ms';
  public static readonly DATE_NOW = 'date_now';
  public static readonly DATE_NOW_MS = 'date_now_ms';
  public static readonly MS_TO_UNIT = 'ms_to_unit';
  public static readonly PARSE_DATE = 'parse_date';
  public static readonly FORMAT_DATE = 'format_date';
  public static readonly CURRENT_DATE = 'current_date';
  public static readonly CURRENT_USER = 'current_user';
  public static readonly CURRENT_LOCALE = 'current_locale';
  public static readonly CREATE_DOCUMENT = 'CREATE_DOCUMENT';
  public static readonly CREATE_DOCUMENTS_LIMIT = 25;
  public static readonly SHOW_MESSAGES_LIMIT = 5;

  private components: BlocklyComponent[] = [];

  private contrastColorPipe = new ContrastColorPipe();

  private lumeerVar: string;

  public constructor(
    private masterType: MasterBlockType,
    private collections: Collection[],
    private linkTypes: LinkType[],
    private variables: RuleVariable[]
  ) {}

  public setLumeerVariable(variable: string) {
    this.lumeerVar = variable;
  }

  public getLumeerVariable() {
    return this.lumeerVar;
  }

  public getCollections() {
    return this.collections;
  }

  public getLinkTypes() {
    return this.linkTypes;
  }

  public getVariables() {
    return this.variables;
  }

  public registerComponent(component: BlocklyComponent) {
    this.components.push(component);
  }

  public registerComponents(components: BlocklyComponent[]) {
    this.components.push(...components);
  }

  public getComponents() {
    return this.components;
  }

  public getLinkParts(linkBlockType: string): string[] {
    return linkBlockType.split('-', 2)[1].split('_');
  }

  public getLinkInstanceType(linkBlockType: string): string {
    return linkBlockType.split('-', 2)[0];
  }

  public ensureTypeChecks(workspace): void {
    // first fix variables and links
    workspace.getAllBlocks(false).forEach(block => {
      const children = block.getChildren(false);
      this.preventDeletionOfInitialVariables(block);

      // set output type of all links
      if (block.type.endsWith(BlocklyUtils.LINK_TYPE_BLOCK_SUFFIX)) {
        if (children && children.length > 0) {
          const child = children[0];
          const childType = child.type
            .replace(BlocklyUtils.DOCUMENT_VAR_SUFFIX, '')
            .replace(BlocklyUtils.VARIABLES_GET_PREFIX, '');
          const linkParts = this.getLinkParts(block.type);
          const counterpart = linkParts[0] === childType ? linkParts[1] : linkParts[0];
          block.setOutput(true, counterpart + BlocklyUtils.DOCUMENT_ARRAY_TYPE_SUFFIX);
        }
      }

      // get link instance document
      if (block.type === BlocklyUtils.GET_LINK_DOCUMENT) {
        if (children && children.length > 0) {
          const child = children[0];
          const childOutputType = this.getOutputConnectionCheck(child);

          if (childOutputType.endsWith(BlocklyUtils.LINK_VAR_SUFFIX)) {
            const value = block.getField('COLLECTION').getValue();
            this.setLinkDocumentOutputType(block, child);
            block.getField('COLLECTION').setValue(value);
          }
        }
      }
    });

    // second fix getters and setters
    workspace.getAllBlocks(false).forEach(block => {
      const children = block.getChildren(false);

      // document getters and setters
      if (block.type === BlocklyUtils.GET_ATTRIBUTE || block.type === BlocklyUtils.SET_ATTRIBUTE) {
        if (children && children.length > 0) {
          const child = children[0];
          const childOutputType = this.getOutputConnectionCheck(child);

          if (
            childOutputType.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX) ||
            childOutputType.endsWith(BlocklyUtils.DOCUMENT_ARRAY_TYPE_SUFFIX)
          ) {
            const value = block.getField('ATTR').getValue();
            this.setterAndGetterOutputType(block, child, true);
            block.getField('ATTR').setValue(value);
          }
        }
      }

      // link instance getters and setters
      if (block.type === BlocklyUtils.GET_LINK_ATTRIBUTE || block.type === BlocklyUtils.SET_LINK_ATTRIBUTE) {
        if (children && children.length > 0) {
          const child = children[0];
          const childOutputType = this.getOutputConnectionCheck(child);

          if (
            childOutputType.endsWith(BlocklyUtils.LINK_VAR_SUFFIX) ||
            childOutputType.endsWith(BlocklyUtils.LINK_TYPE_ARRAY_SUFFIX)
          ) {
            const value = block.getField('ATTR').getValue();
            this.setterAndGetterOutputType(block, child, true);
            block.getField('ATTR').setValue(value);
          }
        }
      }

      // foreach cycle
      if (block.type === BlocklyUtils.FOREACH_DOCUMENT_ARRAY) {
        if (children && children.length > 0) {
          const child = children[0];
          const childOutputType = this.getOutputConnectionCheck(child);

          if (childOutputType.endsWith(BlocklyUtils.DOCUMENT_ARRAY_TYPE_SUFFIX)) {
            const newType = childOutputType.replace(BlocklyUtils.ARRAY_TYPE_SUFFIX, '');
            this.updateVariableType(workspace, block.getField('VAR').getVariable(), newType);
            block.getField('VAR').setTypes_([newType], newType);
          }
        }
      }

      // link foreach cycle
      if (block.type === BlocklyUtils.FOREACH_LINK_ARRAY) {
        if (children && children.length > 0) {
          const child = children[0];
          const childOutputType = this.getOutputConnectionCheck(child);

          if (childOutputType.endsWith(BlocklyUtils.LINK_TYPE_ARRAY_SUFFIX)) {
            const newType = childOutputType.replace(BlocklyUtils.LINK_TYPE_ARRAY_SUFFIX, BlocklyUtils.LINK_VAR_SUFFIX);
            this.updateVariableType(workspace, block.getField('VAR').getVariable(), newType);
            block.getField('VAR').setTypes_([newType], newType);
          }
        }
      }
    });
  }

  public preventDeletionOfInitialVariables(block: any): void {
    if (block.type.startsWith(BlocklyUtils.VARIABLES_GET_PREFIX)) {
      if (this.variables.map(v => v.name).indexOf(block.getField('VAR').getVariable().name) >= 0) {
        block.setEditable(false);
      }
    }
  }

  public setLinkDocumentOutputType(parentBlock: any, block: any) {
    const options = parentBlock.getField('COLLECTION').getOptions();
    const originalLength = options.length;
    const blockOutputType = this.getOutputConnectionCheck(block);
    const linkTypeId = blockOutputType.split('_')[0];
    const linkType = this.getLinkType(linkTypeId);

    linkType.collectionIds.forEach(collectionId => {
      const collection = this.getCollection(collectionId);
      options.push([collection.name, collection.id]);
    });

    const firstCollection = this.getCollection(linkType.collectionIds[0]);
    const firstCollectionId = firstCollection.id;
    const firstCollectionName = firstCollection.name;

    parentBlock.getField('COLLECTION').setValue(firstCollectionId);
    parentBlock.getField('COLLECTION').text_ = firstCollectionName;
    parentBlock.getField('COLLECTION').forceRerender();
    options.splice(0, originalLength);

    parentBlock.outputConnection.check_ = firstCollectionId + BlocklyUtils.DOCUMENT_VAR_SUFFIX;
  }

  public getOutputConnectionCheck(block: any): string {
    if (block.outputConnection && block.outputConnection.check_) {
      return isArray(block.outputConnection.check_) ? block.outputConnection.check_[0] : block.outputConnection.check_;
    }

    return '';
  }

  public setterAndGetterOutputType(parentBlock: any, block: any, skipDisconnect = false) {
    const options = parentBlock.getField('ATTR').getOptions();
    const originalLength = options.length;
    const blockOutputType = this.getOutputConnectionCheck(block);

    let attributes: Attribute[];
    let defaultAttributeId = '';
    if (parentBlock.type === BlocklyUtils.GET_LINK_ATTRIBUTE || parentBlock.type === BlocklyUtils.SET_LINK_ATTRIBUTE) {
      const linkType = this.getLinkType(blockOutputType.split('_')[0]);
      attributes = linkType.attributes;
    } else {
      const collection = this.getCollection(blockOutputType.split('_')[0]);
      attributes = collection.attributes;
      defaultAttributeId = collection.defaultAttributeId;
    }

    let defaultValue = '',
      defaultText = '';
    attributes.forEach(attribute => {
      options.push([attribute.name, attribute.id]);
      if (attribute.id === defaultAttributeId) {
        defaultValue = attribute.id;
        defaultText = attribute.name;
      }
    });

    if (!defaultValue && attributes && attributes.length > 0) {
      defaultValue = attributes[0].id;
      defaultText = attributes[0].name;
    }

    parentBlock.getField('ATTR').setValue(defaultValue);

    // force attribute name render when the same value was already selected
    parentBlock.getField('ATTR').text_ = defaultText;
    parentBlock.getField('ATTR').forceRerender();
    options.splice(0, originalLength);

    if (parentBlock.type === BlocklyUtils.GET_ATTRIBUTE || parentBlock.type === BlocklyUtils.GET_LINK_ATTRIBUTE) {
      const newType =
        block.type.endsWith(BlocklyUtils.LINK_TYPE_BLOCK_SUFFIX) ||
        block.type.endsWith(BlocklyUtils.LINK_INSTANCE_BLOCK_SUFFIX)
          ? ['Array']
          : ['', 'Number', 'String', 'Boolean', 'Colour'];
      const parentBlockOutputType = this.getOutputConnectionCheck(parentBlock);
      if (!skipDisconnect && parentBlockOutputType !== newType[0]) {
        this.tryDisconnect(parentBlock, parentBlock.outputConnection);
      }
      parentBlock.outputConnection.check_ = newType;
    }
  }

  public checkVariablesType(changeEvent, workspace) {
    const blocks = workspace.getBlocksByType(BlocklyUtils.VARIABLES_SET);

    (blocks || []).forEach(block => {
      const children = block.getChildren();
      const idx = (children || []).findIndex(
        child =>
          child.type?.startsWith(BlocklyUtils.VARIABLES_GET_PREFIX) &&
          child.type?.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX)
      );

      // search for all variable setters connected to document variables and set the variable type accordingly
      if (idx >= 0) {
        if (block.inputList?.length > 0 && block.inputList[0].fieldRow?.length > 1) {
          const variable = block.inputList[0].fieldRow[1].getVariable();
          if (variable) {
            const [, , collectionId] = children[idx].type.split('_');
            this.updateVariableType(workspace, variable, collectionId + BlocklyUtils.DOCUMENT_VAR_SUFFIX);
            block.inputList[0].fieldRow[1].variableTypes = [variable.type];
          }
        }
      } else {
        // search for all variable setters connected to CREATE_DOCUMENT blocks with changed variable type
        const idx2 = (children || []).findIndex(child => child.type === BlocklyUtils.CREATE_DOCUMENT);

        if (idx2 >= 0 && children[idx2].outputConnection?.check_?.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX)) {
          const variable = block.inputList[0].fieldRow[1].getVariable();
          if (variable) {
            const [collectionId] = children[idx2].outputConnection.check_.split('_');

            if (variable.type !== collectionId + BlocklyUtils.DOCUMENT_VAR_SUFFIX) {
              // disconnect and dispose all variable getters because they now have wrong name, color and icon
              this.forEachVariableGetter(workspace, variable, innerBlock => {
                if (innerBlock.outputConnection) {
                  this.tryDisconnect(innerBlock, innerBlock.outputConnection);
                }

                setTimeout(() => innerBlock.dispose());
              });

              // update variable type
              this.updateVariableType(workspace, variable, collectionId + BlocklyUtils.DOCUMENT_VAR_SUFFIX);
              block.inputList[0].fieldRow[1].variableTypes = [variable.type];
            }
          }
        } else {
          // search for all variable setters with no childs and existing variable type, then reset the variable type
          if (block.inputList?.length > 0 && block.inputList[0].fieldRow?.length > 1) {
            const variable = block.inputList[0].fieldRow[1].getVariable();
            if (variable && variable.type !== '' && variable.type?.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX)) {
              this.forEachVariableGetter(workspace, variable, innerBlock => {
                if (innerBlock.outputConnection) {
                  this.tryDisconnect(innerBlock, innerBlock.outputConnection);
                }
                setTimeout(() => innerBlock.dispose());
              });

              this.updateVariableType(workspace, variable, '');
              block.inputList[0].fieldRow[1].variableTypes = [''];
            }
          }
        }
      }
    });
  }

  public forEachVariableGetter(workspace, variable, fce: (block) => void) {
    workspace.getBlocksByType(BlocklyUtils.VARIABLES_GET_PREFIX + variable.type).forEach(innerBlock => {
      if (innerBlock.inputList?.length > 0 && innerBlock.inputList[0].fieldRow?.length > 2) {
        const innerVariable = innerBlock.inputList[0].fieldRow[2].getVariable();
        if (innerVariable.getId() === variable.getId()) {
          fce(innerBlock);
        }
      }
    });
  }

  public resetOptions(block: any, field: string): void {
    const options = block.getField(field).getOptions();
    const originalLength = options.length;
    block.getField(field).setValue('?');
    options.push(['?', '?']);
    options.splice(0, originalLength);
  }

  public ensureEmptyTypes(block): void {
    for (let i = 0, input; (input = block.inputList[i]); i++) {
      for (let j = 0, field; (field = input.fieldRow[j]); j++) {
        if (field instanceof Blockly.FieldVariable && field.variableTypes === null) {
          field.setTypes_([''], '');
        }
      }
    }
  }

  public tryDisconnect(block, connection): void {
    try {
      connection.disconnect();
    } catch (e) {
      //nps
    }
    block.moveBy(Blockly.SNAP_RADIUS, Blockly.SNAP_RADIUS);
  }

  public updateVariableType(workspace, variable, newType): void {
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

  public registerDocumentVariables(workspace): any[] {
    const xmlList = [];

    workspace.getAllVariables().forEach(variable => {
      if (variable.type.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX)) {
        this.ensureVariableTypeBlock(variable.type);
        const blockText =
          '<xml>' +
          '<block type="' +
          BlocklyUtils.VARIABLES_GET_PREFIX +
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
      Blockly.Xml.textToDom('<xml><block type="' + BlocklyUtils.GET_ATTRIBUTE + '"></block></xml>').firstChild
    );
    if (this.masterType === MasterBlockType.Function) {
      xmlList.push(
        Blockly.Xml.textToDom('<xml><block type="' + BlocklyUtils.SET_ATTRIBUTE + '"></block></xml>').firstChild
      );
    }

    const xmls = this.components
      .map(component => component.getDocumentVariablesXml(workspace))
      .filter(xml => isNotNullOrUndefined(xml));
    if (xmls?.length > 0) {
      xmlList.push(Blockly.Xml.textToDom('<xml><sep gap="48"></sep></xml>').firstChild);

      xmls.forEach(xml => xmlList.push(Blockly.Xml.textToDom(xml).firstChild));
    }

    return xmlList;
  }

  public registerLinkInstanceVariables(workspace): any[] {
    const xmlList = [];

    workspace.getAllVariables().forEach(variable => {
      if (variable.type.endsWith(BlocklyUtils.LINK_VAR_SUFFIX)) {
        this.ensureLinkInstanceVariableTypeBlock(variable.type);
        const blockText =
          '<xml>' +
          '<block type="' +
          BlocklyUtils.VARIABLES_GET_PREFIX +
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

    return xmlList;
  }

  public getCollection(id: string): Collection {
    return this.collections.find(collection => collection.id === id);
  }

  public getLinkType(id: string): LinkType {
    const currentLinkType = this.linkTypes?.find(linkType => linkType.id === id);
    const collections = this.collections?.filter(c => currentLinkType.collectionIds.indexOf(c.id) >= 0);
    if (collections?.length === 2) {
      return {...currentLinkType, collections: [collections[0], collections[1]]};
    }

    return currentLinkType;
  }

  public ensureVariableTypeBlock(type: string): void {
    if (!Blockly.Blocks[BlocklyUtils.VARIABLES_GET_PREFIX + type]) {
      const collection = this.getCollection(type.replace(BlocklyUtils.DOCUMENT_VAR_SUFFIX, ''));

      const this_ = this;
      Blockly.Blocks[BlocklyUtils.VARIABLES_GET_PREFIX + type] = {
        init: function () {
          this.jsonInit({
            type: BlocklyUtils.VARIABLES_GET_PREFIX + type,
            message0: '%{BKY_BLOCK_VARIABLE}', // %1 %2 %3
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
      Blockly.JavaScript[BlocklyUtils.VARIABLES_GET_PREFIX + type] = Blockly.JavaScript['variables_get'];
    }
  }

  public ensureLinkInstanceVariableTypeBlock(type: string): void {
    if (!Blockly.Blocks[BlocklyUtils.VARIABLES_GET_PREFIX + type]) {
      const linkType = this.getLinkType(type.replace(BlocklyUtils.LINK_VAR_SUFFIX, ''));
      const c1 = this.getCollection(linkType.collectionIds[0]);
      const c2 = this.getCollection(linkType.collectionIds[1]);

      Blockly.Blocks[BlocklyUtils.VARIABLES_GET_PREFIX + type] = {
        init: function () {
          this.jsonInit({
            type: BlocklyUtils.VARIABLES_GET_PREFIX + type,
            message0: '%{BKY_BLOCK_LINK_VARIABLE}', // %1%2 %3 %4
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
                type: 'field_variable',
                name: 'VAR',
                variable: '%{BKY_VARIABLES_DEFAULT_NAME}',
                variableTypes: [type],
                defaultType: type,
              },
            ],
            colour: COLOR_GRAY300,
            output: type,
          });
        },
      };
      Blockly.JavaScript[BlocklyUtils.VARIABLES_GET_PREFIX + type] = Blockly.JavaScript['variables_get'];
    }
  }

  public getBlocklyLinkType(linkType: LinkType): string {
    return (
      linkType.id +
      '-' +
      linkType.collectionIds[0] +
      '_' +
      linkType.collectionIds[1] +
      BlocklyUtils.LINK_TYPE_BLOCK_SUFFIX
    );
  }

  public getBlocklyLinkInstance(linkType: LinkType): string {
    return (
      linkType.id +
      '-' +
      linkType.collectionIds[0] +
      '_' +
      linkType.collectionIds[1] +
      BlocklyUtils.LINK_INSTANCE_BLOCK_SUFFIX
    );
  }

  public registerLinks(workspace): any[] {
    const xmlList = this.registerLinkInstanceVariables(workspace);

    if (xmlList.length) {
      xmlList.push(Blockly.Xml.textToDom('<xml><sep gap="48"></sep></xml>').firstChild);
    }

    xmlList.push(
      Blockly.Xml.textToDom('<xml><block type="' + BlocklyUtils.GET_LINK_ATTRIBUTE + '"></block></xml>').firstChild
    );
    if (this.masterType === MasterBlockType.Function) {
      xmlList.push(
        Blockly.Xml.textToDom('<xml><block type="' + BlocklyUtils.SET_LINK_ATTRIBUTE + '"></block></xml>').firstChild
      );
    }
    xmlList.push(
      Blockly.Xml.textToDom('<xml><block type="' + BlocklyUtils.GET_LINK_DOCUMENT + '"></block></xml>').firstChild
    );

    xmlList.push(Blockly.Xml.textToDom('<xml><sep gap="48"></sep></xml>').firstChild);

    this.linkTypes.forEach(linkType => {
      this.ensureLinkTypeBlock(linkType);

      const blockText = '<xml>' + '<block type="' + this.getBlocklyLinkType(linkType) + '">' + '</block>' + '</xml>';
      const block = Blockly.Xml.textToDom(blockText).firstChild;
      xmlList.push(block);
    });

    xmlList.push(Blockly.Xml.textToDom('<xml><sep gap="48"></sep></xml>').firstChild);

    this.linkTypes.forEach(linkType => {
      this.ensureLinkInstanceBlock(linkType);

      const blockText =
        '<xml>' + '<block type="' + this.getBlocklyLinkInstance(linkType) + '">' + '</block>' + '</xml>';
      const block = Blockly.Xml.textToDom(blockText).firstChild;
      xmlList.push(block);
    });

    xmlList.push(Blockly.Xml.textToDom('<xml><sep gap="48"></sep></xml>').firstChild);

    return xmlList;
  }

  public registerDates(workspace): any[] {
    const xmlList = [];

    xmlList.push(Blockly.Xml.textToDom('<xml><block type="date_to_ms"></block></xml>').firstChild);
    xmlList.push(Blockly.Xml.textToDom('<xml><block type="ms_to_date"></block></xml>').firstChild);
    xmlList.push(Blockly.Xml.textToDom('<xml><block type="date_now"></block></xml>').firstChild);
    xmlList.push(Blockly.Xml.textToDom('<xml><block type="current_date"></block></xml>').firstChild);
    xmlList.push(Blockly.Xml.textToDom('<xml><block type="ms_to_unit"></block></xml>').firstChild);
    xmlList.push(
      Blockly.Xml.textToDom(
        '<xml><block type="parse_date"><value name="FORMAT"><shadow type="text"><field name="TEXT">DD.MM.YYYY</field></shadow></value><value name="LOCALE"><shadow type="text"><field name="TEXT">en</field></shadow></value></block></xml>'
      ).firstChild
    );
    xmlList.push(
      Blockly.Xml.textToDom(
        '<xml><block type="format_date"><value name="FORMAT"><shadow type="text"><field name="TEXT">DD.MM.YYYY</field></shadow></value><value name="LOCALE"><shadow type="text"><field name="TEXT">en</field></shadow></value></block></xml>'
      ).firstChild
    );

    return xmlList;
  }

  public ensureLinkTypeBlock(linkType: LinkType) {
    const type = this.getBlocklyLinkType(linkType);
    const linkTypeId = linkType.id;

    if (!Blockly.Blocks[type]) {
      const c1 = this.getCollection(linkType.collectionIds[0]);
      const c2 = this.getCollection(linkType.collectionIds[1]);

      Blockly.Blocks[type] = {
        init: function () {
          this.jsonInit({
            type: type,
            message0: '%{BKY_BLOCK_LINK_VARIABLE}', // %1%2 %3 %4
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
                  linkType.collectionIds[0] + BlocklyUtils.DOCUMENT_VAR_SUFFIX,
                  linkType.collectionIds[1] + BlocklyUtils.DOCUMENT_VAR_SUFFIX,
                ],
              },
            ],
            output: BlocklyUtils.UNKNOWN,
            colour: COLOR_GRAY200,
            tooltip: '',
            helpUrl: '',
          });
        },
      };

      const this_ = this;
      Blockly.JavaScript[type] = function (block) {
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

  public ensureLinkInstanceBlock(linkType: LinkType) {
    const type = this.getBlocklyLinkInstance(linkType);
    const linkTypeId = linkType.id;

    if (!Blockly.Blocks[type]) {
      const c1 = this.getCollection(linkType.collectionIds[0]);
      const c2 = this.getCollection(linkType.collectionIds[1]);

      Blockly.Blocks[type] = {
        init: function () {
          this.jsonInit({
            type: type,
            message0: '%{BKY_BLOCK_LINK_INSTANCE}', // %1 %2%3 %4 %5
            args0: [
              {
                type: 'field_label',
                text: '%{BKY_BLOCK_LINK_INSTANCE_ATTRS}', // Attrs. of
                class: 'text-primary',
              },
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
                  linkType.collectionIds[0] + BlocklyUtils.DOCUMENT_VAR_SUFFIX,
                  linkType.collectionIds[1] + BlocklyUtils.DOCUMENT_VAR_SUFFIX,
                ],
              },
            ],
            output: linkType.id + BlocklyUtils.LINK_TYPE_ARRAY_SUFFIX,
            colour: COLOR_GRAY400,
            tooltip: '',
            helpUrl: '',
          });
        },
      };

      const this_ = this;
      Blockly.JavaScript[type] = function (block) {
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

        const code = lumeerVar + '.getLinks(' + argument0 + ", '" + linkTypeId + "')";

        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };
    }
  }

  // bridge for functions running outside of ng zone
  public shadeColor(color: string, percent: number): string {
    return shadeColor(color, percent);
  }

  // bridge for functions running outside of ng zone
  public contrastColor(color?: string, dark?: string, light?: string): string {
    return color ? this.contrastColorPipe.transform(color, {dark, light}) : dark ? dark : COLOR_PRIMARY;
  }

  public emptyJs(js: string): boolean {
    const clean = js.replace(/var.* = Polyglot\.import\('lumeer'\);/g, '').trim();

    return clean.length === 0;
  }
}
