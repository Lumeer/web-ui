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
import {BlocklyService} from '../../../core/service/blockly.service';
import {loadBlockly} from '../custom/blockly-loader';
import {BLOCKLY_FUNCTION_TOOLBOX, BLOCKLY_VALUE_TOOLBOX} from './blockly-editor-toolbox';
import {BlocklyEditorComponent} from './blockly-editor.component';
import {BLOCKLY_SAVED_DATA} from './blockly-editor.spec-data';
import {MasterBlockType} from './blockly-utils';

interface EditorResult {
  js: string;
  xml: string;
  changedWarning: boolean;
}

/**
 * Opens saved automations and functions in the editor and checks that we still generate the code they were saved with.
 */
describe('BlocklyEditorComponent with saved automations', () => {
  let originalTimeout: number;

  beforeAll(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  BLOCKLY_SAVED_DATA.cases.forEach(savedCase => {
    it(`should generate the saved code of ${savedCase.name}`, async () => {
      const result = await openInEditor(savedCase);

      expect(result.changedWarning).toBe(false);
      expect(normalize(result.js)).toEqual(normalize(savedCase.js));
      expect(blockTypes(result.xml)).toEqual(blockTypes(savedCase.xml));
    });
  });

  it('should open all toolbox categories and create every block in them', async () => {
    const savedCase = BLOCKLY_SAVED_DATA.cases.find(c => c.type === 'Rule');
    const failures: string[] = [];
    let created = 0;

    await openInEditor(savedCase, workspace => {
      const toolbox = workspace.getToolbox();
      toolbox
        .getToolboxItems()
        .filter(item => item.isSelectable())
        .forEach(item => {
          toolbox.setSelectedItem(item);
          const flyoutBlocks = workspace.getFlyout().getWorkspace().getTopBlocks(false);
          if (flyoutBlocks.length === 0) {
            failures.push(`empty category ${item.getName()}`);
          }
          flyoutBlocks.forEach(flyoutBlock => {
            try {
              const block = workspace.newBlock(flyoutBlock.type);
              block.initSvg();
              block.render();
              created++;
            } catch (e) {
              failures.push(`${flyoutBlock.type}: ${e}`);
            }
          });
        });
    });

    expect(failures).toEqual([]);
    expect(created).toBeGreaterThan(100);
  });

  it('should find the Blockly internals our type checks rely on', async () => {
    // blockly-utils.ts and several blocks read and write these directly to derive types while editing,
    // this fails when a Blockly update renames them
    const savedCase = BLOCKLY_SAVED_DATA.cases.find(c => c.type === 'Rule');
    const missing: string[] = [];

    await openInEditor(savedCase, workspace => {
      const blocks = workspace.getAllBlocks(false);
      const output = blocks.find(block => block.outputConnection)?.outputConnection;
      if (!output || !('check' in output)) {
        missing.push('Connection.check');
      }
      const variableField = blocks.map(block => block.getField('VAR')).find(field => !!field);
      if (!variableField || typeof variableField.setTypes !== 'function') {
        missing.push('FieldVariable.setTypes');
      }
    });

    expect(missing).toEqual([]);
  });

  it('should generate the same code for colour blocks as the Blockly colour plugin', async () => {
    const Blockly = await loadBlockly('en');
    const workspace = new Blockly.Workspace();
    Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(COLOUR_BLOCKS_XML), workspace);
    const js = Blockly.JavaScript.workspaceToCode(workspace);
    workspace.dispose();

    expect(js).toEqual(COLOUR_BLOCKS_JS);
  });

  it('should pick a colour from the Lumeer palette', async () => {
    const savedCase = BLOCKLY_SAVED_DATA.cases.find(c => c.type === 'Rule');
    let swatches = 0;
    let picked: string;

    await openInEditor(savedCase, workspace => {
      const block = workspace.newBlock('colour_picker');
      block.initSvg();
      block.render();
      const field = block.getField('COLOUR');
      field.showEditor();
      const buttons = document.querySelectorAll<HTMLButtonElement>('.lumeerColourPalette button');
      swatches = buttons.length;
      buttons[11].click();
      picked = field.getValue();
    });

    expect(swatches).toBe(132);
    expect(picked).toBe('#ffffff');
  });

  it('should show table icons', async () => {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'assets/font-awesome/fontawesome-all.min.css';
    await new Promise(resolve => {
      stylesheet.onload = resolve;
      document.head.appendChild(stylesheet);
    });

    const savedCase = BLOCKLY_SAVED_DATA.cases.find(c => c.type === 'Rule');
    let icons: string[] = [];
    await openInEditor(savedCase, () => {
      icons = Array.from(document.querySelectorAll('text.blocklyFontAwesome')).map(element => element.textContent);
    });
    document.head.removeChild(stylesheet);

    expect(icons.length).toBeGreaterThan(0);
    icons.forEach(icon => expect(icon.charCodeAt(0)).toBeGreaterThanOrEqual(0xe000));
  });
});

async function openInEditor(savedCase: any, inspect?: (workspace: any) => void): Promise<EditorResult> {
  const blocklyService = {
    loadBlockly: () => loadBlockly('en'),
  } as unknown as BlocklyService;
  const translationService = {translate: (key: string) => key, translateLanguageTag: (tag: string) => tag} as any;
  const component = new BlocklyEditorComponent(null, null, null, blocklyService, translationService);

  const {collections, linkTypes} = BLOCKLY_SAVED_DATA;
  component.collections = collections;
  component.linkTypes = linkTypes.map(linkType => ({
    ...linkType,
    collections: linkType.collectionIds.map(id => collections.find(collection => collection.id === id)),
  }));
  component.masterType = savedCase.type as MasterBlockType;
  component.toolbox = savedCase.type === 'Rule' ? BLOCKLY_FUNCTION_TOOLBOX : BLOCKLY_VALUE_TOOLBOX;
  component.xml = savedCase.xml;
  if (savedCase.type === 'Rule') {
    component.variables = [
      {name: 'oldRecord', collectionId: savedCase.collectionId},
      {name: 'newRecord', collectionId: savedCase.collectionId},
    ];
  } else if (savedCase.type === 'Function') {
    // functions saved before the rename of documents to records
    const name = savedCase.xml.includes('>thisDocument<') ? 'thisDocument' : 'thisRecord';
    component.variables = [{name, collectionId: savedCase.collectionId}];
    component.thisCollectionId = savedCase.collectionId;
    component.attribute = collections
      .find(collection => collection.id === savedCase.collectionId)
      .attributes.find(attribute => attribute.id === savedCase.attributeId);
  } else {
    component.variables = [{name: 'thisLink', linkTypeId: savedCase.linkTypeId}];
    component.thisLinkTypeId = savedCase.linkTypeId;
    component.attribute = linkTypes
      .find(linkType => linkType.id === savedCase.linkTypeId)
      .attributes.find(attribute => attribute.id === savedCase.attributeId);
  }

  const result: EditorResult = {js: null, xml: null, changedWarning: false};
  component.onJsUpdate.subscribe(js => (result.js = js));
  component.onXmlUpdate.subscribe(xml => (result.xml = xml));

  const element = document.createElement('div');
  element.id = 'blocklyDiv' + component.blocklyId;
  element.style.width = '1000px';
  element.style.height = '600px';
  document.body.appendChild(element);

  try {
    component.ngAfterViewInit();
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (inspect) {
      inspect((component as any).workspace);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    result.changedWarning = component.changedWarning$.getValue();
    return result;
  } finally {
    component.ngOnDestroy();
    document.body.removeChild(element);
  }
}

function normalize(js: string): string {
  return (js || '').replace(/\s+/g, ' ').trim();
}

function blockTypes(xml: string): string[] {
  return Array.from(new DOMParser().parseFromString(xml, 'text/xml').getElementsByTagName('block'))
    .map(block => block.getAttribute('type'))
    .sort();
}

// generated by @blockly/field-colour 6 for COLOUR_BLOCKS_XML
const COLOUR_BLOCKS_XML =
  '<xml><block type="text_print"><value name="TEXT"><block type="colour_blend"><value name="COLOUR1"><block type="colour_picker"><field name="COLOUR">#00b388</field></block></value><value name="COLOUR2"><block type="colour_rgb"><value name="RED"><block type="math_number"><field name="NUM">100</field></block></value><value name="GREEN"><block type="math_number"><field name="NUM">50</field></block></value><value name="BLUE"><block type="math_number"><field name="NUM">0</field></block></value></block></value><value name="RATIO"><block type="math_number"><field name="NUM">0.5</field></block></value></block></value><next><block type="text_print"><value name="TEXT"><block type="colour_random"></block></value><next><block type="text_print"><value name="TEXT"><block type="colour_blend"></block></value><next><block type="text_print"><value name="TEXT"><block type="colour_rgb"></block></value></block></next></block></next></block></next></block></xml>';

// prettier-ignore
const COLOUR_BLOCKS_JS = "function colourRgb(r, g, b) {\n  r = Math.max(Math.min(Number(r), 100), 0) * 2.55;\n  g = Math.max(Math.min(Number(g), 100), 0) * 2.55;\n  b = Math.max(Math.min(Number(b), 100), 0) * 2.55;\n  r = ('0' + (Math.round(r) || 0).toString(16)).slice(-2);\n  g = ('0' + (Math.round(g) || 0).toString(16)).slice(-2);\n  b = ('0' + (Math.round(b) || 0).toString(16)).slice(-2);\n  return '#' + r + g + b;\n}\n\nfunction colourBlend(c1, c2, ratio) {\n  ratio = Math.max(Math.min(Number(ratio), 1), 0);\n  var r1 = parseInt(c1.substring(1, 3), 16);\n  var g1 = parseInt(c1.substring(3, 5), 16);\n  var b1 = parseInt(c1.substring(5, 7), 16);\n  var r2 = parseInt(c2.substring(1, 3), 16);\n  var g2 = parseInt(c2.substring(3, 5), 16);\n  var b2 = parseInt(c2.substring(5, 7), 16);\n  var r = Math.round(r1 * (1 - ratio) + r2 * ratio);\n  var g = Math.round(g1 * (1 - ratio) + g2 * ratio);\n  var b = Math.round(b1 * (1 - ratio) + b2 * ratio);\n  r = ('0' + (r || 0).toString(16)).slice(-2);\n  g = ('0' + (g || 0).toString(16)).slice(-2);\n  b = ('0' + (b || 0).toString(16)).slice(-2);\n  return '#' + r + g + b;\n}\n\nfunction colourRandom() {\n  var num = Math.floor(Math.random() * 0x1000000);\n  return '#' + ('00000' + num.toString(16)).substr(-6);\n}\n\n\nwindow.alert(colourBlend('#00b388', colourRgb(100, 50, 0), 0.5));\nwindow.alert(colourRandom());\nwindow.alert(colourBlend('#000000', '#000000', 0.5));\nwindow.alert(colourRgb(0, 0, 0));\n";
