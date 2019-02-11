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

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {BlocklyRuleConfiguration} from '../../../../../../core/model/rule';
import {Observable} from 'rxjs';
import {Collection} from '../../../../../../core/store/collections/collection';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../../../core/store/app.state';
import {selectAllCollections} from '../../../../../../core/store/collections/collections.state';
import {selectAllLinkTypes} from '../../../../../../core/store/link-types/link-types.state';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {Variable} from '../../variable-type';
import {el} from '@angular/platform-browser/testing/src/browser_util';

@Component({
  selector: 'blockly-form',
  templateUrl: './blockly-form.component.html',
  styleUrls: ['./blockly-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocklyFormComponent implements OnInit {
  @Input()
  public config: BlocklyRuleConfiguration;

  @Input()
  public collection: Collection;

  @Input()
  public form: FormGroup;

  public displayDebug = '';

  public collections$: Observable<Collection[]>;

  public linkTypes$: Observable<LinkType[]>;

  public variables: Variable[];

  public constructor(private store$: Store<AppState>) {}

  @ViewChild('parentFormDiv')
  private parentFormDiv: ElementRef;

  public get blocklyXml(): string {
    return this.form.get('blocklyXml').value;
  }

  public get blocklyJs(): string {
    return this.form.get('blocklyJs').value;
  }

  public get blocklyDryRunResult(): string {
    return this.form.get('blocklyDryRunResult').value;
  }

  public get blocklyError(): string {
    return this.form.get('blocklyError').value;
  }

  public get blocklyResultTimestamp(): string {
    return this.form.get('blocklyResultTimestamp').value;
  }

  public display(part: string): void {
    if (this.displayDebug === part) {
      this.displayDebug = '';
    } else {
      this.displayDebug = part;
    }
  }

  public ngOnInit(): void {
    this.onWindowResize();
    this.collections$ = this.store$.select(selectAllCollections);
    this.linkTypes$ = this.store$.select(selectAllLinkTypes);
    this.variables = [
      {name: 'oldDocument', collectionId: this.collection.id},
      {name: 'newDocument', collectionId: this.collection.id},
    ];
  }

  public onJsUpdate(jsCode: string) {
    this.form.get('blocklyJs').setValue(jsCode);
  }

  public onXmlUpdate(xmlCode: string) {
    this.form.get('blocklyXml').setValue(xmlCode);
  }

  @HostListener('window:resize')
  public onWindowResize() {
    const element = this.parentFormDiv.nativeElement as HTMLElement;
    const formWidth = element.clientWidth - element.offsetLeft;
    document.body.style.setProperty('--blockly-log-width', `${formWidth}px`);
  }
}
