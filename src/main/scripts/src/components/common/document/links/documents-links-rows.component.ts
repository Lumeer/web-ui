import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'documents-links-rows',
  template: require('./documents-links-rows.component.html'),
  styles: [require('./documents-links-rows.component.scss').toString()]
})
export class DocumentLinksRowsComponent implements OnInit {

  private documentsLinkAndDoc: any[];
  @Input() public headerAttrsLink: string[];
  @Input() public documentsLink: any[];
  @Input() public headerAttrsDoc: string[];
  @Input() public documentsDoc: any[];
  @Input() public collectionInfo: any;
  @Input() public linkType: string;


  public ngOnInit(): void {
    if (this.documentsDoc) {
      this.documentsLinkAndDoc = [];
      for (let i = 0; i < this.documentsDoc.length; i++) {
        this.documentsLinkAndDoc.push({
          "documentLink": this.documentsLink[i],
          "documentDoc": this.documentsDoc[i]
        });
      }
    }
  }

  private hex2rgba(hex, opacity) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity / 100 + ')';
  }
}
