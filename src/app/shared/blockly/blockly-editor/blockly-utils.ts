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
import {ConstraintType} from '@lumeer/data-filters';
import {isArray, isNotNullOrUndefined} from '@lumeer/utils';

import {COLOR_GRAY200, COLOR_GRAY300, COLOR_GRAY400, COLOR_PRIMARY} from '../../../core/constants';
import {Attribute, Collection} from '../../../core/store/collections/collection';
import {LinkType} from '../../../core/store/link-types/link.type';
import {View} from '../../../core/store/views/view';
import {ContrastColorPipe} from '../../pipes/contrast-color.pipe';
import {shadeColor} from '../../utils/html-modifier';
import {BlocklyDebugDisplay} from '../blockly-debugger/blockly-debugger.component';
import {RuleVariable} from '../rule-variable-type';
import {BlocklyComponent} from './blocks/blockly-component';

declare var Blockly: any;

export const enum MasterBlockType {
  Rule = 'Rule',
  Function = 'Function',
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
  public static readonly VARIABLES_GET = 'variables_get';
  public static readonly GET_LINK_DOCUMENT_UNKNOWN = 'link_document_unknown';
  public static readonly UNKNOWN = 'unknown';
  public static readonly STATEMENT_CONTAINER = 'statement_container';
  public static readonly VALUE_CONTAINER = 'value_container';
  public static readonly LINK_CONTAINER = 'link_container';
  public static readonly SEQUENCE_BLOCK = 'sequence_block';
  public static readonly SEQUENCE_CURRENT_BLOCK = 'sequence_current_block';
  public static readonly SEQUENCE_CHANGE_BLOCK = 'sequence_change_block';
  public static readonly SHOW_MESSAGE = 'show_message';
  public static readonly DATE_CHANGE = 'date_change';
  public static readonly MS_TO_DATE = 'ms_to_date';
  public static readonly ISO_TO_DATE = 'iso_to_date';
  public static readonly ISO_TO_MS = 'iso_to_ms';
  public static readonly SHIFT_DATE_OF = 'shift_date_of';
  public static readonly DATE_TO_ISO = 'date_to_iso';
  public static readonly DATE_TO_MS = 'date_to_ms';
  public static readonly DATE_NOW = 'date_now';
  public static readonly DATE_NOW_MS = 'date_now_ms';
  public static readonly MS_TO_UNIT = 'ms_to_unit';
  public static readonly PARSE_DATE = 'parse_date';
  public static readonly FORMAT_DATE = 'format_date';
  public static readonly CURRENT_DATE = 'current_date';
  public static readonly CURRENT_USER = 'current_user';
  public static readonly CURRENT_TEAMS = 'current_teams';
  public static readonly GET_USER_TEAMS = 'get_user_teams';
  public static readonly GET_USER_TEAM_IDS = 'get_user_team_ids';
  public static readonly IS_USER_IN_TEAM = 'is_user_in_team';
  public static readonly CURRENT_LOCALE = 'current_locale';
  public static readonly ESCAPE_HTML = 'escape_html';
  public static readonly UNESCAPE_HTML = 'unescape_html';
  public static readonly FORMAT_CURRENCY = 'format_currency';
  public static readonly CREATE_DOCUMENT = 'create_document';
  public static readonly DELETE_DOCUMENT = 'delete_document';
  public static readonly DELETE_LINK = 'link_delete';
  public static readonly GET_SELECTION_LIST_VALUES = 'get_selection_list_values';
  public static readonly GET_SELECTION_LIST_DISPLAY_VALUES = 'get_selection_list_display_values';
  public static readonly LINK_DOCUMENTS_NO_RETURN = 'link_documents_no_return';
  public static readonly LINK_DOCUMENTS_RETURN = 'link_documents_return';
  public static readonly READ_DOCUMENTS = 'read_documents';
  public static readonly REMOVE_DOCUMENTS_IN_VIEW = 'remove_documents_in_view';
  public static readonly GET_VIEW_NAME = 'get_view_name';
  public static readonly MERGE_ARRAYS = 'merge_arrays';
  public static readonly GET_SIBLINGS = 'get_siblings';
  public static readonly GET_HIERARCHY_SIBLINGS = 'get_hierarchy_siblings';
  public static readonly GET_PARENT_DOCUMENT = 'get_parent_document';
  public static readonly GET_CHILD_DOCUMENTS = 'get_child_documents';
  public static readonly IS_EMPTY = 'is_empty';
  public static readonly IS_ARRAY = 'is_array';
  public static readonly IS_STRING = 'is_string';
  public static readonly IS_NUMBER = 'is_number';
  public static readonly IS_BOOLEAN = 'is_boolean';
  public static readonly COUNT_OCCURRENCES = 'count_occurrences';
  public static readonly FILTER_OBJECTS = 'filter_objects';
  public static readonly IS_NOT_EMPTY = 'is_not_empty';
  public static readonly PRINT_ATTRIBUTE = 'print_attribute';
  public static readonly PRINT_TEXT = 'print_text';
  public static readonly DISPLAY_ATTRIBUTE = 'display_attribute';
  public static readonly DISPLAY_TEXT = 'display_text';
  public static readonly GENERATE_PDF = 'generate_pdf';
  public static readonly SEND_EMAIL = 'send_email';
  public static readonly SEND_SMTP_EMAIL = 'send_smtp_email';
  public static readonly NAVIGATE_TO_VIEW = 'navigate_to_view';
  public static readonly NAVIGATE_TO_VIEW_BY_ID = 'navigate_to_view_by_id';
  public static readonly NAVIGATE_TO_VIEW_SEARCH = 'navigate_to_view_search';
  public static readonly SHARE_VIEW = 'share_view';
  public static readonly GET_RESOURCE_VARIABLE = 'get_resource_variable';
  public static readonly GET_SMTP_CONFIGURATION = 'get_smtp_configuration';
  public static readonly STRING_REPLACE = 'string_replace';
  public static readonly REPLACE_PATTERN = 'replace_pattern';
  public static readonly LOOP_BREAK = 'loop_break';
  public static readonly LOOP_CONTINUE = 'loop_continue';
  public static readonly BLOCK_COMMENT = 'block_comment';
  public static readonly GET_DOCUMENT_CREATED_DATE = 'get_document_created_date';
  public static readonly GET_DOCUMENT_CREATED_AUTHOR = 'get_document_created_author';
  public static readonly GET_DOCUMENT_UPDATED_DATE = 'get_document_updated_date';
  public static readonly GET_DOCUMENT_UPDATED_AUTHOR = 'get_document_updated_author';
  public static readonly COPY_DOCUMENT_VALUES_SIMPLE = 'copy_document_values_simple';
  public static readonly GET_RECORDS_COUNT = 'get_records_count';
  public static readonly TO_NUMBER = 'to_number';
  public static readonly CREATE_DELETE_DOCUMENTS_LINKS_LIMIT = 25;
  public static readonly MAXIMUM_DOCUMENTS_RETURNED = 1000;
  public static readonly SHOW_MESSAGES_LIMIT = 5;

  private components: BlocklyComponent[] = [];

  private contrastColorPipe = new ContrastColorPipe();

  private lumeerVar: string;

  public constructor(
    private masterType: MasterBlockType,
    private collections: Collection[],
    private linkTypes: LinkType[],
    private views: View[],
    private variables: RuleVariable[],
    private selectionLists: string[]
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

  public getSelectionLists() {
    return this.selectionLists;
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

  public getCollectionType(varType: string): string {
    return varType.split('_')[0];
  }

  public getVariableType(varType: string): string {
    return varType.split('_')[2];
  }

  public ensureTypeChecks(workspace) {
    // first fix variables and links
    workspace.getAllBlocks(false).forEach(block => {
      const children = block.getChildren(false);
      this.preventDeletionOfInitialVariables(block);

      // set output type of read documents block
      if (block.type === BlocklyUtils.READ_DOCUMENTS) {
        const viewId = block.getField('VIEW_ID').value_;
        const view = this.views.find(v => v.id === viewId);

        if (view) {
          const collectionId = view.query?.stems[0]?.collectionId;
          if (collectionId) {
            block.setOutput(true, collectionId + BlocklyUtils.DOCUMENT_ARRAY_TYPE_SUFFIX);
          }
        }
      }

      // set output type of get child documents block
      if (block.type === BlocklyUtils.GET_PARENT_DOCUMENT) {
        const input = block.getInput('DOCUMENT');

        if (isNotNullOrUndefined(input.connection.targetConnection?.check_)) {
          const inputType =
            input.connection.targetConnection?.check_ instanceof Array
              ? input.connection.targetConnection?.check_[0]
              : input.connection.targetConnection?.check_;

          block.setOutput(true, inputType);
        }
      }

      // set output type of get siblings block, and
      // set output type of get siblings in hierarchy block, and
      // set output type of get child documents block
      if (
        block.type === BlocklyUtils.GET_SIBLINGS ||
        block.type === BlocklyUtils.GET_HIERARCHY_SIBLINGS ||
        block.type === BlocklyUtils.GET_CHILD_DOCUMENTS
      ) {
        const input = block.getInput('DOCUMENT');

        if (isNotNullOrUndefined(input.connection.targetConnection?.check_)) {
          const inputType =
            input.connection.targetConnection?.check_ instanceof Array
              ? input.connection.targetConnection?.check_[0]
              : input.connection.targetConnection?.check_;

          block.setOutput(
            true,
            inputType.replace(BlocklyUtils.DOCUMENT_VAR_SUFFIX, BlocklyUtils.DOCUMENT_ARRAY_TYPE_SUFFIX)
          );
        }
      }

      // set output type of link creation block
      if (block.type === BlocklyUtils.LINK_DOCUMENTS_RETURN) {
        const linkTypeId = block.getField('LINKTYPE').value_;
        block.setOutput(true, linkTypeId + BlocklyUtils.LINK_VAR_SUFFIX);
      }

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

      // create document output check
      if (block.type === BlocklyUtils.CREATE_DOCUMENT) {
        const collectionId = block.inputList[0]?.fieldRow[1]?.value_;
        block.outputConnection.check_ = collectionId + BlocklyUtils.DOCUMENT_VAR_SUFFIX;
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

      // print attribute
      if (block.type === BlocklyUtils.PRINT_ATTRIBUTE) {
        if (children && children.length > 0) {
          const child = children[0];
          const childOutputType = this.getOutputConnectionCheck(child);

          if (
            childOutputType.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX) ||
            childOutputType.endsWith(BlocklyUtils.LINK_VAR_SUFFIX)
          ) {
            const value = block.getField('ATTR').getValue();
            this.setterAndGetterOutputType(block, child, true);
            block.getField('ATTR').setValue(value);
          }
        }
      }

      // generate PDF attribute
      if (block.type === BlocklyUtils.GENERATE_PDF) {
        if (children && children.length > 1) {
          const child = children[1];
          const childOutputType = this.getOutputConnectionCheck(child);

          if (
            childOutputType.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX) ||
            childOutputType.endsWith(BlocklyUtils.LINK_VAR_SUFFIX)
          ) {
            const value = block.getField('ATTR').getValue();
            this.setterAndGetterOutputType(block, child, true);
            block.getField('ATTR').setValue(value);
          }
        }
      }

      // send SMTP email attribute
      if (block.type === BlocklyUtils.SEND_SMTP_EMAIL) {
        if (children && children.length > 3) {
          const child = children[3];
          const childOutputType = this.getOutputConnectionCheck(child);

          if (
            childOutputType.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX) ||
            childOutputType.endsWith(BlocklyUtils.LINK_VAR_SUFFIX)
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

  public preventDeletionOfInitialVariables(block: any) {
    if (block.type.startsWith(BlocklyUtils.VARIABLES_GET_PREFIX)) {
      if (this.variables.map(v => v.name).indexOf(block.getField('VAR').getVariable().name) >= 0) {
        block.setEditable(false);
      }
    }
  }

  public setLinkDocumentOutputType(parentBlock: any, block: any) {
    const options = parentBlock.getField('COLLECTION').getOptions();
    const originalValue = parentBlock.getField('COLLECTION').getValue();
    let originalValuePresent = false;
    const originalLength = options.length;
    const blockOutputType = this.getOutputConnectionCheck(block);
    const linkTypeId = blockOutputType.split('_')[0];
    const linkType = this.getLinkType(linkTypeId);

    linkType.collectionIds.forEach(collectionId => {
      const collection = this.getCollection(collectionId);
      options.push([collection.name, collection.id]);

      if (collection.id === originalValue) {
        originalValuePresent = true;
      }
    });

    const firstCollection = this.getCollection(originalValuePresent ? originalValue : linkType.collectionIds[0]);
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
    if (isNotNullOrUndefined(parentBlock.getField('ATTR'))) {
      const options = parentBlock.getField('ATTR').getOptions();
      const originalLength = options.length;
      const blockOutputType = this.getOutputConnectionCheck(block);

      let attributes: Attribute[];
      let defaultAttributeId = '';
      if (
        parentBlock.type === BlocklyUtils.GET_LINK_ATTRIBUTE ||
        parentBlock.type === BlocklyUtils.SET_LINK_ATTRIBUTE ||
        (parentBlock.type === BlocklyUtils.PRINT_ATTRIBUTE && blockOutputType.endsWith(BlocklyUtils.LINK_VAR_SUFFIX)) ||
        (parentBlock.type === BlocklyUtils.GENERATE_PDF && blockOutputType.endsWith(BlocklyUtils.LINK_VAR_SUFFIX)) ||
        (parentBlock.type === BlocklyUtils.SEND_SMTP_EMAIL && blockOutputType.endsWith(BlocklyUtils.LINK_VAR_SUFFIX))
      ) {
        const linkType = this.getLinkType(blockOutputType.split('_')[0]);
        attributes = linkType.attributes;
      } else if (
        parentBlock.type === BlocklyUtils.GET_ATTRIBUTE ||
        parentBlock.type === BlocklyUtils.SET_ATTRIBUTE ||
        (parentBlock.type === BlocklyUtils.PRINT_ATTRIBUTE &&
          blockOutputType.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX)) ||
        (parentBlock.type === BlocklyUtils.GENERATE_PDF &&
          blockOutputType.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX)) ||
        (parentBlock.type === BlocklyUtils.SEND_SMTP_EMAIL &&
          blockOutputType.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX))
      ) {
        const collection = this.getCollection(blockOutputType.split('_')[0]);
        attributes = collection.attributes;

        if (parentBlock.type !== BlocklyUtils.GENERATE_PDF && parentBlock.type !== BlocklyUtils.SEND_SMTP_EMAIL) {
          // for PDF block and send SMTP block, we filter out only File attributes, which rarely is the default attr.
          defaultAttributeId = collection.defaultAttributeId;
        }
      }

      let defaultValue = '',
        defaultText = '';
      attributes.forEach(attribute => {
        // for the PDF generator block and the send SMTP block keep only attributes of type file
        if (
          (parentBlock.type !== BlocklyUtils.GENERATE_PDF && parentBlock.type !== BlocklyUtils.SEND_SMTP_EMAIL) ||
          attribute.constraint.type === ConstraintType.Files
        ) {
          options.push([attribute.name, attribute.id]);
          if (attribute.id === defaultAttributeId) {
            defaultValue = attribute.id;
            defaultText = attribute.name;
          }
        }
      });

      if (!defaultValue && options && options.length > originalLength) {
        defaultValue = options[originalLength][1];
        defaultText = options[originalLength][0];
      }

      parentBlock.getField('ATTR').setValue(defaultValue);

      // force attribute name render when the same value was already selected
      parentBlock.getField('ATTR').text_ = defaultText;
      parentBlock.getField('ATTR').forceRerender();
      options.splice(0, originalLength);

      if (parentBlock.type === BlocklyUtils.GET_ATTRIBUTE || parentBlock.type === BlocklyUtils.GET_LINK_ATTRIBUTE) {
        const newType =
          block.type.endsWith(BlocklyUtils.GET_HIERARCHY_SIBLINGS) ||
          block.type.endsWith(BlocklyUtils.GET_CHILD_DOCUMENTS) ||
          block.type.endsWith(BlocklyUtils.GET_SIBLINGS) ||
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
  }

  public checkVariablesType(changeEvent, workspace) {
    const blocks = workspace.getBlocksByType(BlocklyUtils.VARIABLES_SET);

    (blocks || []).forEach(block => {
      const children = block.getChildren();
      const idx = (children || []).findIndex(
        child =>
          (child.type?.startsWith(BlocklyUtils.VARIABLES_GET_PREFIX) &&
            child.type?.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX)) ||
          child.type === BlocklyUtils.GET_PARENT_DOCUMENT ||
          child.type === BlocklyUtils.GET_LINK_DOCUMENT
      );

      // search for all variable setters connected to document variables and set the variable type accordingly
      if (idx >= 0) {
        if (block.inputList?.length > 0 && block.inputList[0].fieldRow?.length > 1) {
          const variable = block.inputList[0].fieldRow[1].getVariable();
          if (variable) {
            if (children[idx].type === BlocklyUtils.GET_PARENT_DOCUMENT) {
              const input = children[idx].getInput('DOCUMENT');

              if (isNotNullOrUndefined(input.connection.targetConnection?.check_)) {
                const inputType =
                  input.connection.targetConnection?.check_ instanceof Array
                    ? input.connection.targetConnection?.check_[0]
                    : input.connection.targetConnection?.check_;
                const [collectionId] = inputType.split('_');
                this.updateVariableType(workspace, variable, collectionId + BlocklyUtils.DOCUMENT_VAR_SUFFIX);
                block.inputList[0].fieldRow[1].variableTypes = [variable.type];
              }
            } else if (children[idx].type === BlocklyUtils.GET_LINK_DOCUMENT) {
              const outputType = this.getOutputConnectionCheck(children[idx]);
              const [collectionId] = outputType.split('_');

              // the get link document block must already be connected to a document
              if (collectionId !== BlocklyUtils.GET_LINK_DOCUMENT_UNKNOWN.split('_')[0]) {
                // the variable already existed and its type changed
                if (variable.type !== collectionId + BlocklyUtils.DOCUMENT_VAR_SUFFIX) {
                  // disconnect and dispose all variable getters because they now have wrong name, color and icon
                  this.disposeVariableGetters(workspace, variable);
                }

                this.updateVariableType(workspace, variable, collectionId + BlocklyUtils.DOCUMENT_VAR_SUFFIX);
                block.inputList[0].fieldRow[1].variableTypes = [variable.type];
              } else {
                this.tryDisconnect(children[idx], children[idx].outputConnection);
              }
            } else {
              if (children[idx].type?.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX)) {
                const [, , collectionId] = children[idx].type.split('_');
                this.updateVariableType(workspace, variable, collectionId + BlocklyUtils.DOCUMENT_VAR_SUFFIX);
                block.inputList[0].fieldRow[1].variableTypes = [variable.type];
              } else if (children[idx].type?.endsWith(BlocklyUtils.LINK_VAR_SUFFIX)) {
                const [, , linkTypeId] = children[idx].type.split('_');
                this.updateVariableType(workspace, variable, linkTypeId + BlocklyUtils.LINK_VAR_SUFFIX);
                block.inputList[0].fieldRow[1].variableTypes = [variable.type];
              }
            }
          }
        }
      } else {
        const idx2 = (children || []).findIndex(child => child.type === BlocklyUtils.CREATE_DOCUMENT);
        const idx3 = (children || []).findIndex(child => child.type === BlocklyUtils.LINK_DOCUMENTS_RETURN);

        // search for all variable setters connected to CREATE_DOCUMENT blocks with changed variable type
        if (idx2 >= 0 && this.getOutputConnectionCheck(children[idx2])?.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX)) {
          const variable = block.inputList[0].fieldRow[1].getVariable();
          if (variable) {
            const check = this.getOutputConnectionCheck(children[idx2]) || '';
            const [collectionId] = check.split('_');

            if (variable.type !== collectionId + BlocklyUtils.DOCUMENT_VAR_SUFFIX) {
              // disconnect and dispose all variable getters because they now have wrong name, color and icon
              this.disposeVariableGetters(workspace, variable);

              // update variable type
              this.updateVariableType(workspace, variable, collectionId + BlocklyUtils.DOCUMENT_VAR_SUFFIX);
              block.inputList[0].fieldRow[1].variableTypes = [variable.type];
            }
          }
          // search for all variable setters connected to LINK_DOCUMENTS_RETURN blocks with changed variable type
        } else if (idx3 >= 0 && this.getOutputConnectionCheck(children[idx3])?.endsWith(BlocklyUtils.LINK_VAR_SUFFIX)) {
          const variable = block.inputList[0].fieldRow[1].getVariable();
          if (variable) {
            const check = this.getOutputConnectionCheck(children[idx3]) || '';
            const [linkTypeId] = check.split('_');

            if (variable.type !== linkTypeId + BlocklyUtils.LINK_VAR_SUFFIX) {
              // disconnect and dispose all variable getters because they now have wrong name, color and icon
              this.disposeVariableGetters(workspace, variable);

              // update variable type
              this.updateVariableType(workspace, variable, linkTypeId + BlocklyUtils.LINK_VAR_SUFFIX);
              block.inputList[0].fieldRow[1].variableTypes = [variable.type];
            }
          }
        } else {
          // search for all variable setters with no childs and existing variable type, then reset the variable type
          if (block.inputList?.length > 0 && block.inputList[0].fieldRow?.length > 1) {
            const variable = block.inputList[0].fieldRow[1].getVariable();
            if (
              variable &&
              variable.type !== '' &&
              (variable.type?.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX) ||
                variable.type?.endsWith(BlocklyUtils.LINK_VAR_SUFFIX))
            ) {
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

  private disposeVariableGetters(workspace, variable) {
    // disconnect and dispose all variable getters because they now have wrong name, color and icon
    this.forEachVariableGetter(workspace, variable, innerBlock => {
      if (innerBlock.outputConnection) {
        this.tryDisconnect(innerBlock, innerBlock.outputConnection);
      }

      setTimeout(() => innerBlock.dispose());
    });
  }

  public forEachVariableGetter(workspace, variable, fce: (block) => void) {
    [
      ...workspace.getBlocksByType(BlocklyUtils.VARIABLES_GET_PREFIX + variable.type),
      ...workspace.getBlocksByType(BlocklyUtils.VARIABLES_GET),
    ].forEach(innerBlock => {
      if (innerBlock.inputList?.length > 0) {
        innerBlock.inputList[0].fieldRow
          .filter(row => row?.name === 'VAR')
          .forEach(row => {
            const innerVariable = row.getVariable();
            if (innerVariable.getId() === variable.getId()) {
              fce(innerBlock);
            }
          });
      }
    });
  }

  public resetOptions(block: any, field: string) {
    const options = block.getField(field).getOptions();
    const originalLength = options.length;
    block.getField(field).setValue('?');
    options.push(['?', '?']);
    options.splice(0, originalLength);
  }

  public ensureEmptyTypes(block) {
    for (let i = 0, input; (input = block.inputList[i]); i++) {
      for (let j = 0, field; (field = input.fieldRow[j]); j++) {
        if (field instanceof Blockly.FieldVariable && field.variableTypes === null) {
          field.setTypes_([''], '');
        }
      }
    }
  }

  public tryDisconnect(block, connection) {
    try {
      connection.disconnect();
    } catch (e) {
      //nps
    }

    if (!block.getParent()) {
      block.moveBy(Blockly.SNAP_RADIUS, Blockly.SNAP_RADIUS);
    }
  }

  public updateVariableType(workspace, variable, newType) {
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
      if (
        variable.type.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX) ||
        variable.type.endsWith(BlocklyUtils.DOCUMENT_ARRAY_TYPE_SUFFIX)
      ) {
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
    if (this.masterType === MasterBlockType.Rule) {
      xmlList.push(
        Blockly.Xml.textToDom('<xml><block type="' + BlocklyUtils.SET_ATTRIBUTE + '"></block></xml>').firstChild
      );
    }

    const xmls = this.components
      .filter(component => component.getVisibility().includes(this.masterType))
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
    const collections =
      currentLinkType && this.collections?.filter(c => currentLinkType.collectionIds.indexOf(c.id) >= 0);
    if (collections?.length === 2) {
      return {...currentLinkType, collections: [collections[0], collections[1]]};
    }

    return currentLinkType;
  }

  public ensureVariableTypeBlock(type: string) {
    if (!Blockly.Blocks[BlocklyUtils.VARIABLES_GET_PREFIX + type]) {
      const collection = this.getCollection(
        type.replace(
          type.indexOf(BlocklyUtils.DOCUMENT_ARRAY_TYPE_SUFFIX) >= 0
            ? BlocklyUtils.DOCUMENT_ARRAY_TYPE_SUFFIX
            : BlocklyUtils.DOCUMENT_VAR_SUFFIX,
          ''
        )
      );

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
            colour: this_.shadeColor(collection.color, 0.5),
            output: type,
          });
        },
      };
      Blockly.JavaScript[BlocklyUtils.VARIABLES_GET_PREFIX + type] = Blockly.JavaScript['variables_get'];
    }
  }

  public ensureLinkInstanceVariableTypeBlock(type: string) {
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
    if (this.masterType === MasterBlockType.Rule) {
      xmlList.push(
        Blockly.Xml.textToDom('<xml><block type="' + BlocklyUtils.SET_LINK_ATTRIBUTE + '"></block></xml>').firstChild
      );
    }
    xmlList.push(
      Blockly.Xml.textToDom('<xml><block type="' + BlocklyUtils.GET_LINK_DOCUMENT + '"></block></xml>').firstChild
    );

    const xmls = this.components
      .filter(component => component.getVisibility().includes(this.masterType))
      .map(component => component.getLinkVariablesXml(workspace))
      .filter(xml => isNotNullOrUndefined(xml));
    if (xmls?.length > 0) {
      xmlList.push(Blockly.Xml.textToDom('<xml><sep gap="48"></sep></xml>').firstChild);

      xmls.forEach(xml => xmlList.push(Blockly.Xml.textToDom(xml).firstChild));
    }

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

    xmlList.push(Blockly.Xml.textToDom('<xml><block type="date_to_iso"></block></xml>').firstChild);
    xmlList.push(Blockly.Xml.textToDom('<xml><block type="date_to_ms"></block></xml>').firstChild);
    xmlList.push(Blockly.Xml.textToDom('<xml><block type="ms_to_date"></block></xml>').firstChild);
    xmlList.push(Blockly.Xml.textToDom('<xml><block type="iso_to_date"></block></xml>').firstChild);
    xmlList.push(Blockly.Xml.textToDom('<xml><block type="iso_to_ms"></block></xml>').firstChild);
    xmlList.push(
      Blockly.Xml.textToDom(
        '<xml><block type="date_change"><value name="COUNT"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block></xml>'
      ).firstChild
    );
    xmlList.push(Blockly.Xml.textToDom('<xml><block type="shift_date_of"></block></xml>').firstChild);
    xmlList.push(Blockly.Xml.textToDom('<xml><block type="date_now"></block></xml>').firstChild);
    xmlList.push(Blockly.Xml.textToDom('<xml><block type="date_now_ms"></block></xml>').firstChild);
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
                  BlocklyUtils.GET_LINK_DOCUMENT_UNKNOWN,
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
                  BlocklyUtils.GET_LINK_DOCUMENT_UNKNOWN,
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
