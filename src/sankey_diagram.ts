/**
 * Created by Florian on 12.04.2017.
 */

import * as events from 'phovea_core/src/event';
import * as d3 from 'd3';
import * as localforage from 'localforage';
import * as $ from 'jquery';
import 'imports-loader?d3=d3!../lib/sankey.js';
import 'bootstrap-slider';
import 'style-loader!css-loader!bootstrap-slider/dist/css/bootstrap-slider.css';
import {AppConstants} from './app_constants';
import {MAppViews} from './app';
import {d3TextWrap} from './utilities';
import FilterPipeline from './filters/filterpipeline';
import EntityEuroFilter from './filters/entityEuroFilter';
import MediaEuroFilter from './filters/mediaEuroFilter';
import EntitySearchFilter from './filters/entitySearchFilter';
import MediaSearchFilter from './filters/mediaSearchFilter';


class SankeyDiagram implements MAppViews {

  private $node;
  private nodesToShow: number = 20;

  //Filters
  private pipeline: FilterPipeline;
  private entityEuroFilter: EntityEuroFilter;
  private mediaEuroFilter: MediaEuroFilter;
  private entitySearchFilter: EntitySearchFilter;
  private mediaSearchFilter: MediaSearchFilter;

  //Variables for the temporary nodes to show more
  private tempNodeLeft: string = 'Others';
  private tempNodeRight: string = 'More';
  private tempNodeVal: number = 20000;

  constructor(parent: Element, private options: any)
  {
    //Get FilterPipeline
    this.pipeline = FilterPipeline.getInstance();
    //Create Filters
    this.entityEuroFilter = new EntityEuroFilter();
    this.mediaEuroFilter = new MediaEuroFilter();
    this.entitySearchFilter = new EntitySearchFilter();
    this.mediaSearchFilter = new MediaSearchFilter();
    //Add Filters to pipeline
    this.pipeline.addFilter(this.entityEuroFilter);
    this.pipeline.addFilter(this.mediaEuroFilter);
    this.pipeline.changeEntitySearchFilter(this.entitySearchFilter);
    this.pipeline.changeMediaSearchFilter(this.mediaSearchFilter);

    this.$node = d3.select(parent)
      .append('div')
      .classed('sankey_diagram', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<SankeyDiagram>}
   */
  init() {
    this.build();
    this.attachListener();

    //Return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }


  /**
   * Build the basic DOM elements
   */
  private build() {
    let left = this.$node.append('div').attr('class', 'left_bars');
    this.$node.append('div').attr('class', 'sankey_vis').append('div').attr('class', 'sankey_heading').html('Flow');
    let right = this.$node.append('div').attr('class', 'right_bars').append('div').attr('class', 'right_bar_heading').html('Media Institution');

    // left.html(`
    //   <div class='left_bar_heading'>Public Entity</div>
    //   <div class='input-group input-group-sm'>
    //     <input type='text' id='entitySearchButton' class='form-control' placeholder='Search for...'>
    //     <span class='input-group-btn'>
    //       <button type='button' id='entitySearchButton' class='btn btn-primary'><i class='fa fa-hand-o-left'></i></button>
    //     </span>
    //   </div>
    // `);

    // right.html(`
    //   <div class='right_bar_heading'>Media Institution</div>
    // `);
    //
    // left.append('h4').text('Entity Search');
    // left.append('input').attr('id','entitySearchFilter');
    // left.append('button').text("Search").attr('type','button').attr('class', 'btn btn-primary').attr('id', 'entitySearchButton');
    // left.append('h4').text('Euro Filter');
    // left.append('input').attr('id', 'entityFilter');
    //
    // right.append('h4').text('Media Search');
    // right.append('input').attr('id','mediaSearchFilter');
    // right.append('button').text("Search").attr('type','button').attr('class', 'btn btn-primary').attr('id', 'mediaSearchButton');
    // right.append('h4').text('Euro Filter');
    // right.append('input').attr('id', 'mediaFilter');
  }

  /**
   * Attach the event listeners
   */
  private attachListener() {
    //This redraws if new data is available
    let dataAvailable = localStorage.getItem('dataLoaded') == 'loaded' ? true : false;
    if(dataAvailable) {
      this.getStorageData();
    }

    events.on(AppConstants.EVENT_DATA_PARSED, (evt, data) => {
      //Draw Sankey Diagram
      this.getStorageData();
    });

    events.on(AppConstants.EVENT_FILTER_CHANGED, (evt, data) => {
      this.$node.select('.sankey_vis').html('');
      //Redraw Sankey Diagram
      this.getStorageData();
    });


    this.$node.select('#entitySearchButton').on('click', (d) => {
      let value: string = $('#entitySearchFilter').val();
      this.entitySearchFilter.term = value;

      events.fire(AppConstants.EVENT_FILTER_DEACTIVATE_TOP_FILTER, d, null);
      events.fire(AppConstants.EVENT_FILTER_CHANGED, d, null);
    });

    this.$node.select('#mediaSearchButton').on('click', (d) => {
      let value: string = $('#mediaSearchFilter').val();
      this.mediaSearchFilter.term = value;

      events.fire(AppConstants.EVENT_FILTER_DEACTIVATE_TOP_FILTER, d, null);
      events.fire(AppConstants.EVENT_FILTER_CHANGED, d, null);
    });
  }

  /**
   * Just a handy method that can be called whenever the page is reloaded or when the data is ready.
   */
  private getStorageData()
  {
    localforage.getItem('data').then((value) => {
      //Store the unfiltered data too
      let originalData = value;

      //Filter the data before and then pass it to the draw function.
      let filteredData = this.pipeline.performFilters(value);

      // this.setEntityFilterRange(originalData);
      // this.setMediaFilterRange(originalData);
      this.buildSankey(filteredData, originalData);
    });
  }

  // private setEntityFilterRange(originalData: any): void
  // {
  //   this.entityEuroFilter.calculateMinMaxValues(originalData);
  //   let min: number = this.entityEuroFilter.minValue;
  //   let max: number = this.entityEuroFilter.maxValue;
  //
  //   $('#entityFilter').bootstrapSlider({
  //     min: Number(min),
  //     max: Number(max),
  //     range: true,
  //     tooltip_split: true,
  //     tooltip_position: 'bottom',
  //     value: [Number(min), Number(max)],
  //   }).on('slideStop', (d) => {
  //     console.log('triggered');
  //     let newMin: number = d.value[0];     //First value is left slider handle;
  //     let newMax: number = d.value[1];     //Second value is right slider handle;
  //     this.entityEuroFilter.minValue = newMin;
  //     this.entityEuroFilter.maxValue = newMax;
  //     events.fire(AppConstants.EVENT_FILTER_CHANGED, originalData);
  //   });
  // }
  //
  // private setMediaFilterRange(originalData: any): void
  // {
  //   this.mediaEuroFilter.calculateMinMaxValues(originalData);
  //   let min: number = this.mediaEuroFilter.minValue;
  //   let max: number = this.mediaEuroFilter.maxValue;
  //
  //   $('#mediaFilter').bootstrapSlider({
  //     min: Number(min),
  //     max: Number(max),
  //     range: true,
  //     tooltip_split: true,
  //     tooltip_position: 'bottom',
  //     value: [Number(min), Number(max)],
  //   }).on('slideStop', (d) => {
  //     let newMin: number = d.value[0];     //First value is left slider handle;
  //     let newMax: number = d.value[1];     //Second value is right slider handle;
  //     this.mediaEuroFilter.minValue = newMin;
  //     this.mediaEuroFilter.maxValue = newMax;
  //     events.fire(AppConstants.EVENT_FILTER_CHANGED, originalData);
  //   });
  // }

  /**
   * This function draws the whole sankey visualization by using the data which is passed from the storage.
   * @param json data from the read functionality
   */
  private buildSankey(json, origJson) {
    const that = this;
    const sankey = (<any>d3).sankey();
    const units = '€';

    let widthNode = this.$node.select('.sankey_vis').node().getBoundingClientRect().width;
    let heightNode = this.$node.select('.sankey_vis').node().getBoundingClientRect().height;

    const margin = { top: 10, right: 120, bottom: 10, left: 120 };
    const width =  widthNode  - margin.left - margin.right;
    const height = heightNode - margin.top - margin.bottom;
    const widthOffset = 80;

    //The "0" option enables zero-padding. The comma (",") option enables the use of a comma for a thousands separator.
    const formatNumber = d3.format(',.0f'),    // zero decimal places
      format = function(d) { return formatNumber(d) + ' ' + units; }; //Display number with unit sign

    //Append the svg canvas to the page
    const svg = d3.select('.sankey_vis').append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform','translate(' + (margin.left + widthOffset/2) + ',' + margin.top + ')');

    //Set the diagram properties
    sankey.nodeWidth(35)
      .nodePadding(20)
      .size([width - widthOffset, height]);

    console.log('Test3');

    const path = sankey.link();

    /**
     * OLD VERSION
     // Group Data (by quartal)
     let nest =(<any>d3).nest()
     .key(function (d) {return d.timeNode;})
     .entries(json);

     let graph = {'nodes' : [], 'links' : []};

     that.nodesToShow = Math.ceil((heightNode / 40) / nest.length);    //Trying to make nodes length dependent on space

     nest.forEach(function (d, i ) {
      console.log('d ', d);
      console.log('length values', d.values.length,'nodetoShow', that.nodesToShow );
      let max = (d.values.length < that.nodesToShow)?d.values.length:that.nodesToShow;
      console.log('max', max);
      for(var _v = 0; _v < max; _v++) {
        graph.nodes.push({ 'name': d.values[_v].sourceNode });//all Nodes
        graph.nodes.push({ 'name': d.values[_v].targetNode });//all Nodes

        graph.links.push({ 'source': d.values[_v].sourceNode,
        'target': d.values[_v].targetNode,
        'value': +d.values[_v].valueNode, 'time': d.values[_v].timeNode });
      }
    });

     console.log('nodes', graph.nodes, 'links', graph.links);
     */

      // Group Data (by quartal)
    let nest =(<any>d3).nest()
        .key((d) => {return d.sourceNode;})
        .key(function (d) {return d.targetNode;})
        .rollup(function (v) {return {
          target: v[0].targetNode,
          source: v[0].sourceNode,
          time: v[0].timeNode,
          sum: d3.sum(v, function (d :any){ return d.valueNode;})
        }})
        .entries(json);

    let graph = {'nodes' : [], 'links' : []};
    that.nodesToShow = Math.ceil((heightNode / 25));    //Trying to make nodes length dependent on space in window
    console.log("changed", that.nodesToShow);

    let counter = 0;
    for(let d of nest) {
      counter += d.values.length;
      if(counter >= 30) break;
      for (var v = 0; v <= d.values.length - 1; v++) {
        graph.nodes.push({ 'name': d.key });//all Nodes source
        graph.nodes.push({ 'name': d.values[v].key });//all Nodes target
        graph.links.push({ 'source': d.key,
          'target': d.values[v].key,
          'value': +d.values[v].values.sum,
          'time': d.values[v].values.time});
      }
    }

    //d3.keys - returns array of keys from the nest function
    //d3.nest - groups the values of an array by the given key
    //d3.map - constructs a new map and copies all enumerable properties from the specified object into this map.
    graph.nodes = (<any>d3).keys((<any>d3).nest()
      .key((d) => {return d.name;})
      .map(graph.nodes));

    //Add the fake node from last to 'more'
    // const lastSource = graph.links[graph.links.length - 1].source;
    // graph.links.push({'source': lastSource, 'target': this.tempNodeRight, 'time': '0', 'value': 0});

    //Add fake nodes generally
    graph.nodes.push(this.tempNodeLeft);
    graph.nodes.push(this.tempNodeRight);
    graph.links.push({'source': this.tempNodeLeft, 'target': this.tempNodeRight,
      'time':  '0', 'value': this.tempNodeVal});

    graph.links.forEach(function (d, i) {
      graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
      graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
    });

    //This makes out of the array of strings a array of objects with the key 'name'
    graph.nodes.forEach(function (d, i) {
      graph.nodes[i] = { 'name': d };
    });

    //Basic parameters for the diagram
    sankey
      .nodes(graph.nodes)
      //.links(linksorted)
      .links(graph.links)
      .layout(10); //Difference only by 0, 1 and otherwise always the same

    let link = svg.append('g').selectAll('.link')
      .data(graph.links)
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', path)
      .style('stroke-width', function(d) { return Math.max(1, d.dy); })
      //reduce edges crossing
      .sort(function(a, b) { return b.dy - a.dy; });

    //Add the link titles - Hover Path
    link.append('title')
      .text(function(d) {
        if(d.source.name == that.tempNodeLeft || d.target.name == that.tempNodeRight) {
          return d.source.name + ' → ' +
            d.target.name;
        } else {
          return d.source.name + ' → ' +
            d.target.name + '\n' + format(d.value);
        }
      });

    //Add the on 'click' listener for the links
    link.on('click', function(d) {
      events.fire(AppConstants.EVENT_CLICKED_PATH, d, origJson);
    });

    //Add in the nodes
    let node = svg.append('g').selectAll('.node')
      .data(graph.nodes)
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', function(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
      });

    //Add the rectangles for the nodes
    node.append('rect')
      .attr('height', function(d) { return d.dy; })
      .attr('width', sankey.nodeWidth())
      .style('fill', '#DA5A6B')
      //Title rectangle
      .append('title')
      .text(function(d) {
        if(d.name == that.tempNodeLeft || d.name == that.tempNodeRight) {
          return `${d.name}`;
        } else {
          return d.name + '\n' + format(d.value);
        }
      });

    //Add in the title for the nodes
    let heading = node.append('g').append('text')
      .attr('x', 45)
      .attr('y', function(d) { return (d.dy / 2) - 10;})
      .attr('dy', '1.0em')
      .attr('text-anchor', 'start')
      .attr('class', 'rightText')
      .text(function(d) {
        if(d.name == that.tempNodeLeft || d.name == that.tempNodeRight) {
          return `${d.name}`;
        } else {
          return `${format(d.value)} ${d.name}`;
        }
      })
      .filter(function(d, i) { return d.x < width / 2})
      .attr('x', -45 + sankey.nodeWidth())
      .attr('text-anchor', 'end')
      .attr('class', 'leftText');

    //The strange word wrapping. Resizes based on the svg size the sankey diagram size and the words and text size.
    const leftWrap = this.$node.selectAll('.leftText');
    const rightWrap = this.$node.selectAll('.rightText');
    const leftTextWidth = leftWrap.node().getBoundingClientRect().width;
    const rightTextWidth = rightWrap.node().getBoundingClientRect().width;
    const svgBox = {
      'width': width + margin.left + margin.right,
      'height': height + margin.top + margin.bottom
    };
    const wordWrapBorder = (svgBox.width - width) / 2;

    if(leftTextWidth > wordWrapBorder) {
      d3TextWrap(leftWrap, wordWrapBorder);
      leftWrap.attr('transform', 'translate(' + (wordWrapBorder + 5) * (-1) + ', 0)');
    }
    if(rightTextWidth > wordWrapBorder) {
      d3TextWrap(rightWrap, wordWrapBorder + 10);
      rightWrap.attr('transform', 'translate(' + ((wordWrapBorder - 45) / 2) + ', 0)');
    }
  }
}

/**
 * Factory method to create a new SankeyDiagram instance
 * @param parent
 * @param options
 * @returns {SankeyDiagram}
 */
export function create(parent: Element, options: any) {
  return new SankeyDiagram(parent, options);
}
