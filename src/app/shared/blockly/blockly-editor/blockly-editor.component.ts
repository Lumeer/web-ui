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
import {COLOR_DARK} from '../../../core/constants';
import {Attribute, Collection} from '../../../core/store/collections/collection';
import {LinkType} from '../../../core/store/link-types/link.type';
import {RuleVariable} from '../rule-variable-type';
import {AppState} from '../../../core/store/app.state';
import {ContrastColorPipe} from '../../pipes/contrast-color.pipe';
import {BlocklyService} from '../../../core/service/blockly.service';
import {BehaviorSubject} from 'rxjs';
import {BlocklyUtils, MasterBlockType} from './blockly-utils';
import {isNotNullOrUndefined, isNullOrUndefined} from '../../utils/common.utils';
import {CreateDocumentBlocklyComponent} from './blocks/create-document-blockly-component';
import {ForEachDocumentArrayBlocklyComponent} from './blocks/for-each-document-array-blockly-component';
import {ForEachLinkArrayBlocklyComponent} from './blocks/for-each-link-array-blockly-component';
import {SetAttributeBlocklyComponent} from './blocks/set-attribute-blockly-component';
import {GetAttributeBlocklyComponent} from './blocks/get-attribute-blockly-component';
import {SetLinkAttributeBlocklyComponent} from './blocks/set-link-attribute-blockly-component';
import {GetLinkAttributeBlocklyComponent} from './blocks/get-link-attribute-blockly-component';
import {MsToDateBlocklyComponent} from './blocks/ms-to-date-blockly-component';
import {DateToMsBlocklyComponent} from './blocks/date-to-ms-blockly-component';
import {GetLinkDocumentBlocklyComponent} from './blocks/get-link-document-blockly-component';
import {FormatDateBlocklyComponent} from './blocks/format-date-blockly-component';
import {ParseDateBlocklyComponent} from './blocks/parse-date-blockly-component';
import {CurrentDateBlocklyComponent} from './blocks/current-date-blockly-component';
import {DateNowBlocklyComponent} from './blocks/date-now-blockly-component';
import {SequenceBlocklyComponent} from './blocks/sequence-blockly-component';
import {MsToUnitBlocklyComponent} from './blocks/ms-to-unit-blockly-component';
import {CurrentUserBlocklyComponent} from './blocks/current-user-blockly-component';
import {DateNowMsBlocklyComponent} from './blocks/date-now-ms-blockly-component';
import {CurrentLocaleBlocklyComponent} from './blocks/current-locale-blockly-component';
import {ShowMessageBlocklyComponent} from './blocks/show-message-blockly-component';
import {DateToIsoBlocklyComponent} from './blocks/date-to-iso-blockly-component';
import {DateChangeBlocklyComponent} from './blocks/date-change-blockly-component';
import {IsEmptyBlocklyComponent} from './blocks/is-empty-blockly-component';
import {IsNotEmptyBlocklyComponent} from './blocks/is-not-empty-blockly-component';
import {IsoToDateBlocklyComponent} from './blocks/iso-to-date-blockly-component';
import {ShiftDateOfBlocklyComponent} from './blocks/shift-date-of-blockly-component';
import {IsoToMsBlocklyComponent} from './blocks/iso-to-ms-blockly-component';
import {PrintAttributeBlocklyComponent} from './blocks/print-attribute-blockly-component';
import {StringReplaceBlocklyComponent} from './blocks/string-replace-blockly-component';
import {DeleteDocumentBlocklyComponent} from './blocks/delete-document-blockly-component';
import {LinkDocumentsNoReturnBlocklyComponent} from './blocks/link-documents-no-return-blockly-component';
import {LinkDocumentsReturnBlocklyComponent} from './blocks/link-documents-return-blockly-component';
import {View} from '../../../core/store/views/view';
import {ReadDocumentsBlocklyComponent} from './blocks/read-documents-blockly-component';
import {SendEmailBlocklyComponent} from './blocks/send-email-blockly-component';
import {NavigateBlocklyComponent} from './blocks/navigate-blockly-component';
import {GetSiblingsBlocklyComponent} from './blocks/get-siblings-blockly-component';
import {GetParentDocumentBlocklyComponent} from './blocks/get-parent-document-blockly-component';
import {GetChildDocumentsBlocklyComponent} from './blocks/get-child-documents-blockly-component';
import {GetHierarchySiblingsBlocklyComponent} from './blocks/get-hierarchy-siblings-blockly-component';
import {LoopBreakBlocklyComponent} from './blocks/loop-break-blockly-component';
import {LoopContinueBlocklyComponent} from './blocks/loop-continue-blockly-component';
import {EscapeHtmlBlocklyComponent} from './blocks/escape-html-blockly-component';
import {UnescapeHtmlBlocklyComponent} from './blocks/unescape-html-blockly-component';
import {PrintTextBlocklyComponent} from './blocks/print-text-blockly-component';
import {FormatCurrencyBlocklyComponent} from './blocks/format-currency-blockly-component';
import {TranslationService} from '../../../core/service/translation.service';

declare var Blockly: any;

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
  public views: View[] = [];

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
  private initializing = false;
  private destroying = false;
  private blocklyUtils = new BlocklyUtils(null, [], [], [], []);

  constructor(
    private store$: Store<AppState>,
    private route: ActivatedRoute,
    private contrastColorPipe: ContrastColorPipe,
    private blocklyService: BlocklyService,
    private renderer2: Renderer2,
    @Inject(DOCUMENT) private document,
    private translationService: TranslationService
  ) {}

  public ngAfterViewInit(): void {
    const lumeerVar = this.blocklyUtils?.getLumeerVariable() || null;
    this.blocklyUtils = new BlocklyUtils(this.masterType, this.collections, this.linkTypes, this.views, this.variables);
    if (isNotNullOrUndefined(lumeerVar)) {
      this.blocklyUtils.setLumeerVariable(lumeerVar);
    }
    this.blocklyUtils.registerComponents([
      new CreateDocumentBlocklyComponent(this.blocklyUtils),
      new ForEachDocumentArrayBlocklyComponent(this.blocklyUtils),
      new ForEachLinkArrayBlocklyComponent(this.blocklyUtils),
      new GetAttributeBlocklyComponent(this.blocklyUtils),
      new SetAttributeBlocklyComponent(this.blocklyUtils),
      new GetLinkAttributeBlocklyComponent(this.blocklyUtils),
      new SetLinkAttributeBlocklyComponent(this.blocklyUtils),
      new GetLinkDocumentBlocklyComponent(this.blocklyUtils),
      new DateChangeBlocklyComponent(this.blocklyUtils),
      new DateToMsBlocklyComponent(this.blocklyUtils),
      new MsToDateBlocklyComponent(this.blocklyUtils),
      new DateToIsoBlocklyComponent(this.blocklyUtils),
      new DateNowBlocklyComponent(this.blocklyUtils),
      new DateNowMsBlocklyComponent(this.blocklyUtils),
      new CurrentDateBlocklyComponent(this.blocklyUtils),
      new ParseDateBlocklyComponent(this.blocklyUtils),
      new FormatDateBlocklyComponent(this.blocklyUtils),
      new CurrentUserBlocklyComponent(this.blocklyUtils),
      new CurrentLocaleBlocklyComponent(this.blocklyUtils),
      new MsToUnitBlocklyComponent(this.blocklyUtils),
      new SequenceBlocklyComponent(this.blocklyUtils),
      new ShowMessageBlocklyComponent(this.blocklyUtils),
      new IsEmptyBlocklyComponent(this.blocklyUtils),
      new IsNotEmptyBlocklyComponent(this.blocklyUtils),
      new IsoToDateBlocklyComponent(this.blocklyUtils),
      new IsoToMsBlocklyComponent(this.blocklyUtils),
      new ShiftDateOfBlocklyComponent(this.blocklyUtils),
      new PrintAttributeBlocklyComponent(this.blocklyUtils),
      new PrintTextBlocklyComponent(this.blocklyUtils),
      new StringReplaceBlocklyComponent(this.blocklyUtils),
      new DeleteDocumentBlocklyComponent(this.blocklyUtils),
      new LinkDocumentsNoReturnBlocklyComponent(this.blocklyUtils, this.linkTypes),
      new LinkDocumentsReturnBlocklyComponent(this.blocklyUtils, this.linkTypes),
      new ReadDocumentsBlocklyComponent(this.blocklyUtils, this.views),
      new SendEmailBlocklyComponent(this.blocklyUtils),
      new NavigateBlocklyComponent(this.blocklyUtils, this.views),
      new GetSiblingsBlocklyComponent(this.blocklyUtils, this.linkTypes),
      new GetParentDocumentBlocklyComponent(this.blocklyUtils),
      new GetChildDocumentsBlocklyComponent(this.blocklyUtils),
      new GetHierarchySiblingsBlocklyComponent(this.blocklyUtils),
      new LoopBreakBlocklyComponent(this.blocklyUtils),
      new LoopContinueBlocklyComponent(this.blocklyUtils),
      new EscapeHtmlBlocklyComponent(this.blocklyUtils),
      new UnescapeHtmlBlocklyComponent(this.blocklyUtils),
      new FormatCurrencyBlocklyComponent(this.blocklyUtils, this.translationService),
    ]);

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

    this.workspace.registerToolboxCategoryCallback(
      'DOCUMENT_VARIABLES',
      this.blocklyUtils.registerDocumentVariables.bind(this.blocklyUtils)
    );
    this.workspace.registerToolboxCategoryCallback('LINKS', this.blocklyUtils.registerLinks.bind(this.blocklyUtils));
    this.workspace.registerToolboxCategoryCallback('DATES', this.blocklyUtils.registerDates.bind(this.blocklyUtils));

    if (this.xml) {
      // initiate from previously stored XML
      const dom: Element = Blockly.Xml.textToDom(this.xml);
      const vars = dom.getElementsByTagName('variable');
      for (let i = 0; i < vars.length; i++) {
        const varType = vars.item(i).attributes.getNamedItem('type').value;
        if (varType.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX)) {
          this.blocklyUtils.ensureVariableTypeBlock(varType);
        }
        if (varType.endsWith(BlocklyUtils.LINK_VAR_SUFFIX)) {
          this.blocklyUtils.ensureLinkInstanceVariableTypeBlock(varType);
        }
      }
      for (let i = 0; i < this.linkTypes.length; i++) {
        this.blocklyUtils.ensureLinkTypeBlock(this.linkTypes[i]);
        this.blocklyUtils.ensureLinkInstanceBlock(this.linkTypes[i]);
      }

      const blocks = dom.getElementsByTagName('block');
      for (let j = 0; j < blocks.length; j++) {
        const blockType = blocks.item(j).attributes.getNamedItem('type').value;

        if (
          blockType.endsWith(BlocklyUtils.LINK_TYPE_BLOCK_SUFFIX) ||
          blockType.endsWith(BlocklyUtils.LINK_INSTANCE_BLOCK_SUFFIX)
        ) {
          const linkType = blockType.split('-')[0];

          if (!this.linkTypes.find(lt => lt.id === linkType)) {
            blocks.item(j).remove();
          }
        }
      }

      Blockly.Xml.domToWorkspace(dom, this.workspace);
      this.blocklyUtils.ensureTypeChecks(this.workspace);
    } else {
      // initiate empty state
      if (this.masterType === MasterBlockType.Function) {
        const containerBlock = this.workspace.newBlock(BlocklyUtils.STATEMENT_CONTAINER);
        containerBlock.setDeletable(false);
        containerBlock.initSvg();
        containerBlock.render();
      } else if (this.masterType === MasterBlockType.Link) {
        const linkBlock = this.workspace.newBlock(BlocklyUtils.LINK_CONTAINER);
        linkBlock.setDeletable(false);
        linkBlock.initSvg();
        linkBlock.render();
      } else {
        const valueBlock = this.workspace.newBlock(BlocklyUtils.VALUE_CONTAINER);
        valueBlock.setDeletable(false);
        valueBlock.initSvg();
        valueBlock.render();
      }
    }

    // make sure we have all variables created (no matter how the workspace was initiated - either from XML or empty)
    this.variables.forEach(variable => {
      if (this.workspace.getVariable(variable.name) == null) {
        if (variable.collectionId) {
          this.workspace.createVariable(variable.name, variable.collectionId + BlocklyUtils.DOCUMENT_VAR_SUFFIX, null);
        } else if (variable.linkTypeId) {
          this.workspace.createVariable(variable.name, variable.linkTypeId + BlocklyUtils.LINK_VAR_SUFFIX, null);
        }
      }
    });
    if (this.masterType === MasterBlockType.Function) {
      this.workspace.createVariable('lumeerActionName', null, null);
    }
    setTimeout(() => {
      this.initializing = false;
    }, 500); // let the DOM to be parsed in their timeout
  }

  private registerCustomBlocks(): void {
    const collection =
      this.masterType !== MasterBlockType.Link ? this.blocklyUtils.getCollection(this.variables[0].collectionId) : null;
    const linkType =
      this.masterType === MasterBlockType.Link || !collection
        ? this.blocklyUtils.getLinkType(this.variables[0].linkTypeId)
        : null;
    const attributeName = this.attribute ? this.attribute.name : collection ? collection.name : linkType.name;

    const this_ = this;
    if (this.masterType === MasterBlockType.Function) {
      if (collection) {
        Blockly.Blocks[BlocklyUtils.STATEMENT_CONTAINER] = {
          init: function () {
            this.jsonInit({
              type: BlocklyUtils.STATEMENT_CONTAINER,
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
        Blockly.JavaScript[BlocklyUtils.STATEMENT_CONTAINER] = function (block) {
          const lumeerVar = Blockly.JavaScript.variableDB_.getDistinctName('lumeer', Blockly.Variables.NAME_TYPE);
          this_.blocklyUtils.setLumeerVariable(lumeerVar);
          const code = 'var ' + lumeerVar + " = Polyglot.import('lumeer');\n";
          return code + Blockly.JavaScript.statementToCode(block, 'COMMANDS') + '\n';
        };
      }

      if (linkType) {
        Blockly.Blocks[BlocklyUtils.STATEMENT_CONTAINER] = {
          init: function () {
            this.jsonInit({
              type: BlocklyUtils.STATEMENT_CONTAINER,
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
        Blockly.JavaScript[BlocklyUtils.STATEMENT_CONTAINER] = function (block) {
          const lumeerVar = Blockly.JavaScript.variableDB_.getDistinctName('lumeer', Blockly.Variables.NAME_TYPE);
          this_.blocklyUtils.setLumeerVariable(lumeerVar);
          const code = 'var ' + lumeerVar + " = Polyglot.import('lumeer');\n";
          return code + Blockly.JavaScript.statementToCode(block, 'COMMANDS') + '\n';
        };
      }

      this.blocklyUtils
        .getComponents()
        .filter(component => component.getVisibility().indexOf(MasterBlockType.Function) >= 0)
        .forEach(component => component.registerBlock(this.workspace));
    } else if (this.masterType === MasterBlockType.Value || this.masterType === MasterBlockType.Link) {
      if (collection) {
        Blockly.Blocks[BlocklyUtils.VALUE_CONTAINER] = {
          init: function () {
            this.jsonInit({
              type: BlocklyUtils.VALUE_CONTAINER,
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
                  check: ['', 'Number', 'String', 'Boolean', 'Colour', 'Array'], // only regular variables - no fields or objects
                },
              ],
              colour: COLOR_DARK,
            });
          },
        };
        Blockly.JavaScript[BlocklyUtils.VALUE_CONTAINER] = function (block) {
          const lumeerVar = Blockly.JavaScript.variableDB_.getDistinctName('lumeer', Blockly.Variables.NAME_TYPE);
          this_.blocklyUtils.setLumeerVariable(lumeerVar);
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
            'thisRecord' +
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
        Blockly.Blocks[BlocklyUtils.LINK_CONTAINER] = {
          init: function () {
            this.jsonInit({
              type: BlocklyUtils.LINK_CONTAINER,
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
                  check: ['', 'Number', 'String', 'Boolean', 'Colour', 'Array'], // only regular variables - no fields or objects
                },
              ],
              colour: COLOR_DARK,
            });
          },
        };

        Blockly.JavaScript[BlocklyUtils.LINK_CONTAINER] = function (block) {
          const lumeerVar = Blockly.JavaScript.variableDB_.getDistinctName('lumeer', Blockly.Variables.NAME_TYPE);
          this_.blocklyUtils.setLumeerVariable(lumeerVar);
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

      this.blocklyUtils
        .getComponents()
        .filter(
          component =>
            component.getVisibility().indexOf(MasterBlockType.Value) >= 0 ||
            component.getVisibility().indexOf(MasterBlockType.Link) >= 0
        )
        .forEach(component => component.registerBlock(this.workspace));
    }
  }

  private onWorkspaceBlockCreate(changeEvent, workspace): void {
    const mainBlock = workspace.getBlockById(changeEvent.blockId);

    // make sure the default blocks do not offer documents etc in variable dropdowns
    this.blocklyUtils.ensureEmptyTypes(mainBlock);

    // prevent deletion of the initial variables
    this.blocklyUtils.preventDeletionOfInitialVariables(mainBlock);

    if (mainBlock.type === BlocklyUtils.GET_ATTRIBUTE || mainBlock.type === BlocklyUtils.GET_LINK_ATTRIBUTE) {
      mainBlock.outputConnection.check_ = [BlocklyUtils.UNKNOWN];
    }

    if (!this.initializing && changeEvent.ids) {
      changeEvent.ids
        .slice()
        .reverse()
        .forEach(newBlockId => {
          const block = workspace.getBlockById(newBlockId);

          if (block.type === BlocklyUtils.GET_ATTRIBUTE || block.type === BlocklyUtils.SET_ATTRIBUTE) {
            const link = block.getInput('DOCUMENT');

            if (link.connection && link.connection.targetConnection) {
              const linkedBlock = link.connection.targetConnection.getSourceBlock();
              const blockOutputType = this.blocklyUtils.getOutputConnectionCheck(linkedBlock);

              if (
                linkedBlock &&
                (blockOutputType.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX) ||
                  blockOutputType.endsWith(BlocklyUtils.DOCUMENT_ARRAY_TYPE_SUFFIX))
              ) {
                this.blocklyUtils.setterAndGetterOutputType(block, linkedBlock);
              }
            }
          }

          if (block.type === BlocklyUtils.GET_LINK_ATTRIBUTE || block.type === BlocklyUtils.SET_LINK_ATTRIBUTE) {
            const link = block.getInput('LINK');

            if (link.connection && link.connection.targetConnection) {
              const linkedBlock = link.connection.targetConnection.getSourceBlock();
              const blockOutputType = this.blocklyUtils.getOutputConnectionCheck(linkedBlock);

              if (
                linkedBlock &&
                (blockOutputType.endsWith(BlocklyUtils.LINK_VAR_SUFFIX) ||
                  blockOutputType.endsWith(BlocklyUtils.LINK_TYPE_ARRAY_SUFFIX))
              ) {
                this.blocklyUtils.setterAndGetterOutputType(block, linkedBlock);
              }
            }
          }

          if (block.type === BlocklyUtils.PRINT_ATTRIBUTE) {
            const link = block.getInput('DOCUMENT');

            if (link.connection && link.connection.targetConnection) {
              const linkedBlock = link.connection.targetConnection.getSourceBlock();
              const blockOutputType = this.blocklyUtils.getOutputConnectionCheck(linkedBlock);

              if (
                linkedBlock &&
                (blockOutputType.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX) ||
                  blockOutputType.endsWith(BlocklyUtils.LINK_VAR_SUFFIX))
              ) {
                this.blocklyUtils.setterAndGetterOutputType(block, linkedBlock);
              }
            }
          }

          if (block.type === BlocklyUtils.GET_LINK_DOCUMENT) {
            const link = block.getInput('LINK');

            if (link.connection && link.connection.targetConnection) {
              const linkedBlock = link.connection.targetConnection.getSourceBlock();
              const blockOutputType = this.blocklyUtils.getOutputConnectionCheck(linkedBlock);

              if (linkedBlock && blockOutputType.endsWith(BlocklyUtils.LINK_VAR_SUFFIX)) {
                this.blocklyUtils.setLinkDocumentOutputType(block, linkedBlock);
              }
            }
          }

          if (block.type.endsWith(BlocklyUtils.LINK_TYPE_BLOCK_SUFFIX)) {
            const link = block.getInput('DOCUMENT');
            const linkedBlock = link.connection?.targetConnection?.getSourceBlock();
            if (linkedBlock && linkedBlock.type.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX)) {
              const blockOutputType = this.blocklyUtils.getOutputConnectionCheck(linkedBlock);
              const linkParts = this.blocklyUtils.getLinkParts(block.type);
              const counterpart =
                linkParts[0] === blockOutputType.replace(BlocklyUtils.DOCUMENT_VAR_SUFFIX, '')
                  ? linkParts[1]
                  : linkParts[0];
              block.setOutput(true, counterpart + BlocklyUtils.DOCUMENT_ARRAY_TYPE_SUFFIX);
            }
          }
        });
    }
  }

  private onWorkspaceChange(changeEvent): void {
    const workspace = this.workspace;

    // keep for easy debugging
    /*console.log(changeEvent);
    if (changeEvent instanceof Blockly.Events.Ui) {
      const block = workspace.getBlockById(changeEvent.blockId);
      console.log(block);
    }*/

    if (changeEvent instanceof Blockly.Events.Create) {
      this.onWorkspaceBlockCreate(changeEvent, workspace);
    }

    // change output type in getter of linked document from link instance
    if (changeEvent instanceof Blockly.Events.Change) {
      const block = workspace.getBlockById(changeEvent.blockId);

      if (
        block.type === BlocklyUtils.GET_LINK_DOCUMENT &&
        changeEvent.element === 'field' &&
        changeEvent.name === 'COLLECTION'
      ) {
        block.outputConnection.check_ = changeEvent.newValue + BlocklyUtils.DOCUMENT_VAR_SUFFIX;

        if (block.outputConnection?.targetConnection) {
          const linkedBlock = block.outputConnection.targetConnection.getSourceBlock();

          if (linkedBlock) {
            this.blocklyUtils.setterAndGetterOutputType(linkedBlock, block);
          }
        }
      }

      // might be a change of assigned variable
      if (block.type === BlocklyUtils.VARIABLES_SET) {
        this.blocklyUtils.checkVariablesType(changeEvent, workspace);
      }
    }

    if (changeEvent.newParentId) {
      // is there a new connection made?
      const block = workspace.getBlockById(changeEvent.blockId);
      const blockOutputType = this.blocklyUtils.getOutputConnectionCheck(block);
      const parentBlock = workspace.getBlockById(changeEvent.newParentId);

      // is it a document being connected to ...
      if (blockOutputType.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX)) {
        // ...a link?
        if (parentBlock.type.endsWith(BlocklyUtils.LINK_TYPE_BLOCK_SUFFIX)) {
          // set the output type to the opposite of what is connected on the input (links are symmetric)
          const linkParts = this.blocklyUtils.getLinkParts(parentBlock.type);
          const counterpart =
            linkParts[0] === blockOutputType.replace(BlocklyUtils.DOCUMENT_VAR_SUFFIX, '')
              ? linkParts[1]
              : linkParts[0];
          parentBlock.setOutput(true, counterpart + BlocklyUtils.DOCUMENT_ARRAY_TYPE_SUFFIX);
        }
      }

      // disconnect invalid foreach input
      if (parentBlock.type === BlocklyUtils.FOREACH_DOCUMENT_ARRAY) {
        if (parentBlock.getInput('LIST').connection?.targetConnection?.sourceBlock_.id === block.id) {
          if (!blockOutputType.endsWith(BlocklyUtils.DOCUMENT_ARRAY_TYPE_SUFFIX)) {
            parentBlock.getInput('LIST').connection.disconnect();
          } else {
            // otherwise set a correct type of the cycle variable
            const newType = blockOutputType.replace(BlocklyUtils.ARRAY_TYPE_SUFFIX, '');
            this.blocklyUtils.updateVariableType(workspace, parentBlock.getField('VAR').getVariable(), newType);
            parentBlock.getField('VAR').setTypes_([newType], newType);
          }
        }
      }

      // disconnect invalid foreach input
      if (parentBlock.type === BlocklyUtils.FOREACH_LINK_ARRAY) {
        if (parentBlock.getInput('LIST').connection?.targetConnection?.sourceBlock_.id === block.id) {
          if (!blockOutputType.endsWith(BlocklyUtils.LINK_TYPE_ARRAY_SUFFIX)) {
            parentBlock.getInput('LIST').connection.disconnect();
          } else {
            // otherwise set a correct type of the cycle variable
            const newType = blockOutputType.replace(BlocklyUtils.LINK_TYPE_ARRAY_SUFFIX, BlocklyUtils.LINK_VAR_SUFFIX);
            this.blocklyUtils.updateVariableType(workspace, parentBlock.getField('VAR').getVariable(), newType);
            parentBlock.getField('VAR').setTypes_([newType], newType);
          }
        }
      }

      // populate document attribute names in document attr getter and setter
      if (parentBlock.type === BlocklyUtils.GET_ATTRIBUTE || parentBlock.type === BlocklyUtils.SET_ATTRIBUTE) {
        if (
          blockOutputType.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX) ||
          blockOutputType.endsWith(BlocklyUtils.DOCUMENT_ARRAY_TYPE_SUFFIX)
        ) {
          this.blocklyUtils.setterAndGetterOutputType(parentBlock, block);
        } else {
          const document = parentBlock.getInput('DOCUMENT');
          if (
            document.connection &&
            document.connection.targetConnection &&
            document.connection.targetConnection.getSourceBlock().id === block.id
          ) {
            this.blocklyUtils.tryDisconnect(parentBlock, document.connection);
          }
        }
      }
      // populate document attribute names in link attr getter and setter
      if (
        parentBlock.type === BlocklyUtils.GET_LINK_ATTRIBUTE ||
        parentBlock.type === BlocklyUtils.SET_LINK_ATTRIBUTE
      ) {
        if (
          blockOutputType.endsWith(BlocklyUtils.LINK_VAR_SUFFIX) ||
          blockOutputType.endsWith(BlocklyUtils.LINK_TYPE_ARRAY_SUFFIX)
        ) {
          this.blocklyUtils.setterAndGetterOutputType(parentBlock, block);
        } else {
          const link = parentBlock.getInput('LINK');
          if (
            link.connection &&
            link.connection.targetConnection &&
            link.connection.targetConnection.getSourceBlock().id === block.id
          ) {
            this.blocklyUtils.tryDisconnect(parentBlock, link.connection);
          }
        }
      }

      // populate attributes in print block
      if (parentBlock.type === BlocklyUtils.PRINT_ATTRIBUTE) {
        if (
          blockOutputType.endsWith(BlocklyUtils.LINK_VAR_SUFFIX) ||
          blockOutputType.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX)
        ) {
          this.blocklyUtils.setterAndGetterOutputType(parentBlock, block);
        } else {
          const link = parentBlock.getInput('DOCUMENT');
          if (
            link.connection &&
            link.connection.targetConnection &&
            link.connection.targetConnection.getSourceBlock().id === block.id
          ) {
            this.blocklyUtils.tryDisconnect(parentBlock, link.connection);
          }
        }
      }

      // populate collections in getter of linked document from link instance
      if (parentBlock.type === BlocklyUtils.GET_LINK_DOCUMENT) {
        if (blockOutputType.endsWith(BlocklyUtils.LINK_VAR_SUFFIX)) {
          this.blocklyUtils.setLinkDocumentOutputType(parentBlock, block);
        }
      }

      // might be a connection of document to a variable
      if (parentBlock.type === BlocklyUtils.VARIABLES_SET) {
        this.blocklyUtils.checkVariablesType(changeEvent, workspace);
      }
    } else if (changeEvent.oldParentId) {
      // reset output type and disconnect when linked document is removed
      const block = workspace.getBlockById(changeEvent.blockId);
      if (block) {
        // when replacing a shadow block, the original block might not exist anymore
        const blockOutputType = this.blocklyUtils.getOutputConnectionCheck(block);
        const parentBlock = workspace.getBlockById(changeEvent.oldParentId);

        if (parentBlock) {
          // document being removed from link
          if (blockOutputType.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX)) {
            if (parentBlock.type.endsWith(BlocklyUtils.LINK_TYPE_BLOCK_SUFFIX) && parentBlock.outputConnection) {
              parentBlock.setOutput(true, BlocklyUtils.UNKNOWN);
              this.blocklyUtils.tryDisconnect(parentBlock, parentBlock.outputConnection);
            }
          }

          // document or link being removed from attr getter
          if (
            blockOutputType.endsWith(BlocklyUtils.DOCUMENT_VAR_SUFFIX) ||
            blockOutputType.endsWith(BlocklyUtils.LINK_TYPE_BLOCK_SUFFIX)
          ) {
            if (parentBlock.type === BlocklyUtils.GET_ATTRIBUTE && parentBlock.outputConnection) {
              parentBlock.setOutput(true, BlocklyUtils.UNKNOWN);
              this.blocklyUtils.tryDisconnect(parentBlock, parentBlock.outputConnection);
            }
          }

          // reset list of attributes upon disconnection
          if (parentBlock.type === BlocklyUtils.GET_ATTRIBUTE || parentBlock.type === BlocklyUtils.GET_LINK_ATTRIBUTE) {
            this.blocklyUtils.resetOptions(parentBlock, 'ATTR');
          }

          // reset list of attributes upon disconnection
          if (
            (parentBlock.type === BlocklyUtils.SET_ATTRIBUTE &&
              (isNullOrUndefined(parentBlock.getInput('DOCUMENT').connection) ||
                parentBlock.getInput('DOCUMENT').connection.targetConnection === null)) ||
            (parentBlock.type === BlocklyUtils.SET_LINK_ATTRIBUTE &&
              (isNullOrUndefined(parentBlock.getInput('LINK').connection) ||
                parentBlock.getInput('LINK').connection.targetConnection === null)) ||
            (parentBlock.type === BlocklyUtils.PRINT_ATTRIBUTE &&
              (isNullOrUndefined(parentBlock.getInput('DOCUMENT').connection) ||
                parentBlock.getInput('DOCUMENT').connection.targetConnection === null))
          ) {
            this.blocklyUtils.resetOptions(parentBlock, 'ATTR');
          }

          // reset list of collections upon disconnection
          if (
            parentBlock.type === BlocklyUtils.GET_LINK_DOCUMENT &&
            (isNullOrUndefined(parentBlock.getInput('COLLECTION').connection) ||
              parentBlock.getInput('COLLECTION').connection.targetConnection === null)
          ) {
            parentBlock.setOutput(true, BlocklyUtils.UNKNOWN);
            this.blocklyUtils.resetOptions(parentBlock, 'COLLECTION');
          }

          // might be a disconnection of document from variable
          if (parentBlock.type === BlocklyUtils.VARIABLES_SET) {
            this.blocklyUtils.checkVariablesType(changeEvent, workspace);
          }
        }
      }
    }

    this.blocklyUtils.getComponents().forEach(component => component.onWorkspaceChange(workspace, changeEvent));

    // render new state
    this.generateXml();
    this.generateJs();
  }

  private generateXml(): void {
    const xml = Blockly.Xml.domToPrettyText(Blockly.Xml.workspaceToDom(this.workspace));
    this.onXmlUpdate.emit(xml);
  }

  private generateJs(): void {
    let js = Blockly.JavaScript.workspaceToCode(this.workspace);

    if (this.blocklyUtils.emptyJs(js)) {
      js = '';
    } else {
      if (this.masterType === MasterBlockType.Value && js.indexOf('var thisRecord;') < 0) {
        js = 'var thisRecord;\n' + js;
      }

      if (this.masterType === MasterBlockType.Link && js.indexOf('var thisLink;') < 0) {
        js = 'var thisLink;\n' + js;
      }
    }

    this.onJsUpdate.emit(js);
  }

  public ngOnDestroy(): void {
    // resiliency to quick dialog close
    this.destroying = true;
    if (this.workspace) {
      this.workspace.dispose();
    }
  }
}
