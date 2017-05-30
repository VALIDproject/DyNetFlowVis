/**
* Created by Florian on 12.04.2017.
*/

import * as events from 'phovea_core/src/event';
import * as d3 from 'd3';
import {MAppViews} from './app';
import 'imports-loader?d3=d3!../lib/sankey.js';
import {AppConstants} from './app_constants';

class SankeyDetail implements MAppViews {

  private $node;
  private isOpen = false;
  private detailSVG;


  constructor(parent: Element, private options: any) {
    this.$node = d3.select(parent);
    // .append('svg')
    // .attr('class', 'sankey_details');
  }

  /**
  * Initialize the view and return a promise
  * that is resolved as soon the view is completely initialized.
  * @returns {Promise<SankeyDetail>}
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

  }

  /**
  * Attach the event listeners
  */
  private attachListener() {
    events.on(AppConstants.EVENT_CLICKED_PATH, (evt, data, json) => {
      if(this.isOpen) {
        this.closeDetail();
        this.isOpen = false;
      } else {
        this.drawDetails(data, json);
        this.isOpen = true;
      }
    });
  }


  private closeDetail () {
    console.log('remove', this.$node, this.detailSVG);
    this.detailSVG.remove();
    this.$node.select('svg.sankey_details').remove();
  }

  private drawDetails (clickedPath, json) {
    let margin = {top: 30 , right: 40, bottom: 30, left: 40},
    w = 400 - margin.left - margin.right,
    h= 200 - margin.top - margin.bottom;

    let sourceName = clickedPath.source.name;
    let targetName = clickedPath.target.name;
    let value = clickedPath.target.value;

    const units = '€';
    const formatNumber = d3.format(',.0f'),   // zero decimal places
    format = function(d) { return formatNumber(d) + ' ' + units; };

    this.$node.append('svg')
    .attr('class', 'sankey_details')
    .attr('transform', 'translate(' + 550 + ',' + 300 + ')')
    .attr('width', w + margin.left + margin.right + 'px')
    .attr('height', h + margin.top + margin.bottom + 'px')
    .style('background-color',  '#e0e0e0')
    .style('z-index', '10000')
    .append('text')
    .attr('class', 'caption')
    .text(function(d) { return sourceName + ' → ' + targetName ; })
    .attr('x', 5)
    .attr('y', 16);



    //filter data based on the clicked path (sourceName and targetName)
    function filterBySelectedPath (obj) {
      return obj.rechtstraeger === sourceName && obj.mediumMedieninhaber === targetName;
    }

    //selected path
    let path = json.filter(filterBySelectedPath);

    //data for the bar chart
    let euroOverTime = {};

    for(var key in path) {
      if(path.hasOwnProperty(key)) {
        euroOverTime[path[key].quartal] = path[key];
      }
    }

    let data = [];
    for(let i in euroOverTime) {
      data.push({quartal: +euroOverTime[i].quartal, euro: +euroOverTime[i].euro});
    }


    var x = (<any>d3).scale.ordinal()
    .rangeBands([0, w ], 0.2);

    var y = d3.scale.linear()
    .range([h,0]);

    x.domain(data.map(function(d) { return d.quartal; }));
    y.domain([0, d3.max(data, function(d) { return d.euro; })]);

    //Tooltip
    let tooltip = this.$node.append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .style('z-index', '200000');

    this.detailSVG = d3.select('svg.sankey_details').append('g').attr('class', 'bars');

    this.detailSVG.attr('transform', 'translate(' + (margin.left + 10) + ',' + margin.top + ')');

    this.detailSVG.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', function(d, i) { return x(d.quartal); })
    .attr('width', x.rangeBand())
    .attr('y', function(d) { return y(d.euro); }) // h - y(d.euro);
    .attr('height', function(d) { return y(0) - y(d.euro); })
    .on('mouseover', function(d) {
      tooltip.transition().duration(200).style('opacity', .9);

      tooltip.html(format(d.euro))
      .style('left', ((<any>d3).event.pageX -40) + 'px')
      .style('top', ((<any>d3).event.pageY - 20) + 'px');
    })
    .on('mouseout', function(d) {
      tooltip.transition().duration(500).style('opacity', 0);
    });

    // Define the axes
    var xAxis = d3.svg.axis().scale(x)
    .orient('bottom');

    var yAxis = d3.svg.axis().scale(y)
    .orient('left');

    this.detailSVG.append('g')
    .attr('class', ' x axis')
    .attr('transform', 'translate(0,' + h + ')')
    .call(xAxis);

    this.detailSVG.append('g')
    .attr('class', 'y axis')
    .call(yAxis.ticks(4).tickFormat(d3.format(',')));




  }
}
/**
* Factory method to create a new SankeyDiagram instance
* @param parent
* @param options
* @returns {SankeyDetail}
*/
export function create(parent: Element, options: any) {
  return new SankeyDetail(parent, options);
}
