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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {AbstractControl, FormGroup} from '@angular/forms';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {Workspace} from '../../../../../core/store/navigation/workspace';
import {map, startWith} from 'rxjs/operators';
import {View} from '../../../../../core/store/views/view';
import {QueryData} from '../../../../../shared/top-panel/search-box/util/query-data';
import {ClipboardService} from '../../../../../core/service/clipboard.service';
import {PublicScriptType} from './public-script-type';
import {ConfigurationService} from '../../../../../configuration/configuration.service';

@Component({
  selector: 'project-template-script',
  templateUrl: './project-template-script.component.html',
  styleUrls: ['./project-template-script.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTemplateScriptComponent implements OnChanges, OnInit {
  @Input()
  public formGroup: FormGroup;

  @Input()
  public workspace: Workspace;

  @Input()
  public views: View[];

  @Input()
  public queryData: QueryData;

  public readonly scriptType = PublicScriptType;

  public scriptText$: Observable<string>;
  private workspace$ = new BehaviorSubject<Workspace>(null);
  public copied$ = new BehaviorSubject<boolean>(false);

  public get defaultViewControl(): AbstractControl {
    return this.formGroup.controls.defaultView;
  }

  constructor(private clipboardService: ClipboardService, private configurationService: ConfigurationService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.workspace) {
      this.workspace$.next(this.workspace);
    }
  }

  public get scriptTypeControl(): AbstractControl {
    return this.formGroup?.controls.scriptType;
  }

  public onViewSelected(viewId: string) {
    this.defaultViewControl.patchValue(viewId);
  }

  public ngOnInit() {
    this.initScriptText();
  }

  private initScriptText() {
    this.scriptText$ = combineLatest([this.workspace$, this.formGroup.valueChanges]).pipe(
      startWith([this.workspace, this.formGroup.value]),
      map(([workspace, value]) => {
        const showTopPanel = value.showTopPanel || false;
        const scriptSrc = this.configurationService.getConfiguration().publicScriptCdn;
        const language = this.configurationService.getConfiguration().locale;
        const view = value.defaultView ? `data-v="${value.defaultView}"` : '';
        const shortcodeView = value.defaultView ? `/${value.defaultView}` : '';
        const linkView = value.defaultView ? `&v=${value.defaultView}` : '';
        const scriptType = <PublicScriptType>value.scriptType || PublicScriptType.Html;

        switch (scriptType) {
          case PublicScriptType.Html:
            return `<script type="text/javascript" src="${scriptSrc}"
            data-o="${workspace?.organizationId}" data-p="${workspace?.projectId}" ${view}
            data-tp="${showTopPanel}" data-l="${language}"></script>`;
          case PublicScriptType.WordPress:
            return `[lumeer_embed code="${workspace?.organizationId}/${workspace?.projectId}${shortcodeView}" lang="${language}" show_panel="${showTopPanel}"]`;
          case PublicScriptType.Link:
            return `https://www.lumeer.io/app-demo?_o=${workspace?.organizationId}&_p=${workspace?.projectId}&tp=${showTopPanel}${linkView}&l=${language}`;
          default:
            return '';
        }
      })
    );
  }

  public copyValue(text: string) {
    this.clipboardService.copy(text);
    this.copied$.next(true);
    setTimeout(() => this.copied$.next(false), 3000);
  }

  public onScriptTypeSelected(publicScriptType: PublicScriptType) {
    this.scriptTypeControl?.patchValue(publicScriptType);
  }
}
