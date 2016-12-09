import {Component} from '@angular/core';
@Component({
  selector: 'document-preview',
  template: require('./document-preview.component.html'),
  styles: [ require('./document-preview.component.scss').toString() ]
})

export class DocumentPreviewComponent {
  public documents: any[] = [
    {title: 'Some Document', values: ['a', 'b', 'c', 'd']},
    {title: 'Some Document 2', values: ['1', '2', '3', '4']},
    {title: 'Some Document 3', values: ['t', 'r', 'e', 'y']}
  ];
}
