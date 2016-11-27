import {Directive, Renderer, ElementRef} from '@angular/core';
@Directive({ selector: '[contenteditable], input.lum-editable' })
export class LumEditable {
  constructor(public el: ElementRef, public renderer: Renderer) {}
}
