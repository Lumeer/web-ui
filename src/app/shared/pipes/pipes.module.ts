import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ColorsPipe} from './colors.pipe';
import {PrefixPipe} from './prefix.pipe';
import {IconsPipe} from './icons.pipe';
import {PixelPipe} from './pixel.pipe';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    PixelPipe,
    IconsPipe,
    ColorsPipe,
    PrefixPipe
  ],
  exports: [
    PixelPipe,
    IconsPipe,
    ColorsPipe,
    PrefixPipe
  ]
})
export class PipesModule {
}
