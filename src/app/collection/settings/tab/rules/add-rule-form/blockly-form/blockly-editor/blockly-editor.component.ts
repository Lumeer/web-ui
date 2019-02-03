/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Inject, OnInit, Renderer2, ViewChild} from '@angular/core';
import {environment} from '../../../../../../../../environments/environment';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../../../../core/store/app.state';
import {ActivatedRoute} from '@angular/router';
import {DialogService} from '../../../../../../../dialog/dialog.service';
import {DOCUMENT} from '@angular/common';

declare var Blockly: any;

@Component({
  selector: 'blockly-editor',
  templateUrl: './blockly-editor.component.html',
  styleUrls: ['./blockly-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlocklyEditorComponent implements OnInit, AfterViewInit {

  @ViewChild('loading')
  private loadingElement: ElementRef;

  constructor(private store$: Store<AppState>,
              private route: ActivatedRoute,
              private dialogService: DialogService,
              private renderer2: Renderer2,
              @Inject(DOCUMENT) private document) {
  }

  public ngOnInit(): void {
  }

  public ngAfterViewInit(): void {
    const script = this.renderer2.createElement('script');
    script.type = 'text/javascript';
    script.src = environment.blocklyCdn;
    script.onload = () => {
      this.blocklyOnLoad();
    };
    this.renderer2.appendChild(this.document.body, script);
  }

  public blocklyOnLoad(): void {
    console.log('onload');
    if (!(window as any).Blockly) {
      setTimeout(() => this.blocklyOnLoad(), 500);
    } else {
      console.log('je tam');
      (window as any).Blockly.init();
      this.loadingElement.nativeElement.remove();
      //this.workspace = (window as any).Blockly.inject('blockly', {toolbox: toolbox.BLOCKLY_TOOLBOX});
    }
  }
}
