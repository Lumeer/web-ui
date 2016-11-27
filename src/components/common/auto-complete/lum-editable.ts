import {Directive, Renderer, ElementRef} from '@angular/core';
@Directive({ selector: '.lum-editable' })
export class LumEditable {
  constructor(public el: ElementRef, public renderer: Renderer) {}
}
