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
import * as Blockly from 'blockly';

import {LUMEER_COLOUR_COLUMNS, LUMEER_COLOUR_PALETTE} from './colour-palette';

/**
 * Colour field showing the Lumeer palette. Blockly moved its own colour field out to a plugin that
 * bundles code generators of four other languages, so we keep a small one here.
 * Used in block definitions as {type: 'field_colour', name: 'COLOUR', colour: '#ff0000'}.
 */
export class FieldColour extends Blockly.Field<string> {
  public SERIALIZABLE = true;
  public CURSOR = 'default';

  protected isDirty_ = false;

  constructor(value?: string) {
    super(Blockly.Field.SKIP_SETUP);
    this.setValue(value || '#ffffff');
  }

  public static fromJson(options: any): FieldColour {
    return new FieldColour(options['colour']);
  }

  public initView() {
    this.updateSize_();
    this.createBorderRect_();
    this.getBorderRect().style.fillOpacity = '1';
  }

  public applyColour() {
    if (this.borderRect_) {
      this.borderRect_.style.fill = this.getValue();
    }
  }

  public getText(): string {
    return this.getValue();
  }

  protected doClassValidation_(newValue?: any): string | null {
    return typeof newValue === 'string' ? Blockly.utils.colour.parse(newValue) : null;
  }

  protected doValueUpdate_(newValue: string) {
    super.doValueUpdate_(newValue);
    this.applyColour();
  }

  protected render_() {
    this.updateSize_();
    this.positionBorderRect_();
  }

  protected updateSize_() {
    const constants = this.getConstants();
    if (constants) {
      this.size_ = new Blockly.utils.Size(constants.FIELD_COLOUR_DEFAULT_WIDTH, constants.FIELD_COLOUR_DEFAULT_HEIGHT);
    }
  }

  protected showEditor_() {
    const palette = document.createElement('div');
    palette.className = 'lumeerColourPalette';
    palette.style.gridTemplateColumns = `repeat(${LUMEER_COLOUR_COLUMNS}, 20px)`;

    LUMEER_COLOUR_PALETTE.forEach(colour => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.title = colour;
      swatch.style.backgroundColor = colour;
      if (colour === this.getValue()) {
        swatch.className = 'lumeerColourSelected';
      }
      swatch.addEventListener('click', () => {
        this.setValue(colour);
        Blockly.DropDownDiv.hideIfOwner(this);
      });
      palette.appendChild(swatch);
    });

    Blockly.DropDownDiv.clearContent();
    Blockly.DropDownDiv.getContentDiv().appendChild(palette);
    Blockly.DropDownDiv.showPositionedByField(this);
  }
}

Blockly.Css.register(`
.lumeerColourPalette {
  display: grid;
  gap: 0;
  padding: 4px;
}

.lumeerColourPalette button {
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0.5px solid #888;
  border-radius: 0;
  cursor: pointer;
}

.lumeerColourPalette button:hover,
.lumeerColourPalette button:focus,
.lumeerColourPalette button.lumeerColourSelected {
  position: relative;
  border-color: #eee;
  outline: 1px solid #333;
}
`);

/**
 * Registers the colour field and the four colour blocks with their JavaScript generators.
 */
export function installColourBlocks(javascriptGenerator: any) {
  Blockly.fieldRegistry.register('field_colour', FieldColour);

  Blockly.common.defineBlocksWithJsonArray([
    {
      type: 'colour_picker',
      message0: '%1',
      args0: [{type: 'field_colour', name: 'COLOUR', colour: '#ff0000'}],
      output: 'Colour',
      helpUrl: '%{BKY_COLOUR_PICKER_HELPURL}',
      style: 'colour_blocks',
      tooltip: '%{BKY_COLOUR_PICKER_TOOLTIP}',
      extensions: ['parent_tooltip_when_inline'],
    },
    {
      type: 'colour_random',
      message0: '%{BKY_COLOUR_RANDOM_TITLE}',
      output: 'Colour',
      helpUrl: '%{BKY_COLOUR_RANDOM_HELPURL}',
      style: 'colour_blocks',
      tooltip: '%{BKY_COLOUR_RANDOM_TOOLTIP}',
    },
    {
      type: 'colour_rgb',
      message0: '%{BKY_COLOUR_RGB_TITLE} %{BKY_COLOUR_RGB_RED} %1 %{BKY_COLOUR_RGB_GREEN} %2 %{BKY_COLOUR_RGB_BLUE} %3',
      args0: [
        {type: 'input_value', name: 'RED', check: 'Number', align: 'RIGHT'},
        {type: 'input_value', name: 'GREEN', check: 'Number', align: 'RIGHT'},
        {type: 'input_value', name: 'BLUE', check: 'Number', align: 'RIGHT'},
      ],
      output: 'Colour',
      helpUrl: '%{BKY_COLOUR_RGB_HELPURL}',
      style: 'colour_blocks',
      tooltip: '%{BKY_COLOUR_RGB_TOOLTIP}',
    },
    {
      type: 'colour_blend',
      message0:
        '%{BKY_COLOUR_BLEND_TITLE} %{BKY_COLOUR_BLEND_COLOUR1} ' +
        '%1 %{BKY_COLOUR_BLEND_COLOUR2} %2 %{BKY_COLOUR_BLEND_RATIO} %3',
      args0: [
        {type: 'input_value', name: 'COLOUR1', check: 'Colour', align: 'RIGHT'},
        {type: 'input_value', name: 'COLOUR2', check: 'Colour', align: 'RIGHT'},
        {type: 'input_value', name: 'RATIO', check: 'Number', align: 'RIGHT'},
      ],
      output: 'Colour',
      helpUrl: '%{BKY_COLOUR_BLEND_HELPURL}',
      style: 'colour_blocks',
      tooltip: '%{BKY_COLOUR_BLEND_TOOLTIP}',
    },
  ]);

  const {forBlock} = javascriptGenerator;

  forBlock['colour_picker'] = (block, generator) => [
    generator.quote_(block.getFieldValue('COLOUR')),
    generator.ORDER_ATOMIC,
  ];

  forBlock['colour_random'] = (block, generator) => {
    const functionName = generator.provideFunction_(
      'colourRandom',
      `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}() {
  var num = Math.floor(Math.random() * 0x1000000);
  return '#' + ('00000' + num.toString(16)).substr(-6);
}
`
    );
    return [functionName + '()', generator.ORDER_FUNCTION_CALL];
  };

  forBlock['colour_rgb'] = (block, generator) => {
    const red = generator.valueToCode(block, 'RED', generator.ORDER_NONE) || 0;
    const green = generator.valueToCode(block, 'GREEN', generator.ORDER_NONE) || 0;
    const blue = generator.valueToCode(block, 'BLUE', generator.ORDER_NONE) || 0;
    const functionName = generator.provideFunction_(
      'colourRgb',
      `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(r, g, b) {
  r = Math.max(Math.min(Number(r), 100), 0) * 2.55;
  g = Math.max(Math.min(Number(g), 100), 0) * 2.55;
  b = Math.max(Math.min(Number(b), 100), 0) * 2.55;
  r = ('0' + (Math.round(r) || 0).toString(16)).slice(-2);
  g = ('0' + (Math.round(g) || 0).toString(16)).slice(-2);
  b = ('0' + (Math.round(b) || 0).toString(16)).slice(-2);
  return '#' + r + g + b;
}
`
    );
    return [`${functionName}(${red}, ${green}, ${blue})`, generator.ORDER_FUNCTION_CALL];
  };

  forBlock['colour_blend'] = (block, generator) => {
    const colour1 = generator.valueToCode(block, 'COLOUR1', generator.ORDER_NONE) || "'#000000'";
    const colour2 = generator.valueToCode(block, 'COLOUR2', generator.ORDER_NONE) || "'#000000'";
    const ratio = generator.valueToCode(block, 'RATIO', generator.ORDER_NONE) || 0.5;
    const functionName = generator.provideFunction_(
      'colourBlend',
      `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(c1, c2, ratio) {
  ratio = Math.max(Math.min(Number(ratio), 1), 0);
  var r1 = parseInt(c1.substring(1, 3), 16);
  var g1 = parseInt(c1.substring(3, 5), 16);
  var b1 = parseInt(c1.substring(5, 7), 16);
  var r2 = parseInt(c2.substring(1, 3), 16);
  var g2 = parseInt(c2.substring(3, 5), 16);
  var b2 = parseInt(c2.substring(5, 7), 16);
  var r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  var g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  var b = Math.round(b1 * (1 - ratio) + b2 * ratio);
  r = ('0' + (r || 0).toString(16)).slice(-2);
  g = ('0' + (g || 0).toString(16)).slice(-2);
  b = ('0' + (b || 0).toString(16)).slice(-2);
  return '#' + r + g + b;
}
`
    );
    return [`${functionName}(${colour1}, ${colour2}, ${ratio})`, generator.ORDER_FUNCTION_CALL];
  };
}
