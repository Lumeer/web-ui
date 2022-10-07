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

import {GanttOptions, GanttSwimlane, GanttSwimlaneInfo, GanttSwimlaneType, GanttTask} from '@lumeer/lumeer-gantt';
import * as moment from 'moment';
import {COLOR_PRIMARY} from '../../../../core/constants';
import {ResourcesPermissions} from '../../../../core/model/allowed-permissions';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {Collection} from '../../../../core/store/collections/collection';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {
  GANTT_BAR_HEIGHT,
  GANTT_COLUMN_WIDTH,
  GANTT_DATE_FORMAT,
  GANTT_FONT_SIZE,
  GANTT_PADDING,
  GanttChartBarModel,
  GanttChartConfig,
  GanttChartStemConfig,
} from '../../../../core/store/gantt-charts/gantt-chart';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Query} from '../../../../core/store/navigation/query/query';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {contrastColor} from '../../../../shared/utils/color.utils';
import {
  isArray,
  isDateValid,
  isNotNullOrUndefined,
  isNullOrUndefined,
  isNumeric,
  toNumber,
} from '../../../../shared/utils/common.utils';
import {DataAggregatorAttribute, DataResourceChain} from '../../../../shared/utils/data/data-aggregator';
import {shadeColor} from '../../../../shared/utils/html-modifier';
import {aggregateDataValues, DataAggregationType} from '../../../../shared/utils/data/data-aggregation';
import {Md5} from '../../../../shared/utils/md5';
import {canCreateTaskByStemConfig} from './gantt-chart-util';
import {
  constraintContainsHoursInConfig,
  createDatesInterval,
  parseDateTimeByConstraint,
} from '../../../../shared/utils/date.utils';
import {
  DataObjectAggregator,
  DataObjectAttribute,
  DataObjectInfo,
} from '../../../../shared/utils/data/data-object-aggregator';
import {areArraysSame, fillWithNulls, uniqueValues} from '../../../../shared/utils/array.utils';
import {stripTextHtmlTags} from '../../../../shared/utils/data.utils';
import {
  Constraint,
  ConstraintData,
  ConstraintType,
  DocumentsAndLinksData,
  PercentageConstraintConfig,
  SelectConstraint,
  UnknownConstraint,
  userCanEditDataResource,
  UserConstraint,
} from '@lumeer/data-filters';
import {Configuration} from '../../../../../environments/configuration-type';
import {viewAttributeSettingsSortDefined} from '../../../../shared/settings/settings.util';
import {sortDataResourcesObjectsByViewSettings} from '../../../../shared/utils/data-resource.utils';
import {queryResourcesAreSame} from '../../../../core/model/query-attribute';
import {ViewSettings} from '../../../../core/store/view-settings/view-settings';

export interface GanttTaskMetadata {
  dataResource: DataResource;
  resource: AttributesResource;
  nameDataId: string;
  startDataId: string;
  endDataId: string;
  progressDataIds: string[];
  dataResourceChain: DataResourceChain[];
  swimlanesDataResourcesIds: string[];
  stemConfig: GanttChartStemConfig;
  swimlanes: GanttSwimlane[];
}

enum DataObjectInfoKeyType {
  Name = 'name',
  Start = 'start',
  End = 'end',
  Color = 'color',
  Progress = 'progress',
}

export class GanttChartConverter {
  private config: GanttChartConfig;
  private constraintData?: ConstraintData;

  private convertCount = 0;

  private dataObjectAggregator = new DataObjectAggregator<GanttSwimlane>(
    (value, constraint, data, aggregatorAttribute) =>
      this.formatDataAggregatorValue(value, constraint, data, aggregatorAttribute)
  );

  constructor(private formatter: SelectItemWithConstraintFormatter, private configuration: Configuration) {}

  public convert(
    config: GanttChartConfig,
    collections: Collection[],
    linkTypes: LinkType[],
    data: DocumentsAndLinksData,
    permissions: ResourcesPermissions,
    query: Query,
    settings: ViewSettings,
    constraintData: ConstraintData
  ): {options: GanttOptions; tasks: GanttTask[]} {
    this.config = config;
    this.constraintData = constraintData;

    let tasks = (query?.stems || []).reduce<GanttTask[]>((allTasks, stem, index) => {
      const stemData = data.dataByStems?.[index];
      this.dataObjectAggregator.updateData(
        collections,
        stemData?.documents || [],
        linkTypes,
        stemData?.linkInstances || [],
        stem,
        permissions,
        constraintData
      );
      allTasks.push(...this.convertByStem(index));
      return allTasks;
    }, []);

    if (viewAttributeSettingsSortDefined(settings)) {
      tasks = sortDataResourcesObjectsByViewSettings(
        tasks,
        settings,
        collections,
        linkTypes,
        constraintData,
        task => task.metadata.dataResource,
        task => task.metadata.resource,
        (a, b) => this.compareTasks(a, b)
      );
    } else {
      tasks = tasks.sort((t1, t2) => this.compareTasksByStartDate(t1, t2));
    }

    const options = this.createGanttOptions(config, permissions);
    this.convertCount++;
    return {options, tasks};
  }

  private compareTasks(t1: GanttTask, t2: GanttTask): number {
    const t1Swimlanes = t1.swimlanes?.map(s => s?.value) || [];
    const t2Swimlanes = t2.swimlanes?.map(s => s?.value) || [];

    if (areArraysSame(t1Swimlanes, t2Swimlanes)) {
      return this.compareTasksByStartDate(t1, t2);
    }
    return 0;
  }

  private compareTasksByStartDate(t1: GanttTask, t2: GanttTask): number {
    const t1Start = moment(t1.start, GANTT_DATE_FORMAT);
    const t2Start = moment(t2.start, GANTT_DATE_FORMAT);
    return t1Start.isAfter(t2Start) ? 1 : t1Start.isBefore(t2Start) ? -1 : 0;
  }

  private createGanttOptions(config: GanttChartConfig, permissions: ResourcesPermissions): GanttOptions {
    const createTasks = (config.stemsConfigs || []).some(stemConfig =>
      canCreateTaskByStemConfig(stemConfig, permissions)
    );
    const sizeMultiplier = config.zoom || 1;
    return {
      swimlaneInfo: this.convertSwimlaneInfo(config),
      resizeTaskRight: true,
      resizeProgress: true,
      resizeTaskLeft: true,
      resizeSwimlanes: true,
      dragTaskSwimlanes: true,
      createTasks,
      language: this.configuration.locale,
      lockResize: config.lockResize || false,
      dateFormat: GANTT_DATE_FORMAT,
      initialScroll: config.positionSaved && config.position && this.convertCount === 0 ? config.position.value : null,
      viewMode: config.mode as any,
      padding: sizeMultiplier * GANTT_PADDING,
      columnWidth: sizeMultiplier * GANTT_COLUMN_WIDTH,
      barHeight: sizeMultiplier * GANTT_BAR_HEIGHT,
      fontSize: sizeMultiplier * GANTT_FONT_SIZE,
      headerFontSize: sizeMultiplier * GANTT_FONT_SIZE,
      swimlaneFontSize: sizeMultiplier * GANTT_FONT_SIZE,
    };
  }

  private convertSwimlaneInfo(config: GanttChartConfig): GanttSwimlaneInfo[] {
    const categoriesArrays = (config.stemsConfigs || []).reduce<GanttChartBarModel[][]>((arr, stemConfig) => {
      (stemConfig.categories || []).forEach((category, index) => {
        if (arr[index]) {
          arr[index].push(category);
        } else {
          arr[index] = [category];
        }
      });
      return arr;
    }, []);
    const categoriesLength = categoriesArrays.length;

    (config.stemsConfigs || []).forEach(stemConfig => {
      (stemConfig.attributes || []).forEach((attribute, attributeIndex) => {
        const index = attributeIndex + categoriesLength;
        if (categoriesArrays[index]) {
          categoriesArrays[index].push(attribute);
        } else {
          categoriesArrays[index] = [attribute];
        }
      });
    }, []);

    return categoriesArrays.map((categories, index) =>
      this.convertGanttBarToSwimlaneInfo(categories, config.swimlaneWidths?.[index], index >= categoriesLength)
    );
  }

  private convertGanttBarToSwimlaneInfo(
    models: GanttChartBarModel[],
    width: number,
    isStatic: boolean
  ): GanttSwimlaneInfo {
    let title = '';
    let background = null;
    if (models?.length) {
      const backgrounds = [];
      const titles = [];
      models.forEach(model => {
        const resource = this.dataObjectAggregator.getResource(model);
        if (resource) {
          backgrounds.push(shadeColor((<Collection>resource).color, 0.5));
          titles.push(findAttribute(resource?.attributes, model.attributeId)?.name);
        }
      });
      background = uniqueValues(backgrounds).length === 1 ? backgrounds[0] : null;
      title = uniqueValues(titles).join(', ');
    }
    return {
      background,
      color: COLOR_PRIMARY,
      static: isStatic,
      width,
      title,
    };
  }

  private convertByStem(index: number): GanttTask[] {
    const stemConfig = this.config?.stemsConfigs?.[index];
    if (this.requiredPropertiesAreSet(stemConfig)) {
      return this.convertByAggregation(stemConfig);
    }
    return [];
  }

  private maximumSwimlanes(): number {
    return (this.config?.stemsConfigs || []).reduce(
      (max, stemConfig) => Math.max(max, stemConfig.categories?.length || 0),
      0
    );
  }

  private convertByAggregation(stemConfig: GanttChartStemConfig): GanttTask[] {
    const groupingAttributes = (stemConfig.categories || []).filter(category => !!category);
    const objectAttributes: DataObjectAttribute[] = [
      stemConfig.name && {...stemConfig.name, key: DataObjectInfoKeyType.Name},
      stemConfig.start && {...stemConfig.start, key: DataObjectInfoKeyType.Start},
      stemConfig.end && {...stemConfig.end, key: DataObjectInfoKeyType.End},
    ].filter(attribute => !!attribute);
    const metaAttributes: DataObjectAttribute[] = [
      stemConfig.color && {...stemConfig.color, key: DataObjectInfoKeyType.Color},
      stemConfig.progress && {
        ...stemConfig.progress,
        key: DataObjectInfoKeyType.Progress,
      },
    ].filter(attribute => !!attribute);

    const dataObjectsInfo = this.dataObjectAggregator.convert({
      groupingAttributes,
      objectAttributes,
      metaAttributes,
      objectsConverter: (value, attribute) => this.formatSwimlaneValue(value, attribute),
    });

    return this.createGanttTasksForStem(stemConfig, dataObjectsInfo);
  }

  private createGanttTasksForStem(
    stemConfig: GanttChartStemConfig,
    dataObjectsInfo: DataObjectInfo<GanttSwimlane>[]
  ): GanttTask[] {
    const nameResource = this.dataObjectAggregator.getResource(stemConfig.name);
    const nameConstraint = this.dataObjectAggregator.findAttributeConstraint(stemConfig.name);

    const startResource = this.dataObjectAggregator.getResource(stemConfig.start);
    const startPermission = this.dataObjectAggregator.attributePermissions(stemConfig.start);
    const startConstraint = this.dataObjectAggregator.findAttributeConstraint(stemConfig.start);

    const endResource = this.dataObjectAggregator.getResource(stemConfig.end);
    const endPermission = this.dataObjectAggregator.attributePermissions(stemConfig.end);
    const endConstraint = this.dataObjectAggregator.findAttributeConstraint(stemConfig.end);

    const progressResource = this.dataObjectAggregator.getResource(stemConfig.progress);
    const progressPermission = this.dataObjectAggregator.attributePermissions(stemConfig.progress);
    const progressConstraint = this.dataObjectAggregator.findAttributeConstraint(stemConfig.progress);

    const attributesConstraints = (stemConfig.attributes || []).map(model => this.findColumnConstraint(model));

    const {editableTaskIds, dataResourcesMap, validTaskIds, intervalsMap, parentChildren} = computeTasksData(
      this.dataObjectAggregator,
      stemConfig,
      dataObjectsInfo,
      this.constraintData
    );

    const dataModel = stemConfig.start || stemConfig.name;
    const canEditDependencies = dataModel?.resourceType === AttributesResourceType.Collection;

    const maximumSwimlanes = this.maximumSwimlanes();
    return dataObjectsInfo
      .filter(item => validTaskIds.includes(helperDataId(item)))
      .reduce<GanttTask[]>((arr, item) => {
        const taskId = helperDataId(item);
        const interval = intervalsMap[taskId];

        const nameDataResource = dataResourcesMap[taskId]?.name;
        const startDataResource = dataResourcesMap[taskId]?.start;
        const endDataResource = dataResourcesMap[taskId]?.end;

        const taskStartResource = interval.swapped ? endResource : startResource;
        const taskEndResource = interval.swapped ? startResource : endResource;

        const taskStartPermission = interval.swapped ? endPermission : startPermission;
        const taskEndPermission = interval.swapped ? startPermission : endPermission;

        const taskStartConstraint = interval.swapped ? endConstraint : startConstraint;
        const taskEndConstraint = interval.swapped ? startConstraint : endConstraint;

        const progressDataResources = item.metaDataResources[DataObjectInfoKeyType.Progress] || [];
        const colorDataResources = item.metaDataResources[DataObjectInfoKeyType.Color] || [];

        const name = stemConfig.name && nameDataResource?.data?.[stemConfig.name.attributeId];

        const progresses =
          (stemConfig.progress &&
            progressDataResources.map(dataResource => dataResource.data[stemConfig.progress.attributeId])) ||
          [];
        const dataAggregationType = stemConfig.progress?.aggregation || DataAggregationType.Avg;
        const progressRaw = aggregateDataValues(dataAggregationType, progresses, progressConstraint, true);
        const progress = progressConstraint.createDataValue(progressRaw).format();

        const resourceColor = this.dataObjectAggregator.getAttributeResourceColor(stemConfig.name || stemConfig.start);
        const taskColor = this.dataObjectAggregator.getAttributeColor(stemConfig.color, colorDataResources);

        const metadata: GanttTaskMetadata = {
          dataResource: nameDataResource || startDataResource,
          resource: nameResource || taskStartResource,
          nameDataId: nameDataResource?.id,
          startDataId: startDataResource?.id,
          endDataId: endDataResource?.id,
          progressDataIds: (progressDataResources || []).map(dataResource => dataResource.id),
          swimlanesDataResourcesIds: (item.groupingDataResources || []).map(dataResource => dataResource.id),
          dataResourceChain: item.dataResourcesChain,
          swimlanes: [...(item.groupingObjects || [])],
          stemConfig: interval.swapped ? {...stemConfig, start: stemConfig.end, end: stemConfig.start} : stemConfig,
        };

        const attributesSwimlanes: GanttSwimlane[] = (metadata.stemConfig.attributes || []).map((model, index) => {
          let dataResource = null;
          if (queryResourcesAreSame(model, metadata.stemConfig.name)) {
            dataResource = nameDataResource;
          } else if (queryResourcesAreSame(model, metadata.stemConfig.start)) {
            dataResource = startDataResource;
          } else if (queryResourcesAreSame(model, metadata.stemConfig.end)) {
            dataResource = endDataResource;
          }

          const value = dataResource?.data?.[model.attributeId];
          return this.formatSwimlaneValueByConstraint(value, attributesConstraints[index]);
        });

        let minProgress,
          maxProgress = null;
        if (progressConstraint && progressConstraint.type === ConstraintType.Percentage) {
          const config = progressConstraint.config as PercentageConstraintConfig;
          minProgress = isNotNullOrUndefined(config.minValue) ? Math.max(0, config.minValue) : null;
          maxProgress = isNotNullOrUndefined(config.maxValue) ? config.maxValue : null;
        }

        const userCanEditStart = userCanEditDataResource(
          startDataResource,
          taskStartResource,
          taskStartPermission,
          this.constraintData?.currentUser,
          this.constraintData
        );
        const userCanEditEnd = userCanEditDataResource(
          endDataResource,
          taskEndResource,
          taskEndPermission,
          this.constraintData?.currentUser,
          this.constraintData
        );

        const startEditable = this.dataObjectAggregator.isAttributeEditable(
          metadata.stemConfig.start,
          startDataResource
        );
        const endEditable = this.dataObjectAggregator.isAttributeEditable(metadata.stemConfig.end, endDataResource);
        const progressEditable = this.dataObjectAggregator.isAttributeEditable(
          metadata.stemConfig.progress,
          progressDataResources[0]
        );

        const names = isArray(name) ? name : [name];
        for (let i = 0; i < names.length; i++) {
          let nameFormatted = nameConstraint.createDataValue(names[i], this.constraintData).preview();
          if (nameConstraint.type === ConstraintType.Text) {
            nameFormatted = stripTextHtmlTags(nameFormatted, false);
          }

          const barColor = taskColor
            ? metadata.stemConfig.progress
              ? shadeColor(taskColor, 0.3)
              : taskColor
            : shadeColor(resourceColor, 0.5);
          const taskId = helperDataId(item);
          const dataResourceId = (nameDataResource || startDataResource).id;
          const startDrag = startEditable && userCanEditStart;
          const endDrag = endEditable && userCanEditEnd;
          const draggable =
            (startDrag && (endDrag || taskEndConstraint?.type === ConstraintType.Duration)) ||
            (endDrag && (startDrag || taskStartConstraint?.type === ConstraintType.Duration));

          arr.push({
            id: taskId,
            name: nameFormatted,
            start: interval.start,
            end: interval.end,
            progress: createProgress(progress),
            dependencies: (canEditDependencies && parentChildren[dataResourceId]) || [],
            allowedDependencies: canEditDependencies ? editableTaskIds.filter(id => id !== taskId) : [],
            barColor,
            progressColor: taskColor || shadeColor(resourceColor, 0.3),
            startDrag,
            endDrag,
            draggable,
            progressDrag:
              progressEditable &&
              metadata.progressDataIds.length === 1 &&
              userCanEditDataResource(
                progressDataResources[0],
                progressResource,
                progressPermission,
                this.constraintData?.currentUser,
                this.constraintData
              ),
            textColor: contrastColor(barColor),
            swimlanes: [...fillWithNulls(metadata.swimlanes, maximumSwimlanes), ...attributesSwimlanes],
            minProgress,
            maxProgress,
            metadata,
          });
        }

        return arr;
      }, []);
  }

  private findColumnConstraint(model: GanttChartBarModel): Constraint {
    const constraint = this.dataObjectAggregator.findAttributeConstraint(model);
    const overrideConstraint =
      model?.constraint && this.formatter.checkValidConstraintOverride(constraint, model.constraint);
    return overrideConstraint || constraint || new UnknownConstraint();
  }

  private requiredPropertiesAreSet(stemConfig: GanttChartStemConfig): boolean {
    return !!stemConfig.start && !!stemConfig.end;
  }

  private formatSwimlaneValue(value: any, barModel: GanttChartBarModel): GanttSwimlane | null {
    const constraint = this.dataObjectAggregator.findAttributeConstraint(barModel);
    const overrideConstraint =
      barModel?.constraint && this.formatter.checkValidConstraintOverride(constraint, barModel.constraint);

    const resultConstraint = overrideConstraint || constraint || new UnknownConstraint();
    return this.formatSwimlaneValueByConstraint(value, resultConstraint);
  }

  private formatSwimlaneValueByConstraint(value: any, constraint: Constraint): GanttSwimlane | null {
    const formattedValue = constraint.createDataValue(value, this.constraintData).format();
    if (formattedValue) {
      if (constraint.type === ConstraintType.Color) {
        return {background: formattedValue, value: formattedValue, title: ''};
      } else if (constraint.type === ConstraintType.Boolean) {
        return {title: '', value: value, type: GanttSwimlaneType.Checkbox};
      }

      const textBackground = this.swimlaneBackground(value, constraint);
      const textColor = textBackground && contrastColor(textBackground);
      return {
        value,
        title: this.swimlaneTitle(formattedValue, constraint),
        textBackground,
        textColor,
        avatarUrl: this.swimlaneAvatarUrl(value, constraint),
      };
    }
    return {value: '', title: ''};
  }

  private swimlaneBackground(value: any, constraint: Constraint): string {
    if (constraint.type === ConstraintType.Select) {
      const options = (<SelectConstraint>constraint).createDataValue(value).options;
      return options && options[0] && options[0].background;
    }
    return null;
  }

  private swimlaneAvatarUrl(value: any, constraint: Constraint): string {
    if (constraint.type === ConstraintType.User && isNotNullOrUndefined(value)) {
      const md5hash = Md5.hashStr(String(value || ''));
      return `https://www.gravatar.com/avatar/${md5hash}?r=g&d=retro`;
    }

    return null;
  }

  private swimlaneTitle(formattedValue: string, constraint: Constraint): string {
    if (constraint.type === ConstraintType.User && (<UserConstraint>constraint).config?.onlyIcon) {
      return '';
    }
    return formattedValue;
  }

  private formatDataAggregatorValue(
    value: any,
    constraint: Constraint,
    data: ConstraintData,
    aggregatorAttribute: DataAggregatorAttribute
  ): any {
    const ganttConstraint = aggregatorAttribute.data && (aggregatorAttribute.data as Constraint);
    const overrideConstraint =
      ganttConstraint && this.formatter.checkValidConstraintOverride(constraint, ganttConstraint);
    const finalConstraint = overrideConstraint || constraint || new UnknownConstraint();
    const dataValue = finalConstraint.createDataValue(value, data);

    switch (finalConstraint.type) {
      case ConstraintType.Select:
      case ConstraintType.User:
      case ConstraintType.View:
      case ConstraintType.Boolean:
        const value = dataValue.serialize();
        return isArray(value) ? value[0] : value;
      default:
        return dataValue.format();
    }
  }
}

function isTaskValid(start: string, startConstraint: Constraint, end: string, endConstraint: Constraint): boolean {
  return areDatesValid(start, startConstraint, end, endConstraint);
}

function areDatesValid(start: string, startConstraint: Constraint, end: string, endConstraint: Constraint): boolean {
  if (startConstraint.type === ConstraintType.Duration) {
    return start && isDateValidRange(end);
  }
  if (endConstraint.type === ConstraintType.Duration) {
    return end && isDateValidRange(start);
  }
  return isDateValidRange(start) && isDateValidRange(end);
}

function isDateValidRange(dateString: string): boolean {
  const startDate = parseDateTimeByConstraint(dateString, null);
  const momentDate = startDate && moment(startDate);
  return isDateValid(startDate) && momentDate.year() > 1970 && momentDate.year() < 2200;
}

function createProgress(progress: any): number {
  if (isNullOrUndefined(progress)) {
    return 0;
  }

  const progressWithoutPercent = progress.toString().replace(/%*$/g, '');
  if (isNumeric(progressWithoutPercent)) {
    return Math.max(toNumber(progressWithoutPercent), 0);
  }
  return 0;
}

function computeTasksData(
  dataObjectAggregator: DataObjectAggregator<GanttSwimlane>,
  stemConfig: GanttChartStemConfig,
  dataObjectsInfo: DataObjectInfo<GanttSwimlane>[],
  constraintData: ConstraintData
): GanttTasksData {
  const nameResource = dataObjectAggregator.getResource(stemConfig.name);
  const namePermission = dataObjectAggregator.attributePermissions(stemConfig.name);

  const startResource = dataObjectAggregator.getResource(stemConfig.start);
  const startPermission = dataObjectAggregator.attributePermissions(stemConfig.start);
  const startConstraint = dataObjectAggregator.findAttributeConstraint(stemConfig.start);

  const endConstraint = dataObjectAggregator.findAttributeConstraint(stemConfig.end);

  return dataObjectsInfo.reduce<GanttTasksData>(
    (data, item) => {
      const nameDataResource = item.objectDataResources[DataObjectInfoKeyType.Name];
      const startDataResource = item.objectDataResources[DataObjectInfoKeyType.Start];
      const endDataResource = item.objectDataResources[DataObjectInfoKeyType.End];

      const start = stemConfig.start && startDataResource?.data?.[stemConfig.start.attributeId];
      const end = stemConfig.end && endDataResource?.data?.[stemConfig.end.attributeId];
      if (isTaskValid(start, startConstraint, end, endConstraint)) {
        const id = helperDataId(item);
        data.validTaskIds.push(id);

        const interval = createInterval(start, startConstraint, end, endConstraint, constraintData);
        data.intervalsMap[id] = interval;

        const dataResource = nameDataResource || startDataResource;
        if (
          userCanEditDataResource(
            dataResource,
            nameResource || startResource,
            namePermission || startPermission,
            constraintData?.currentUser,
            constraintData
          )
        ) {
          data.editableTaskIds.push(id);
        }
        const parentId = (<DocumentModel>dataResource).metaData?.parentId;
        if (parentId) {
          if (!data.parentChildren[parentId]) {
            data.parentChildren[parentId] = [];
          }
          data.parentChildren[parentId].push(id);
        }

        data.dataResourcesMap[id] = {
          name: nameDataResource,
          start: interval.swapped ? endDataResource : startDataResource,
          end: interval.swapped ? startDataResource : endDataResource,
        };
      }
      return data;
    },
    {
      intervalsMap: {},
      editableTaskIds: [],
      validTaskIds: [],
      parentChildren: {},
      dataResourcesMap: {},
    }
  );
}

function createInterval(
  startString: string,
  startConstraint: Constraint,
  endString: string,
  endConstraint: Constraint,
  constraintData: ConstraintData
): GanttInterval {
  const {
    start: startDate,
    startUtc,
    end: endDate,
    endUtc,
    swapped,
  } = createDatesInterval(startString, startConstraint, endString, endConstraint, constraintData);

  if (swapped) {
    startConstraint = endConstraint;
    endConstraint = startConstraint;
  }

  let startMoment = startUtc ? moment.utc(startDate) : moment(startDate);
  if (startConstraint?.type !== ConstraintType.Duration && !constraintContainsHoursInConfig(startConstraint)) {
    startMoment = startMoment.startOf('day');
  }

  let endMoment = endUtc ? moment.utc(endDate) : moment(endDate);
  if (
    startConstraint?.type !== ConstraintType.Duration &&
    endConstraint?.type !== ConstraintType.Duration &&
    !constraintContainsHoursInConfig(endConstraint)
  ) {
    endMoment = endMoment.startOf('day').add(1, 'days');
  }

  return {
    start: startMoment.format(GANTT_DATE_FORMAT),
    end: endMoment.format(GANTT_DATE_FORMAT),
    swapped,
  };
}

function helperDataId(data: DataObjectInfo<GanttSwimlane>): string {
  const nameDataResource = data.objectDataResources[DataObjectInfoKeyType.Name];
  const startDataResource = data.objectDataResources[DataObjectInfoKeyType.Start];
  const endDataResource = data.objectDataResources[DataObjectInfoKeyType.End];
  return [nameDataResource, startDataResource, endDataResource]
    .filter(resource => isNotNullOrUndefined(resource))
    .map(resource => resource.id)
    .join(':');
}

interface GanttInterval {
  start: string;
  end?: string;
  swapped?: boolean;
}

interface GanttTasksData {
  intervalsMap: Record<string, GanttInterval>;
  validTaskIds: string[];
  editableTaskIds: string[];
  parentChildren: Record<string, string[]>;
  dataResourcesMap: Record<
    string,
    {
      name: DataResource;
      start: DataResource;
      end: DataResource;
    }
  >;
}
