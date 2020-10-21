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
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  Output,
  Renderer2,
} from '@angular/core';
import {Store} from '@ngrx/store';
import {ActivatedRoute} from '@angular/router';
import {DOCUMENT} from '@angular/common';
import {
  COLOR_CYAN,
  COLOR_DARK,
  COLOR_GRAY200,
  COLOR_GRAY300,
  COLOR_GRAY400,
  COLOR_GREEN,
  COLOR_INDIGO,
  COLOR_PINK,
  COLOR_PRIMARY,
  COLOR_RED,
} from '../../../core/constants';
import {Attribute, Collection} from '../../../core/store/collections/collection';
import {LinkType} from '../../../core/store/link-types/link.type';
import {RuleVariable} from '../rule-variable-type';
import {AppState} from '../../../core/store/app.state';
import {ContrastColorPipe} from '../../pipes/contrast-color.pipe';
import {BlocklyService} from '../../../core/service/blockly.service';
import {shadeColor} from '../../utils/html-modifier';
import {BehaviorSubject} from 'rxjs';
import {isArray} from '../../utils/common.utils';
import {uniqueValues} from '../../utils/array.utils';

declare var Blockly: any;

const DOCUMENT_VAR_SUFFIX = '_document';
const LINK_VAR_SUFFIX = '_linkinst';
const LINK_TYPE_ARRAY_SUFFIX = '_link_array';
const DOCUMENT_ARRAY_TYPE_SUFFIX = '_document_array';
const LINK_TYPE_BLOCK_SUFFIX = '_link';
const LINK_INSTANCE_BLOCK_SUFFIX = '_link_instance';
const ARRAY_TYPE_SUFFIX = '_array';
const FOREACH_DOCUMENT_ARRAY = 'foreach_document_array';
const FOREACH_LINK_ARRAY = 'foreach_link_array';
const GET_ATTRIBUTE = 'get_attribute';
const SET_ATTRIBUTE = 'set_attribute';
const GET_LINK_ATTRIBUTE = 'get_link_attribute';
const SET_LINK_ATTRIBUTE = 'set_link_attribute';
const GET_LINK_DOCUMENT = 'get_link_document';
const VARIABLES_GET_PREFIX = 'variables_get_';
const UNKNOWN = 'unknown';
const STATEMENT_CONTAINER = 'statement_container';
const VALUE_CONTAINER = 'value_container';
const LINK_CONTAINER = 'link_container';
const SEQUENCE_BLOCK = 'sequence_block';
const MS_TO_DATE = 'ms_to_date';
const DATE_TO_MS = 'date_to_ms';
const DATE_NOW = 'date_now';
const MS_TO_UNIT = 'ms_to_unit';
const PARSE_DATE = 'parse_date';
const FORMAT_DATE = 'format_date';
const CURRENT_DATE = 'current_date';
const CURRENT_USER = 'current_user';

export const enum MasterBlockType {
  Function = 'Function',
  Value = 'Value',
  Link = 'Link',
}

@Component({
  selector: 'blockly-editor',
  templateUrl: './blockly-editor.component.html',
  styleUrls: ['./blockly-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocklyEditorComponent implements AfterViewInit, OnDestroy {
  @Input()
  public collections: Collection[] = [];

  @Input()
  public linkTypes: LinkType[] = [];

  @Input()
  public variables: RuleVariable[] = [];

  @Input()
  public attribute: Attribute;

  @Input()
  public thisCollectionId: string;

  @Input()
  public thisLinkTypeId: string;

  @Input()
  public xml: string = '';

  @Input()
  public toolbox: string = '';

  @Input()
  public masterType: MasterBlockType = MasterBlockType.Function;

  @Output()
  public onJsUpdate = new EventEmitter<string>();

  @Output()
  public onXmlUpdate = new EventEmitter<string>();

  public blocklyId = String(Math.floor(Math.random() * 1000000000000000) + 1);

  public loading$ = new BehaviorSubject(true);

  private workspace: any;
  private lumeerVar: string;
  private initializing = false;
  private destroying = false;

  constructor(
    private store$: Store<AppState>,
    private route: ActivatedRoute,
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
      // in case the dialog got closed very quickly
      if (!this.destroying) {
        this.workspace = (window as any).Blockly.init(this.blocklyId, this.toolbox);
        setTimeout(() => {
          if (!this.destroying) {
            this.onResize();
            this.loading$.next(false);
            this.initBlockly();
          }
        }, 200);
      }
    }
  }

  @HostListener('window:resize')
  public onResize(): void {
    Blockly.svgResize(this.workspace);
    this.workspace.getAllBlocks().forEach(b => b.render());
  }

  public initBlockly() {
    this.initializing = true;
    this.registerCustomBlocks();

    this.workspace.addChangeListener(this.onWorkspaceChange.bind(this));

    this.workspace.registerToolboxCategoryCallback('DOCUMENT_VARIABLES', this.registerDocumentVariables.bind(this));
    this.workspace.registerToolboxCategoryCallback('LINKS', this.registerLinks.bind(this));
    this.workspace.registerToolboxCategoryCallback('DATES', this.registerDates.bind(this));

    if (this.xml) {
      // initiate from previously stored XML
      const dom: Element = Blockly.Xml.textToDom(this.xml);
      const vars = dom.getElementsByTagName('variable');
      for (let i = 0; i < vars.length; i++) {
        const varType = vars.item(i).attributes.getNamedItem('type').value;
        if (varType.endsWith(DOCUMENT_VAR_SUFFIX)) {
          this.ensureVariableTypeBlock(varType);
        }
        if (varType.endsWith(LINK_VAR_SUFFIX)) {
          this.ensureLinkInstanceVariableTypeBlock(varType);
        }
      }
      for (let i = 0; i < this.linkTypes.length; i++) {
        this.ensureLinkTypeBlock(this.linkTypes[i]);
        this.ensureLinkInstanceBlock(this.linkTypes[i]);
      }
      Blockly.Xml.domToWorkspace(dom, this.workspace);
      this.ensureTypeChecks();
    } else {
      // initiate empty state
      if (this.masterType === MasterBlockType.Function) {
        const containerBlock = this.workspace.newBlock(STATEMENT_CONTAINER);
        containerBlock.setDeletable(false);
        containerBlock.initSvg();
        containerBlock.render();
      } else if (this.masterType === MasterBlockType.Link) {
        const linkBlock = this.workspace.newBlock(LINK_CONTAINER);
        linkBlock.setDeletable(false);
        linkBlock.initSvg();
        linkBlock.render();
      } else {
        const valueBlock = this.workspace.newBlock(VALUE_CONTAINER);
        valueBlock.setDeletable(false);
        valueBlock.initSvg();
        valueBlock.render();
      }
    }

    // make sure we have all variables created (no matter how the workspace was initiated - either from XML or empty)
    this.variables.forEach(variable => {
      if (this.workspace.getVariable(variable.name) == null) {
        if (variable.collectionId) {
          this.workspace.createVariable(variable.name, variable.collectionId + DOCUMENT_VAR_SUFFIX, null);
        } else if (variable.linkTypeId) {
          this.workspace.createVariable(variable.name, variable.linkTypeId + LINK_VAR_SUFFIX, null);
        }
      }
    });
    setTimeout(() => {
      this.initializing = false;
    }, 500); // let the DOM to be parsed in their timeout
  }

  private registerCustomBlocks(): void {
    const coreCollectionVarTypes = this.variables
      .filter(variable => !!variable && variable.collectionId)
      .map(variable => variable.collectionId + DOCUMENT_VAR_SUFFIX);
    const coreLinkVarTypes = this.variables
      .filter(variable => !!variable && variable.linkTypeId)
      .map(variable => variable.linkTypeId + LINK_VAR_SUFFIX);
    const collectionTypes = this.collections.map(c => c.id + DOCUMENT_VAR_SUFFIX);
    const linkTypes = this.linkTypes.map(l => l.id + LINK_VAR_SUFFIX);
    const collection =
      this.masterType !== MasterBlockType.Link ? this.getCollection(this.variables[0].collectionId) : null;
    const linkType =
      this.masterType === MasterBlockType.Link || !collection ? this.getLinkType(this.variables[0].linkTypeId) : null;
    const attributeName = this.attribute ? this.attribute.name : collection ? collection.name : linkType.name;

    const this_ = this;
    if (this.masterType === MasterBlockType.Function) {
      if (collection) {
        Blockly.Blocks[STATEMENT_CONTAINER] = {
          init: function () {
            this.jsonInit({
              type: STATEMENT_CONTAINER,
              message0: '%{BKY_BLOCK_STATEMENT_CONTAINER}', // With record in %1 %2 %3 do %4
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
        Blockly.JavaScript[STATEMENT_CONTAINER] = function (block) {
          const lumeerVar = Blockly.JavaScript.variableDB_.getDistinctName('lumeer', Blockly.Variables.NAME_TYPE);
          this_.lumeerVar = lumeerVar;
          const code = 'var ' + lumeerVar + " = Polyglot.import('lumeer');\n";
          return code + Blockly.JavaScript.statementToCode(block, 'COMMANDS') + '\n';
        };
      }

      if (linkType) {
        Blockly.Blocks[STATEMENT_CONTAINER] = {
          init: function () {
            this.jsonInit({
              type: STATEMENT_CONTAINER,
              message0: '%{BKY_BLOCK_LINK_STATEMENT_CONTAINER}', // With record in %1%2 %3 %4 do %5
              args0: [
                {
                  type: 'field_fa',
                  icon: linkType.collections?.[0]?.icon,
                  iconColor: linkType.collections?.[0]?.color,
                },
                {
                  type: 'field_fa',
                  icon: linkType.collections?.[1]?.icon,
                  iconColor: linkType.collections?.[1]?.color,
                },
                {
                  type: 'field_label',
                  text: linkType.name,
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
        Blockly.JavaScript[STATEMENT_CONTAINER] = function (block) {
          const lumeerVar = Blockly.JavaScript.variableDB_.getDistinctName('lumeer', Blockly.Variables.NAME_TYPE);
          this_.lumeerVar = lumeerVar;
          const code = 'var ' + lumeerVar + " = Polyglot.import('lumeer');\n";
          return code + Blockly.JavaScript.statementToCode(block, 'COMMANDS') + '\n';
        };
      }
    } else if (this.masterType === MasterBlockType.Value || this.masterType === MasterBlockType.Link) {
      if (collection) {
        Blockly.Blocks[VALUE_CONTAINER] = {
          init: function () {
            this.jsonInit({
              type: VALUE_CONTAINER,
              message0: '%{BKY_BLOCK_VALUE_CONTAINER}', // %1 %2 = %3
              args0: [
                {
                  type: 'field_fa',
                  icon: collection.icon,
                  iconColor: collection.color,
                },
                {
                  type: 'field_label',
                  text: attributeName,
                },
                {
                  type: 'input_value',
                  name: 'VALUE',
                  check: ['', 'Number', 'String', 'Boolean', 'Colour'], // only regular variables - no fields or objects
                },
              ],
              colour: COLOR_DARK,
            });
          },
        };
        Blockly.JavaScript[VALUE_CONTAINER] = function (block) {
          const lumeerVar = Blockly.JavaScript.variableDB_.getDistinctName('lumeer', Blockly.Variables.NAME_TYPE);
          this_.lumeerVar = lumeerVar;
          const code = 'var ' + lumeerVar + " = Polyglot.import('lumeer');\n";
          const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_MEMBER) || null;

          if (!value) {
            return code;
          }

          return (
            code +
            '\n' +
            lumeerVar +
            '.setDocumentAttribute(' +
            'thisDocument' +
            ", '" +
            this_.attribute.id +
            "', " +
            value +
            ');' +
            '\n'
          );
        };
      }

      if (linkType) {
        Blockly.Blocks[LINK_CONTAINER] = {
          init: function () {
            this.jsonInit({
              type: LINK_CONTAINER,
              message0: '%{BKY_BLOCK_LINK_CONTAINER}', // %1%2 %3 = %4
              args0: [
                {
                  type: 'field_fa',
                  icon: linkType.collections?.[0]?.icon,
                  iconColor: linkType.collections?.[0]?.color,
                },
                {
                  type: 'field_fa',
                  icon: linkType.collections?.[1]?.icon,
                  iconColor: linkType.collections?.[1]?.color,
                },
                {
                  type: 'field_label',
                  text: attributeName,
                },
                {
                  type: 'input_value',
                  name: 'VALUE',
                  check: ['', 'Number', 'String', 'Boolean', 'Colour'], // only regular variables - no fields or objects
                },
              ],
              colour: COLOR_DARK,
            });
          },
        };

        Blockly.JavaScript[LINK_CONTAINER] = function (block) {
          const lumeerVar = Blockly.JavaScript.variableDB_.getDistinctName('lumeer', Blockly.Variables.NAME_TYPE);
          this_.lumeerVar = lumeerVar;
          const code = 'var ' + lumeerVar + " = Polyglot.import('lumeer');\n";
          const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_MEMBER) || null;

          if (!value) {
            return code;
          }

          return (
            code +
            '\n' +
            lumeerVar +
            '.setLinkAttribute(' +
            'thisLink' +
            ", '" +
            this_.attribute.id +
            "', " +
            value +
            ');' +
            '\n'
          );
        };
      }
    }

    Blockly.Blocks[FOREACH_DOCUMENT_ARRAY] = {
      init: function () {
        this.jsonInit({
          type: FOREACH_DOCUMENT_ARRAY,
          message0: '%{BKY_BLOCK_FOREACH_DOCUMENT}', // for each record %1 in %2
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
          message1: '%{BKY_BLOCK_FOREACH_DOCUMENT_DO}', // do this %1
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

    Blockly.Blocks[FOREACH_LINK_ARRAY] = {
      init: function () {
        this.jsonInit({
          type: FOREACH_LINK_ARRAY,
          message0: '%{BKY_BLOCK_FOREACH_LINK}', // for each link %1 in %2
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
          message1: '%{BKY_BLOCK_FOREACH_LINK_DO}', // do this %1
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
    Blockly.JavaScript[FOREACH_LINK_ARRAY] = Blockly.JavaScript['controls_forEach'];

    Blockly.Blocks[GET_ATTRIBUTE] = {
      init: function () {
        this.jsonInit({
          type: GET_ATTRIBUTE,
          message0: '%{BKY_BLOCK_GET_ATTRIBUTE}', // get %1 of %2
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
    Blockly.JavaScript[GET_ATTRIBUTE] = function (block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'DOCUMENT', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const attrId = block.getFieldValue('ATTR');

      if (!argument0) {
        return '';
      }

      const code = this_.lumeerVar + '.getDocumentAttribute(' + argument0 + ", '" + attrId + "')";

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    Blockly.Blocks[SET_ATTRIBUTE] = {
      init: function () {
        this.jsonInit({
          type: SET_ATTRIBUTE,
          message0: '%{BKY_BLOCK_SET_ATTRIBUTE}', // set %1 of %2 to %3
          args0: [
            {
              type: 'field_dropdown',
              name: 'ATTR',
              options: [['?', '?']],
            },
            {
              type: 'input_value',
              name: 'DOCUMENT',
              check: uniqueValues([...coreCollectionVarTypes, ...collectionTypes]),
            },
            {
              type: 'input_value',
              name: 'VALUE',
              check: ['', 'Number', 'String', 'Boolean', 'Colour'], // only regular variables
            },
          ],
          previousStatement: null,
          nextStatement: null,
          colour: COLOR_GREEN,
        });
      },
    };
    Blockly.JavaScript[SET_ATTRIBUTE] = function (block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'DOCUMENT', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const argument1 = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const attrId = block.getFieldValue('ATTR');

      if (!argument0 || !argument1) {
        return '';
      }

      const code = this_.lumeerVar + '.setDocumentAttribute(' + argument0 + ", '" + attrId + "', " + argument1 + ');\n';

      return code;
    };

    Blockly.Blocks[GET_LINK_ATTRIBUTE] = {
      init: function () {
        this.jsonInit({
          type: GET_LINK_ATTRIBUTE,
          message0: '%{BKY_BLOCK_GET_LINK_ATTRIBUTE}', // get %1 of link %2
          args0: [
            {
              type: 'field_dropdown',
              name: 'ATTR',
              options: [['?', '?']],
            },
            {
              type: 'input_value',
              name: 'LINK',
            },
          ],
          output: '',
          colour: COLOR_PRIMARY,
          tooltip: '',
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[GET_LINK_ATTRIBUTE] = function (block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'LINK', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const attrId = block.getFieldValue('ATTR');

      if (!argument0) {
        return '';
      }

      const code = this_.lumeerVar + '.getLinkAttribute(' + argument0 + ", '" + attrId + "')";

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    Blockly.Blocks[SET_LINK_ATTRIBUTE] = {
      init: function () {
        this.jsonInit({
          type: SET_LINK_ATTRIBUTE,
          message0: '%{BKY_BLOCK_SET_LINK_ATTRIBUTE}', // set %1 of link %2 to %3
          args0: [
            {
              type: 'field_dropdown',
              name: 'ATTR',
              options: [['?', '?']],
            },
            {
              type: 'input_value',
              name: 'LINK',
              check: uniqueValues([...coreLinkVarTypes, ...linkTypes]),
            },
            {
              type: 'input_value',
              name: 'VALUE',
              check: ['', 'Number', 'String', 'Boolean', 'Colour'], // only regular variables
            },
          ],
          previousStatement: null,
          nextStatement: null,
          colour: COLOR_PRIMARY,
        });
      },
    };
    Blockly.JavaScript[SET_LINK_ATTRIBUTE] = function (block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'LINK', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const argument1 = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const attrId = block.getFieldValue('ATTR');

      if (!argument0 || !argument1) {
        return '';
      }

      const code = this_.lumeerVar + '.setLinkAttribute(' + argument0 + ", '" + attrId + "', " + argument1 + ');\n';

      return code;
    };

    Blockly.Blocks[GET_LINK_DOCUMENT] = {
      init: function () {
        this.jsonInit({
          type: GET_LINK_DOCUMENT,
          message0: '%{BKY_BLOCK_GET_LINK_DOCUMENT}', // record from %1 linked via %2
          args0: [
            {
              type: 'field_dropdown',
              name: 'COLLECTION',
              options: [['?', '?']],
            },
            {
              type: 'input_value',
              name: 'LINK',
              check: uniqueValues([...coreLinkVarTypes, ...linkTypes]),
            },
          ],
          colour: COLOR_PRIMARY,
          output: UNKNOWN,
        });
      },
    };
    Blockly.JavaScript[GET_LINK_DOCUMENT] = function (block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'LINK', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const collectionId = block.getFieldValue('COLLECTION');

      if (!argument0) {
        return '';
      }

      const code = this_.lumeerVar + '.getLinkDocument(' + argument0 + ", '" + collectionId + "'" + ')';

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    Blockly.Blocks[DATE_TO_MS] = {
      init: function () {
        this.jsonInit({
          type: DATE_TO_MS,
          message0: '%{BKY_BLOCK_DATE_TO_MS}', // date to millis %1
          args0: [
            {
              type: 'input_value',
              name: 'DATE',
            },
          ],
          output: '',
          colour: COLOR_PINK,
          tooltip: '',
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[DATE_TO_MS] = function (block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'DATE', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;

      if (!argument0) {
        return '';
      }

      const code = '((' + argument0 + ') ? (' + argument0 + ').getTime() : 0)';

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    Blockly.Blocks[MS_TO_DATE] = {
      init: function () {
        this.jsonInit({
          type: MS_TO_DATE,
          message0: '%{BKY_BLOCK_MS_TO_DATE}', // millis to date %1
          args0: [
            {
              type: 'input_value',
              name: 'MS',
            },
          ],
          output: '',
          colour: COLOR_PINK,
          tooltip: '',
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[MS_TO_DATE] = function (block) {
      const argument0 = Blockly.JavaScript.valueToCode(block, 'MS', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;

      if (!argument0) {
        return '';
      }

      const code = '(new Date(' + argument0 + ')).toISOString()';

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    Blockly.Blocks[DATE_NOW] = {
      init: function () {
        this.jsonInit({
          type: DATE_NOW,
          message0: '%{BKY_BLOCK_DATE_NOW}', // now
          output: '',
          colour: COLOR_PINK,
          tooltip: '',
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[DATE_NOW] = function (block) {
      const code = '(+(new Date()))';

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    Blockly.Blocks[CURRENT_DATE] = {
      init: function () {
        this.jsonInit({
          type: CURRENT_DATE,
          message0: '%{BKY_BLOCK_CURRENT_DATE}', // current date
          output: '',
          colour: COLOR_PINK,
          tooltip: '',
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[CURRENT_DATE] = function (block) {
      const code = '(new Date())';

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    Blockly.Blocks[PARSE_DATE] = {
      init: function () {
        this.jsonInit({
          type: PARSE_DATE,
          message0: '%{BKY_BLOCK_PARSE_DATE}', // parse date string %1 formatted as %2 with locale %3
          args0: [
            {
              type: 'input_value',
              name: 'DATE',
            },
            {
              type: 'input_value',
              name: 'FORMAT',
            },
            {
              type: 'input_value',
              name: 'LOCALE',
            },
          ],
          inputsInline: true,
          output: '',
          colour: COLOR_PINK,
          tooltip: '',
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[PARSE_DATE] = function (block) {
      const argumentDate = Blockly.JavaScript.valueToCode(block, 'DATE', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const argumentFormat =
        Blockly.JavaScript.valueToCode(block, 'FORMAT', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const argumentLocale =
        Blockly.JavaScript.valueToCode(block, 'LOCALE', Blockly.JavaScript.ORDER_ASSIGNMENT) || 'en';

      if (!argumentDate || !argumentFormat) {
        return '';
      }

      const code = 'parseMomentJsDate(' + argumentDate + ', ' + argumentFormat + ', ' + argumentLocale + ')';

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    Blockly.Blocks[FORMAT_DATE] = {
      init: function () {
        this.jsonInit({
          type: FORMAT_DATE,
          message0: '%{BKY_BLOCK_FORMAT_DATE}', // format date %1 using format %2 and locale %3
          args0: [
            {
              type: 'input_value',
              name: 'TIME',
            },
            {
              type: 'input_value',
              name: 'FORMAT',
            },
            {
              type: 'input_value',
              name: 'LOCALE',
            },
          ],
          inputsInline: true,
          output: '',
          colour: COLOR_PINK,
          tooltip: '',
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[FORMAT_DATE] = function (block) {
      const argumentTime = Blockly.JavaScript.valueToCode(block, 'TIME', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const argumentFormat =
        Blockly.JavaScript.valueToCode(block, 'FORMAT', Blockly.JavaScript.ORDER_ASSIGNMENT) || null;
      const argumentLocale =
        Blockly.JavaScript.valueToCode(block, 'LOCALE', Blockly.JavaScript.ORDER_ASSIGNMENT) || 'en';

      if (!argumentTime || !argumentFormat) {
        return '';
      }

      const code = 'formatMomentJsDate(' + argumentTime + ', ' + argumentFormat + ', ' + argumentLocale + ')';

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    Blockly.Blocks[CURRENT_USER] = {
      init: function () {
        this.jsonInit({
          type: CURRENT_USER,
          message0: '%{BKY_BLOCK_CURRENT_USER}', // current user
          output: '',
          colour: COLOR_CYAN,
          tooltip: '',
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[CURRENT_USER] = function (block) {
      const code = this_.lumeerVar + '.getCurrentUser()';

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    Blockly.Blocks[MS_TO_UNIT] = {
      init: function () {
        this.jsonInit({
          type: MS_TO_UNIT,
          message0: '%{BKY_BLOCK_DATE_MILLIS_TO_UNIT}', // milliseconds to %1 %2
          args0: [
            {
              type: 'field_dropdown',
              name: 'UNIT',
              options: [
                [Blockly.Msg['SEQUENCE_OPTIONS_DAYS'], 'DAYS'],
                [Blockly.Msg['SEQUENCE_OPTIONS_HOURS'], 'HOURS'],
                [Blockly.Msg['SEQUENCE_OPTIONS_MINUTES'], 'MINUTES'],
                [Blockly.Msg['SEQUENCE_OPTIONS_SECONDS'], 'SECONDS'],
              ],
            },
            {
              type: 'input_value',
              name: 'MS',
              check: 'Number',
            },
          ],
          output: 'Number',
          colour: COLOR_PINK,
          tooltip: '',
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[MS_TO_UNIT] = function (block) {
      const dropdown_unit = block.getFieldValue('UNIT');
      const value_ms = Blockly.JavaScript.valueToCode(block, 'MS', Blockly.JavaScript.ORDER_ATOMIC);
      let code = '(' + value_ms + '/';

      switch (dropdown_unit) {
        case 'SECONDS':
          code += '1000)';
          break;
        case 'MINUTES':
          code += '60000)';
          break;
        case 'HOURS':
          code += '3600000)';
          break;
        case 'DAYS':
          code += '86400000)';
          break;
      }

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    Blockly.Blocks[SEQUENCE_BLOCK] = {
      init: function () {
        this.jsonInit({
          type: SEQUENCE_BLOCK,
          message0: '%{BKY_BLOCK_SEQUENCE_NEXT}', // next no. from %1 align to %2 digit(s)
          args0: [
            {
              type: 'field_input',
              name: 'SEQUENCE',
              text: 'sequenceName',
            },
            {
              type: 'field_number',
              name: 'DIGITS',
              value: 1,
              min: 1,
              maximum: 99,
            },
          ],
          output: 'String',
          colour: COLOR_CYAN,
          tooltip: '',
          helpUrl: '',
        });
      },
    };
    Blockly.JavaScript[SEQUENCE_BLOCK] = function (block) {
      const sequence = block.getFieldValue('SEQUENCE');
      const digits = block.getFieldValue('DIGITS');

      const code = this_.lumeerVar + ".getSequenceNumber('" + sequence + "', " + digits + ')';

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }

  private getLinkParts(linkBlockType: string): string[] {
    return linkBlockType.split('-', 2)[1].split('_');
  }

  private getLinkInstanceType(linkBlockType: string): string {
    return linkBlockType.split('-', 2)[0];
  }

  private ensureTypeChecks(): void {
    // first fix variables and links
    this.workspace.getAllBlocks(false).forEach(block => {
      const children = block.getChildren(false);
      this.preventDeletionOfInitialVariables(block);

      // set output type of all links
      if (block.type.endsWith(LINK_TYPE_BLOCK_SUFFIX)) {
        if (children && children.length > 0) {
          const child = children[0];
          const childType = child.type.replace(DOCUMENT_VAR_SUFFIX, '').replace(VARIABLES_GET_PREFIX, '');
          const linkParts = this.getLinkParts(block.type);
          const counterpart = linkParts[0] === childType ? linkParts[1] : linkParts[0];
          block.setOutput(true, counterpart + DOCUMENT_ARRAY_TYPE_SUFFIX);
        }
      }

      // get link instance document
      if (block.type === GET_LINK_DOCUMENT) {
        if (children && children.length > 0) {
          const child = children[0];
          const childOutputType = this.getOutputConnectionCheck(child);

          if (childOutputType.endsWith(LINK_VAR_SUFFIX)) {
            const value = block.getField('COLLECTION').getValue();
            this.setLinkDocumentOutputType(block, child);
            block.getField('COLLECTION').setValue(value);
          }
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
          const childOutputType = this.getOutputConnectionCheck(child);

          if (childOutputType.endsWith(DOCUMENT_VAR_SUFFIX) || childOutputType.endsWith(DOCUMENT_ARRAY_TYPE_SUFFIX)) {
            const value = block.getField('ATTR').getValue();
            this.setterAndGetterOutputType(block, child, true);
            block.getField('ATTR').setValue(value);
          }
        }
      }

      // link instance getters and setters
      if (block.type === GET_LINK_ATTRIBUTE || block.type === SET_LINK_ATTRIBUTE) {
        if (children && children.length > 0) {
          const child = children[0];
          const childOutputType = this.getOutputConnectionCheck(child);

          if (childOutputType.endsWith(LINK_VAR_SUFFIX) || childOutputType.endsWith(LINK_TYPE_ARRAY_SUFFIX)) {
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
          const childOutputType = this.getOutputConnectionCheck(child);

          if (childOutputType.endsWith(DOCUMENT_ARRAY_TYPE_SUFFIX)) {
            const newType = childOutputType.replace(ARRAY_TYPE_SUFFIX, '');
            this.updateVariableType(this.workspace, block.getField('VAR').getVariable(), newType);
            block.getField('VAR').setTypes_([newType], newType);
          }
        }
      }

      // link foreach cycle
      if (block.type === FOREACH_LINK_ARRAY) {
        if (children && children.length > 0) {
          const child = children[0];
          const childOutputType = this.getOutputConnectionCheck(child);

          if (childOutputType.endsWith(LINK_TYPE_ARRAY_SUFFIX)) {
            const newType = childOutputType.replace(LINK_TYPE_ARRAY_SUFFIX, LINK_VAR_SUFFIX);
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

  private setLinkDocumentOutputType(parentBlock: any, block: any) {
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

    parentBlock.outputConnection.check_ = firstCollectionId + DOCUMENT_VAR_SUFFIX;
  }

  private getOutputConnectionCheck(block: any): string {
    if (block.outputConnection && block.outputConnection.check_) {
      return isArray(block.outputConnection.check_) ? block.outputConnection.check_[0] : block.outputConnection.check_;
    }

    return '';
  }

  private setterAndGetterOutputType(parentBlock: any, block: any, skipDisconnect = false) {
    const options = parentBlock.getField('ATTR').getOptions();
    const originalLength = options.length;
    const blockOutputType = this.getOutputConnectionCheck(block);

    let attributes: Attribute[];
    let defaultAttributeId = '';
    if (parentBlock.type === GET_LINK_ATTRIBUTE || parentBlock.type === SET_LINK_ATTRIBUTE) {
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

    if (parentBlock.type === GET_ATTRIBUTE || parentBlock.type === GET_LINK_ATTRIBUTE) {
      const newType =
        block.type.endsWith(LINK_TYPE_BLOCK_SUFFIX) || block.type.endsWith(LINK_INSTANCE_BLOCK_SUFFIX)
          ? ['Array']
          : ['', 'Number', 'String', 'Boolean', 'Colour'];
      const parentBlockOutputType = this.getOutputConnectionCheck(parentBlock);
      if (!skipDisconnect && parentBlockOutputType !== newType[0]) {
        this.tryDisconnect(parentBlock, parentBlock.outputConnection);
      }
      parentBlock.outputConnection.check_ = newType;
    }
  }

  private onWorkspaceChange(changeEvent): void {
    const workspace = this.workspace;

    if (changeEvent instanceof Blockly.Events.Create) {
      const mainBlock = workspace.getBlockById(changeEvent.blockId);

      // make sure the default blocks do not offer documents etc in variable dropdowns
      this.ensureEmptyTypes(mainBlock);

      // prevent deletion of the initial variables
      this.preventDeletionOfInitialVariables(mainBlock);

      if (mainBlock.type === GET_ATTRIBUTE || mainBlock.type === GET_LINK_ATTRIBUTE) {
        mainBlock.outputConnection.check_ = [UNKNOWN];
      }

      if (!this.initializing && changeEvent.ids) {
        changeEvent.ids.forEach(newBlockId => {
          const block = workspace.getBlockById(newBlockId);

          if (block.type === GET_ATTRIBUTE || block.type === SET_ATTRIBUTE) {
            const link = block.getInput('DOCUMENT');

            if (link.connection && link.connection.targetConnection) {
              const linkedBlock = link.connection.targetConnection.getSourceBlock();
              const blockOutputType = this.getOutputConnectionCheck(linkedBlock);

              if (
                linkedBlock &&
                (blockOutputType.endsWith(DOCUMENT_VAR_SUFFIX) || blockOutputType.endsWith(DOCUMENT_ARRAY_TYPE_SUFFIX))
              ) {
                this.setterAndGetterOutputType(block, linkedBlock);
              }
            }
          }

          if (block.type === GET_LINK_ATTRIBUTE || block.type === SET_LINK_ATTRIBUTE) {
            const link = block.getInput('LINK');

            if (link.connection && link.connection.targetConnection) {
              const linkedBlock = link.connection.targetConnection.getSourceBlock();
              const blockOutputType = this.getOutputConnectionCheck(linkedBlock);

              if (
                linkedBlock &&
                (blockOutputType.endsWith(LINK_VAR_SUFFIX) || blockOutputType.endsWith(LINK_TYPE_ARRAY_SUFFIX))
              ) {
                this.setterAndGetterOutputType(block, linkedBlock);
              }
            }
          }

          if (block.type === GET_LINK_DOCUMENT) {
            const link = block.getInput('LINK');

            if (link.connection && link.connection.targetConnection) {
              const linkedBlock = link.connection.targetConnection.getSourceBlock();
              const blockOutputType = this.getOutputConnectionCheck(linkedBlock);

              if (linkedBlock && blockOutputType.endsWith(LINK_VAR_SUFFIX)) {
                this.setLinkDocumentOutputType(block, linkedBlock);
              }
            }
          }
        });
      }
    }

    // change output type in getter of linked document from link instance
    if (changeEvent instanceof Blockly.Events.Change) {
      const block = workspace.getBlockById(changeEvent.blockId);

      if (block.type === GET_LINK_DOCUMENT && changeEvent.element === 'field' && changeEvent.name === 'COLLECTION') {
        block.outputConnection.check_ = changeEvent.newValue + DOCUMENT_VAR_SUFFIX;

        if (block.outputConnection.targetConnection) {
          const linkedBlock = block.outputConnection.targetConnection.getSourceBlock();

          if (linkedBlock) {
            this.setterAndGetterOutputType(linkedBlock, block);
          }
        }
      }
    }

    if (changeEvent.newParentId) {
      // is there a new connection made?
      const block = workspace.getBlockById(changeEvent.blockId);
      const blockOutputType = this.getOutputConnectionCheck(block);
      const parentBlock = workspace.getBlockById(changeEvent.newParentId);

      // is it a document being connected to ...
      if (blockOutputType.endsWith(DOCUMENT_VAR_SUFFIX)) {
        // ...a link?
        if (parentBlock.type.endsWith(LINK_TYPE_BLOCK_SUFFIX)) {
          // set the output type to the opposite of what is connected on the input (links are symmetric)
          const linkParts = this.getLinkParts(parentBlock.type);
          const counterpart =
            linkParts[0] === blockOutputType.replace(DOCUMENT_VAR_SUFFIX, '') ? linkParts[1] : linkParts[0];
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

      // disconnect invalid foreach input
      if (parentBlock.type === FOREACH_LINK_ARRAY) {
        if (parentBlock.getInput('LIST').connection.targetConnection.sourceBlock_.id === block.id) {
          if (!blockOutputType.endsWith(LINK_TYPE_ARRAY_SUFFIX)) {
            parentBlock.getInput('LIST').connection.disconnect();
          } else {
            // otherwise set a correct type of the cycle variable
            const newType = blockOutputType.replace(LINK_TYPE_ARRAY_SUFFIX, LINK_VAR_SUFFIX);
            this.updateVariableType(workspace, parentBlock.getField('VAR').getVariable(), newType);
            parentBlock.getField('VAR').setTypes_([newType], newType);
          }
        }
      }

      // populate document attribute names in document attr getter and setter
      if (parentBlock.type === GET_ATTRIBUTE || parentBlock.type === SET_ATTRIBUTE) {
        if (blockOutputType.endsWith(DOCUMENT_VAR_SUFFIX) || blockOutputType.endsWith(DOCUMENT_ARRAY_TYPE_SUFFIX)) {
          this.setterAndGetterOutputType(parentBlock, block);
        } else {
          const document = parentBlock.getInput('DOCUMENT');
          if (
            document.connection &&
            document.connection.targetConnection &&
            document.connection.targetConnection.getSourceBlock().id === block.id
          ) {
            this.tryDisconnect(parentBlock, document.connection);
          }
        }
      }
      // populate document attribute names in document attr getter and setter
      if (parentBlock.type === GET_LINK_ATTRIBUTE || parentBlock.type === SET_LINK_ATTRIBUTE) {
        if (blockOutputType.endsWith(LINK_VAR_SUFFIX) || blockOutputType.endsWith(LINK_TYPE_ARRAY_SUFFIX)) {
          this.setterAndGetterOutputType(parentBlock, block);
        } else {
          const link = parentBlock.getInput('LINK');
          if (
            link.connection &&
            link.connection.targetConnection &&
            link.connection.targetConnection.getSourceBlock().id === block.id
          ) {
            this.tryDisconnect(parentBlock, link.connection);
          }
        }
      }

      // populate collections in getter of linked document from link instance
      if (parentBlock.type === GET_LINK_DOCUMENT) {
        if (blockOutputType.endsWith(LINK_VAR_SUFFIX)) {
          this.setLinkDocumentOutputType(parentBlock, block);
        }
      }
    } else if (changeEvent.oldParentId) {
      // reset output type and disconnect when linked document is removed
      const block = workspace.getBlockById(changeEvent.blockId);
      if (block) {
        // when replacing a shadow block, the original block might not exist anymore
        const blockOutputType = this.getOutputConnectionCheck(block);
        const parentBlock = workspace.getBlockById(changeEvent.oldParentId);

        if (parentBlock) {
          // document being removed from link
          if (blockOutputType.endsWith(DOCUMENT_VAR_SUFFIX)) {
            if (parentBlock.type.endsWith(LINK_TYPE_BLOCK_SUFFIX) && parentBlock.outputConnection) {
              parentBlock.setOutput(true, UNKNOWN);
              this.tryDisconnect(parentBlock, parentBlock.outputConnection);
            }
          }

          // document or link being removed from attr getter
          if (blockOutputType.endsWith(DOCUMENT_VAR_SUFFIX) || blockOutputType.endsWith(LINK_TYPE_BLOCK_SUFFIX)) {
            if (parentBlock.type === GET_ATTRIBUTE && parentBlock.outputConnection) {
              parentBlock.setOutput(true, UNKNOWN);
              this.tryDisconnect(parentBlock, parentBlock.outputConnection);
            }
          }

          // reset list of attributes upon disconnection
          if (parentBlock.type === GET_ATTRIBUTE || parentBlock.type === GET_LINK_ATTRIBUTE) {
            this.resetOptions(parentBlock, 'ATTR');
          }

          // reset list of attributes upon disconnection
          if (
            (parentBlock.type === SET_ATTRIBUTE &&
              parentBlock.getInput('DOCUMENT').connection.targetConnection === null) ||
            (parentBlock.type === SET_LINK_ATTRIBUTE &&
              parentBlock.getInput('LINK').connection.targetConnection === null)
          ) {
            this.resetOptions(parentBlock, 'ATTR');
          }

          // reset list of collections upon disconnection
          if (
            parentBlock.type === GET_LINK_DOCUMENT &&
            parentBlock.getInput('COLLECTION').connection.targetConnection === null
          ) {
            parentBlock.setOutput(true, UNKNOWN);
            this.resetOptions(parentBlock, 'COLLECTION');
          }
        }
      }
    }

    // render new state
    this.generateXml();
    this.generateJs();
  }

  private resetOptions(block: any, field: string): void {
    const options = block.getField(field).getOptions();
    const originalLength = options.length;
    block.getField(field).setValue('?');
    options.push(['?', '?']);
    options.splice(0, originalLength);
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
      if (variable.type.endsWith(DOCUMENT_VAR_SUFFIX)) {
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
    if (this.masterType === MasterBlockType.Function) {
      xmlList.push(Blockly.Xml.textToDom('<xml><block type="' + SET_ATTRIBUTE + '"></block></xml>').firstChild);
    }

    return xmlList;
  }

  private registerLinkInstanceVariables(workspace): any[] {
    const xmlList = [];

    workspace.getAllVariables().forEach(variable => {
      if (variable.type.endsWith(LINK_VAR_SUFFIX)) {
        this.ensureLinkInstanceVariableTypeBlock(variable.type);
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

    return xmlList;
  }

  private getCollection(id: string): Collection {
    return this.collections.find(collection => collection.id === id);
  }

  private getLinkType(id: string): LinkType {
    const currentLinkType = this.linkTypes?.find(linkType => linkType.id === id);
    const collections = this.collections?.filter(c => currentLinkType.collectionIds.indexOf(c.id) >= 0);
    if (collections?.length === 2) {
      return {...currentLinkType, collections: [collections[0], collections[1]]};
    }

    return currentLinkType;
  }

  private ensureVariableTypeBlock(type: string): void {
    if (!Blockly.Blocks[VARIABLES_GET_PREFIX + type]) {
      const collection = this.getCollection(type.replace(DOCUMENT_VAR_SUFFIX, ''));

      const this_ = this;
      Blockly.Blocks[VARIABLES_GET_PREFIX + type] = {
        init: function () {
          this.jsonInit({
            type: VARIABLES_GET_PREFIX + type,
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
      Blockly.JavaScript[VARIABLES_GET_PREFIX + type] = Blockly.JavaScript['variables_get'];
    }
  }

  private ensureLinkInstanceVariableTypeBlock(type: string): void {
    if (!Blockly.Blocks[VARIABLES_GET_PREFIX + type]) {
      const linkType = this.getLinkType(type.replace(LINK_VAR_SUFFIX, ''));
      const c1 = this.getCollection(linkType.collectionIds[0]);
      const c2 = this.getCollection(linkType.collectionIds[1]);

      Blockly.Blocks[VARIABLES_GET_PREFIX + type] = {
        init: function () {
          this.jsonInit({
            type: VARIABLES_GET_PREFIX + type,
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
      Blockly.JavaScript[VARIABLES_GET_PREFIX + type] = Blockly.JavaScript['variables_get'];
    }
  }

  private getBlocklyLinkType(linkType: LinkType): string {
    return linkType.id + '-' + linkType.collectionIds[0] + '_' + linkType.collectionIds[1] + LINK_TYPE_BLOCK_SUFFIX;
  }

  private getBlocklyLinkInstance(linkType: LinkType): string {
    return linkType.id + '-' + linkType.collectionIds[0] + '_' + linkType.collectionIds[1] + LINK_INSTANCE_BLOCK_SUFFIX;
  }

  private registerLinks(workspace): any[] {
    const xmlList = this.registerLinkInstanceVariables(workspace);

    if (xmlList.length) {
      xmlList.push(Blockly.Xml.textToDom('<xml><sep gap="48"></sep></xml>').firstChild);
    }

    xmlList.push(Blockly.Xml.textToDom('<xml><block type="' + GET_LINK_ATTRIBUTE + '"></block></xml>').firstChild);
    if (this.masterType === MasterBlockType.Function) {
      xmlList.push(Blockly.Xml.textToDom('<xml><block type="' + SET_LINK_ATTRIBUTE + '"></block></xml>').firstChild);
    }
    xmlList.push(Blockly.Xml.textToDom('<xml><block type="' + GET_LINK_DOCUMENT + '"></block></xml>').firstChild);

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

  private registerDates(workspace): any[] {
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

  private ensureLinkTypeBlock(linkType: LinkType) {
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
                  linkType.collectionIds[0] + DOCUMENT_VAR_SUFFIX,
                  linkType.collectionIds[1] + DOCUMENT_VAR_SUFFIX,
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

  private ensureLinkInstanceBlock(linkType: LinkType) {
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
                  linkType.collectionIds[0] + DOCUMENT_VAR_SUFFIX,
                  linkType.collectionIds[1] + DOCUMENT_VAR_SUFFIX,
                ],
              },
            ],
            output: linkType.id + LINK_TYPE_ARRAY_SUFFIX,
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
  private shadeColor(color: string, percent: number): string {
    return shadeColor(color, percent);
  }

  // bridge for functions running outside of ng zone
  private contrastColor(color?: string, dark?: string, light?: string): string {
    return color ? this.contrastColorPipe.transform(color, {dark, light}) : dark ? dark : COLOR_PRIMARY;
  }

  private generateXml(): void {
    const xml = Blockly.Xml.domToPrettyText(Blockly.Xml.workspaceToDom(this.workspace));
    this.onXmlUpdate.emit(xml);
  }

  private generateJs(): void {
    let js = Blockly.JavaScript.workspaceToCode(this.workspace);

    if (this.emptyJs(js)) {
      js = '';
    } else {
      if (this.masterType === MasterBlockType.Value && js.indexOf('var thisDocument;') < 0) {
        js = 'var thisDocument;\n' + js;
      }

      if (this.masterType === MasterBlockType.Link && js.indexOf('var thisLink;') < 0) {
        js = 'var thisLink;\n' + js;
      }
    }

    this.onJsUpdate.emit(js);
  }

  private emptyJs(js: string): boolean {
    const clean = js.replace(/var.* = Polyglot\.import\('lumeer'\);/g, '').trim();

    return clean.length === 0;
  }

  public ngOnDestroy(): void {
    // resiliency to quick dialog close
    this.destroying = true;
    if (this.workspace) {
      this.workspace.dispose();
    }
  }
}
