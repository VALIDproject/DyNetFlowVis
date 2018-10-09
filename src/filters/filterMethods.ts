/**
 * Created by Florian on 17.08.2017.
 */
import * as events from 'phovea_core/src/event';
import * as d3 from 'd3';
import * as localforage from 'localforage';
import * as $ from 'jquery';
import 'ion-rangeslider';
import 'style-loader!css-loader!ion-rangeslider/css/ion.rangeSlider.css';
import 'style-loader!css-loader!ion-rangeslider/css/ion.rangeSlider.skinNice.css';
import {AppConstants} from '../app_constants';
import {roundToFull, applyTagChangesToNode} from '../utilities';
import FilterPipeline from './filterpipeline';
import EntityEuroFilter from './entityEuroFilter';
import MediaEuroFilter from './mediaEuroFilter';
import EntitySearchFilter from './entitySearchFilter';
import MediaSearchFilter from './mediaSearchFilter';
import PaymentEuroFilter from './paymentEuroFilter';
import SimpleLogging from '../simpleLogging';

let entityFilterRef;
let mediaFilterRef;
let valueFilterRef;

/**
 * This method creates the slider for the entity range filter with given parameters.
 * @param filter the filter data
 * @param elemName the element where the slider gets created on
 * @param data the data for the slider to dermin the range
 */
export function setEntityFilterRange(filter, elemName: string, data: any)
{
  filter.calculateMinMaxValues(data);
  const myMin: number = filter.minValue;
  const myMax: number = filter.maxValue;

  const columnLabels : any = JSON.parse(localStorage.getItem('columnLabels'));
  const valuePostFix = (columnLabels == null) ? '' : columnLabels.valueNode;

  $(elemName).ionRangeSlider({
    type: 'double',
    min: myMin,
    max: myMax,
    prettify_enabled: true,
    prettify_separator: '.',
    postfix: ' ' + valuePostFix,
    force_edges: true,          // Lets the labels inside the container
    min_interval: myMin * 2,    // Forces at least 1000 to be shown in order to prevent errors
    drag_interval: true,        // Allows the interval to be dragged around
    onFinish: (sliderData) => {
      const newMin: number = sliderData.from;
      const newMax: number = sliderData.to;
      filter.minValue = newMin;
      filter.maxValue = newMax;

      $('.left_bars').find('.irs-bar').css('background', '#DA5A6B');
      SimpleLogging.log('source value slider', [newMin, newMax]);
      events.fire(AppConstants.EVENT_FILTER_CHANGED, data);
    },
  });

  entityFilterRef = $(elemName).data('ionRangeSlider');    //Store instance to update it later
}

/**
 * This method is used in order ot update the entity range slider.
 * @param filter the filter with the base data
 * @param data the data to update the slider with
 */
export function updateEntityRange(filter, data: any) {
  filter.calculateMinMaxValues(data);
  const myMin: number = filter.minValue;
  const myMax: number = filter.maxValue;

  entityFilterRef.update({
    min: myMin,
    max: myMax,
    from: myMin,
    to: myMax
  });
}

/**
 * This function returns a reference to the entity range slider.
 * @returns {any} a reference to the slider
 */
export function getEntityRef() {
  return entityFilterRef;
}

/**
 * This method creates the slider for the media range filter with given parameters.
 * @param filter the filter data
 * @param elemName the element where the slider gets created on
 * @param data the data for the slider to dermin the range
 */
export function setMediaFilterRange(filter, elemName: string, data: any): void
{
  filter.calculateMinMaxValues(data);
  const myMin: number = filter.minValue;
  const myMax: number = filter.maxValue;

  const columnLabels : any = JSON.parse(localStorage.getItem('columnLabels'));
  const valuePostFix = (columnLabels == null) ? '' : columnLabels.valueNode;

  $(elemName).ionRangeSlider({
    type: 'double',
    min: myMin,
    max: myMax,
    prettify_enabled: true,
    prettify_separator: '.',
    postfix: ' ' + valuePostFix,
    force_edges: true,            // Lets the labels inside the container
    min_interval: myMin * 2,      // Forces at least 1000 to be shown in order to prevent errors
    drag_interval: true,          // Allows the interval to be dragged around
    onFinish: (sliderData) => {
      const newMin: number = sliderData.from;
      const newMax: number = sliderData.to;
      filter.minValue = newMin;
      filter.maxValue = newMax;

      $('.right_bars').find('.irs-bar').css('background', '#DA5A6B');
      SimpleLogging.log('target value slider', [newMin, newMax]);
      events.fire(AppConstants.EVENT_FILTER_CHANGED, data);
    }
  });

  mediaFilterRef = $(elemName).data('ionRangeSlider');    //Store instance to update it later
}

/**
 * This method is used in order ot update the media range slider.
 * @param filter the filter with the base data
 * @param data the data to update the slider with
 */
export function updateMediaRange(filter, data: any) {
  filter.calculateMinMaxValues(data);
  const myMin: number = filter.minValue;
  const myMax: number = filter.maxValue;

  mediaFilterRef.update({
    min: myMin,
    max: myMax,
    from: myMin,
    to: myMax
  });
}

/**
 * This function returns a reference to the media range slider.
 * @returns {any} a reference to the slider
 */
export function getMediaRef() {
  return mediaFilterRef;
}

/**
 * This method creates the slider for the value range filter with given parameters.
 * @param filter the filter data
 * @param elemName the element where the slider gets created on
 * @param data the data for the slider to dermin the range
 */
export function setEuroFilterRange(filter, elemName: string, data: any): void {
  let myMin: number = data[0].valueNode;
  let myMax: number = data[0].valueNode;
  for (let entry of data) {
    let value: number = Number(entry.valueNode);
    if (value < myMin) myMin = value;
    if (value > myMax) myMax = value;
  }
  filter.changeRange(myMin, myMax);

  const columnLabels : any = JSON.parse(localStorage.getItem('columnLabels'));
  const valuePostFix = (columnLabels == null) ? '' : columnLabels.valueNode;

  $(elemName).ionRangeSlider({
    type: 'double',
    min: myMin,
    max: myMax,
    prettify_enabled: true,
    prettify_separator: '.',
    postfix: ' ' + valuePostFix,
    force_edges: true,            // Lets the labels inside the container
    min_interval: myMin * 2,      // Forces at least 1000 to be shown in order to prevent errors
    drag_interval: true,          // Allows the interval to be dragged around
    onFinish: (sliderData) => {
      const newMin: number = sliderData.from;
      const newMax: number = sliderData.to;
      filter.minValue = newMin;
      filter.maxValue = newMax;

      $('.middle_bars').find('.irs-bar').css('background', '#DA5A6B');
      SimpleLogging.log('flow value slider', [newMin, newMax]);
      events.fire(AppConstants.EVENT_FILTER_CHANGED, data);
    }
  });

  valueFilterRef = $(elemName).data('ionRangeSlider');    //Store instance to update it later
}

/**
 * This method is used in order ot update the value range slider.
 * @param filter the filter with the base data
 * @param data the data to update the slider with
 */
export function updateEuroRange(filter, data: any) {
  let min: number = data[0].valueNode;
  let max: number = data[0].valueNode;
  for (let entry of data) {
    let value: number = Number(entry.valueNode);
    if (value < min) min = value;
    if (value > max) max = value;
  }
  filter.changeRange(min, max);

  valueFilterRef.update({
    min: min,
    max: max,
    from: min,
    to: max
  });
}

/**
 * This function returns a reference to the value range slider.
 * @returns {any} a reference to the slider
 */
export function getValueRef() {
  return valueFilterRef;
}

/**
 * This method creates a set containing all the legal entity tags
 * @param filter the filter data
 * @param data the data to create the tag set with
 */
export function setEntityTagFilter(filter, data: any)
{
  let tags:d3.Set = d3.set([]);

  let dataWithTags: any = data.filter((entry) => (entry.sourceTag !== '')  && (entry.sourceTag !== undefined));

  if (dataWithTags.length > 0) {
    dataWithTags = d3.nest<any>()
      .key(function (d) {
        return d.sourceNode;
      })
      .rollup(function (leaves) {
        let nodeTags = d3.set([]);
        for (const leaf of leaves) {
          var values = leaf.sourceTag.split("|");
          values.forEach(function (value) {
            var val = value.trim();
            nodeTags.add(val);
            if (!tags.has(val))
              tags.add(val);
          })
        }
        return nodeTags.values().join(" | ");
      })
      .entries(dataWithTags);

    localforage.getItem('data').then((value) => {
      return applyTagChangesToNode(value, dataWithTags);
    });
  }

  filter.availableTags = tags;
}

/**
 * This method creates a set containing all the media entity tags
 * @param filter the filter data
 * @param data the data to create the tag set with
 */
export function setMediaTagFilter(filter, data: any)
{
  let tags:d3.Set = d3.set([]);

  let dataWithTags: any = data.filter((entry) => (entry.targetTag !== '')  && (entry.targetTag !== undefined));

  if (dataWithTags.length > 0) {
    dataWithTags = d3.nest<any>()
      .key(function (d) {
        return d.targetNode;
      })
      .rollup(function (leaves) {
        let nodeTags = d3.set([]);
        for (const leaf of leaves) {
          var values = leaf.targetTag.split("|");
          values.forEach(function (value) {
            var val = value.trim();
            nodeTags.add(val);
            if (!tags.has(val))
              tags.add(val);
          })
        }
        return nodeTags.values().join(" | ");
      })
      .entries(dataWithTags);

    localforage.getItem('data').then((value) => {
      return applyTagChangesToNode(value, dataWithTags);
    });
  }

  filter.availableTags = tags;
}
