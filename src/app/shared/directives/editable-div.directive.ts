import {Directive, forwardRef, ElementRef, HostListener, Renderer2} from '@angular/core'
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Directive({
  selector: '[editable-div]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditableDivDirective),
      multi: true
    }
  ]
})
export class EditableDivDirective implements ControlValueAccessor {

  constructor(private _elRef: ElementRef, private _renderer: Renderer2) {
  }

  public onChange() {
    if (this._onChange) {
      this._onChange(this._elRef.nativeElement.textContent);
    }
  }

  @HostListener('keyup', ['$event'])
  public keyup(event: any) {
    this.onChange();
  }

  private _onChange = (_) => {
  };
  private _onTouched = () => {
  };

  public writeValue(val: any) {
    if (!val) val = '';

    this._renderer.setProperty(this._elRef.nativeElement, 'textContent', val);
  }

  public registerOnChange(fn: (_: any) => void): void {
    this._onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
}
