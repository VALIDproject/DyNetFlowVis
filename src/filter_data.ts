/**
 * Created by cniederer on 21.04.17.
 */
/**
 * Created by Florian on 12.04.2017.
 */

import * as events from 'phovea_core/src/event';
import * as d3 from 'd3';
import * as localforage from 'localforage';
import * as $ from 'jquery';
import * as bootbox from 'bootbox';
import 'ion-rangeslider';
import 'style-loader!css-loader!ion-rangeslider/css/ion.rangeSlider.css';
import 'style-loader!css-loader!ion-rangeslider/css/ion.rangeSlider.skinFlat.css';
import {MAppViews} from './app';
import {AppConstants} from './app_constants';
import FilterPipeline from './filters/filterpipeline';
import QuarterFilter from './filters/quarterFilter';
import TopFilter from './filters/topFilter';
import ParagraphFilter from './filters/paragraphFilter';
import EntityEuroFilter from './filters/entityEuroFilter';
import MediaEuroFilter from './filters/mediaEuroFilter';
import TimeFormat from './timeFormat';

class FilterData implements MAppViews {

  private $node: d3.Selection<any>;
  private pipeline: FilterPipeline;
  private quarterFilter: QuarterFilter;
  private topFilter: TopFilter;
  private paragraphFilter: ParagraphFilter;
  private quarterFilterRef;

  constructor(parent: Element, private options: any)
  {
    //Get FilterPipeline
    this.pipeline = FilterPipeline.getInstance();
    //Create Filters
    this.quarterFilter = new QuarterFilter();
    this.topFilter = new TopFilter();
    this.paragraphFilter = new ParagraphFilter();
    //Add Filters to Pipeline
    this.pipeline.changeTopFilter(this.topFilter); //must be first filter
    this.pipeline.addFilter(this.quarterFilter);
    this.pipeline.addAttributeFilter(this.paragraphFilter);

    this.$node = d3.select(parent)
      .append('div')
      .classed('filter', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<SankeyDiagram>}
   */
  init() {
    localforage.getItem('data').then((value) => {
      this.build();
      this.attachListener(value);
    });

    //Return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }


  /**
   * Build the basic DOM elements
   */
  private build() {
    this.$node.html(`
      <div class='container'>
        <div class='row'>
          <div class='col-sm-2'>
            <small>Top Filter</small>
          </div>
          <div class='col-sm-2'>
            <small>Paragraph Filter</small>
          </div>
        </div>

        <div class='row'>
          <div class='col-sm-2'>
            <select class='form-control input-sm' id='topFilter'>
              <option value='-1' selected>disabled</option>
              <option value='0'>Bottom 10</option>
              <option value='1'>Top 10</option>
            </select>
          </div>
          <div class='col-sm-2'>
            <div id='paragraph'>
            </div>
          </div>
        </div>
       </div>
       <div class='quarterSlider'>
        <input id='timeSlider'/>
       </div>
    `);
  }

  /**
   * Attach the event listeners
   */
  private attachListener(json) {
    //Set the filters only if data is available
    let dataAvailable = localStorage.getItem('dataLoaded') == 'loaded' ? true : false;
    if(dataAvailable) {
      this.setQuarterFilterRange(json);
      this.setParagraphFilterElements(json);
    }

    events.on(AppConstants.EVENT_FILTER_DEACTIVATE_TOP_FILTER, (evt, data) => {
      this.topFilter.active = false;
      $('#topFilter').val(-1);
    });

    //Listener for the change fo the top filter
    this.$node.select('#topFilter').on('change', (d) => {
      let value:number = $('#topFilter').val() as number;

      if(value == 0)
      {
        this.topFilter.active = true;
        this.topFilter.changeFilterTop(false);
      }
      else if(value == 1)
      {
        this.topFilter.active = true;
        this.topFilter.changeFilterTop(true);
      }
      else {
        this.topFilter.active = false;
      }
      events.fire(AppConstants.EVENT_FILTER_CHANGED, d, json);
    });

    //Listener for the change of the paragraph elements
    $('.paraFilter').on('change', (d) => {
      this.paragraphFilter.resetValues();

      $('.paraFilter').each((index, element) => {
        const value:number = $(element).val() as number;
        if($(element).is(':checked'))
        {
          this.paragraphFilter.addValue(value);
        }
      });

      events.fire(AppConstants.EVENT_FILTER_CHANGED, d, json);
    });

    events.on(AppConstants.EVENT_UI_COMPLETE, (evt, data) => {
      this.updateQuarterFilter(json);
      let filterQuarter = this.quarterFilter.meetCriteria(data);
      events.fire(AppConstants.EVENT_SLIDER_CHANGE, filterQuarter);
    });

    //Clears all filters and updates the appropriate sliders
    events.on(AppConstants.EVENT_CLEAR_FILTERS, (evt, data) => {
      this.updateQuarterFilter(json);
      let filterQuarter = this.quarterFilter.meetCriteria(json);
      d3.selectAll('input').property('checked', true);
      this.paragraphFilter.resetValues();

      $('.paraFilter').each((index, element) => {
        const value:number = $(element).val() as number;
        if($(element).is(':checked'))
        {
          this.paragraphFilter.addValue(value);
        }
      });

      events.fire(AppConstants.EVENT_SLIDER_CHANGE, filterQuarter);
      events.fire(AppConstants.EVENT_FILTER_DEACTIVATE_TOP_FILTER, 'changed');
      events.fire(AppConstants.EVENT_FILTER_CHANGED, 'changed');
    });
  }

  /**
   * This method adds all the elements and options for the paragraph filter.
   * @param json with the data to be added.
   */
  private setParagraphFilterElements(json)
  {
    let paragraphs:Array<number> = [];
    for(let entry of json)
    {
      let val:number = entry.attribute1;
      if(paragraphs.indexOf(val) === -1)
      {
        paragraphs.push(val);
        this.$node.select('#paragraph').append('input').attr('value',val).attr('type', 'checkbox')
          .attr('class','paraFilter').attr('checked', true);
        this.$node.select('#paragraph').append('b').attr('style', 'font-size: 1.0em; margin-left: 6px;').text('§'+val);
        this.$node.select('#paragraph').append('span').text(' ');
      }
    }
    this.paragraphFilter.values = paragraphs;
    d3.select('input[value = \'31\']').attr('checked', null);
    this.paragraphFilter.values = this.paragraphFilter.values.filter(e => e.toString() !== '31');
  }

  /**
   * This method adds the slider for the time range.
   * @param json with the data to be added.
   */
  private setQuarterFilterRange(json)
  {
    const timePoints = d3.set(
      json.map(function (d: any) { return d.timeNode; })
    ).values().sort();

    const newMin: number = Number(timePoints[0]);
    const newMax: number = Number(timePoints[timePoints.length - 1]);
    this.quarterFilter.changeRange(newMin, newMax);

    $('#timeSlider').ionRangeSlider({
      type: 'double',
      min: 0,
      max: timePoints.length - 1,
      from: 0,
      to: timePoints.length - 1,
      prettify: function (num) {
        return TimeFormat.format(timePoints[num]);
      },
      force_edges: true,  //Lets the labels inside the container
      drag_interval: true, //Allows the interval to be dragged around
      onFinish: (sliderData) => {
        // TODO here we rely on all timeNodes to be numbers
        let newMin: number = Number(timePoints[sliderData.from]);
        let newMax: number = Number(timePoints[sliderData.to]);
        this.quarterFilter.minValue = newMin;
        this.quarterFilter.maxValue = newMax;
        events.fire(AppConstants.EVENT_FILTER_CHANGED, json);

        //This notifies the sliders to change their values but only if the quarter slider changes
        let filterQuarter = this.quarterFilter.meetCriteria(json);
        events.fire(AppConstants.EVENT_SLIDER_CHANGE, filterQuarter);
      }
    });
    this.quarterFilterRef = $('#timeSlider').data('ionRangeSlider');
  }

  /**
   * This method updates the filter range of the quarter slider.
   * @param data the original data to read out the maximum number of time
   */
  private updateQuarterFilter(data) {
    const timePoints = d3.set(
      data.map(function (d: any) { return d.timeNode; })
    ).values().sort();

    const newMax: number = Number(timePoints[timePoints.length - 1]);
    this.quarterFilter.changeRange(newMax, newMax);
    this.quarterFilterRef.update({
      from: timePoints.length - 1,
      to: timePoints.length - 1
    });
  }
}

/**
 * Factory method to create a new SankeyDiagram instance
 * @param parent
 * @param options
 * @returns {SankeyDiagram}
 */
export function create(parent: Element, options: any) {
  return new FilterData(parent, options);
}
