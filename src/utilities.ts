/**
 * Created by Florian on 02.05.2017.
 */
import * as d3 from 'd3';
import text = d3.text;
import * as events from 'phovea_core/src/event';
import * as localforage from 'localforage';
import * as $ from 'jquery';
import {AppConstants} from './app_constants';

/**
 Function allowing to 'wrap' the text from an SVG <text> element with <tspan>.
 * Based on https://github.com/mbostock/d3/issues/1642
 * @example svg.append('g')
 *      .attr('class', 'x axis')
 *      .attr('transform', 'translate(0,' + height + ')')
 *      .call(xAxis)
 *      .selectAll('.tick text')
 *          .call(d3TextWrap, x.rangeBand());
 *
 * @param text d3 selection for one or more <text> object
 * @param width number - global width in which the text will be word-wrapped.
 * @param paddingRightLeft integer - Padding right and left between the wrapped text and the 'invisible bax' of 'width' width
 * @param paddingTopBottom integer - Padding top and bottom between the wrapped text and the 'invisible bax' of 'width' width
 * @returns Array[number] - Number of lines created by the function, stored in a Array in case multiple <text> element are passed to the function
 *
 * @see: from https://github.com/d3/d3/issues/1642 AlexandreBonneau
 */
export function d3TextWrap(text, width, paddingRightLeft = 5, paddingTopBottom = 5) {
  // paddingRightLeft = paddingRightLeft || 5; //Default padding (5px)
  paddingTopBottom = paddingTopBottom - 2; //Default padding (5px), remove 2 pixels because of the borders
  const maxWidth = width; //I store the tooltip max width
  width = width - (paddingRightLeft * 2); //Take the padding into account

  const arrLineCreatedCount = [];
  text.each(function () {
    const text = d3.select(this),
      words = text.text().split(/[ \f\n\r\t\v]+/).reverse(), //Don't cut non-breaking space (\xA0), as well as the Unicode characters \u00A0 \u2028 \u2029)
      lineHeight = 1.1, //Ems
      textAlign = text.style('text-anchor') || 'start'; //'start' by default (start, middle, end, inherit)

    let word,
      line = [],
      lineNumber = 0,
      x,
      y = text.attr('y'),
      dy = parseFloat(text.attr('dy')),
      createdLineCount = 1; //Total line created count


    //Clean the data in case <text> does not define those values
    if (isNaN(dy)) {
      dy = 0;
    } //Default padding (0em) : the 'dy' attribute on the first <tspan> _must_ be identical to the 'dy' specified on the <text> element, or start at '0em' if undefined

    //Offset the text position based on the text-anchor
    const wrapTickLabels = d3.select(text.node().parentNode).classed('tick'); //Don't wrap the 'normal untranslated' <text> element and the translated <g class='tick'><text></text></g> elements the same way..
    if (wrapTickLabels) {
      switch (textAlign) {
        case 'start':
          x = -width / 2;
          break;
        case 'middle':
          x = 0;
          break;
        case 'end':
          x = width / 2;
          break;
        default :
      }
    } else { //untranslated <text> elements
      switch (textAlign) {
        case 'start':
          x = paddingRightLeft;
          break;
        case 'middle':
          x = maxWidth / 2;
          break;
        case 'end':
          x = maxWidth - paddingRightLeft;
          break;
        default :
      }
    }
    y = (+((null === y) ? paddingTopBottom : y) as any);

    let tspan = (text as any).text(null).append('tspan').attr('x', x).attr('y', y).attr('dy', dy + 'em');
    //noinspection JSHint
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(' '));
      if (tspan.node().getComputedTextLength() > width && line.length > 1) {
        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
        ++createdLineCount;
      }
    }

    arrLineCreatedCount.push(createdLineCount); //Store the line count in the array
  });
  return arrLineCreatedCount;
}

/**
 * This method splits the given string at a given position (method used is currying, which means 2 fat arrows,
 * where the first returns a funciton. So everytime the function is called the same index is used for example.
 * @param index where to split
 * @param it what to split
 *
 * Example: splitAt(4)(d.time) Splits the string at 4 from d.time
 */
export const splitAt = (index) => (it) =>
  [it.slice(0, index), it.slice(index)];

/**
 * This function takes a time point which consits basically of a year and a quarter. It places between the year and
 * quarter a big "Q" in order to symbolize the quarter. So for example 20151 --> 2015Q1
 * @param timePoint to be transformed
 * @returns {string} transfomred time point
 */
export function splitQuarter(timePoint: string): string {
  const textParts = splitAt(4)(timePoint);
  return `${textParts[0]}Q${textParts[1]}`;
}

const formatNumber = d3.format(',.0f');    //Zero decimal places
//  format = function(d) { return formatNumber(d); }, //Display number with unit sign
/**
 * This method converts a given number to a String with dot formated thousands seperator.
 * @type {(n:number)=>string} the number to format
 */
export const dotFormat = function (d) {
  return formatNumber(d).replace(/,/g, '.');
}; //Replacing the , with .

/**
 * This crazy function rounds numbers to the next lower 10th or 100th precision depending on the number.
 * It's necessary but not very pretty. Not proud of it.....
 * A 'prettier' solution might be a loop and Math.pow(10,i) (yet but better not touch working code).
 * @param value to round
 * @returns {number}
 */
export function roundToFull(value: number) {
  if (value >= 10 && value < 100) {                             //10 step
    return Math.round(value / 10) * 10;
  } else if (value >= 100 && value < 1000) {                     //100 step
    return Math.round(value / 100) * 100;
  } else if (value >= 1000 && value < 10000) {                   //1.000 step
    return Math.round(value / 1000) * 1000;
  } else if (value >= 10000 && value < 100000) {                 //10.000 step
    return Math.round(value / 10000) * 10000;
  } else if (value >= 100000 && value < 1000000) {               //100.000 step
    return Math.round(value / 100000) * 100000;
  } else if (value >= 1000000 && value < 10000000) {             //1.000.000 step
    return Math.round(value / 1000000) * 1000000;
  } else if (value >= 10000000 && value < 100000000) {           //10.000.000 step
    return Math.round(value / 10000000) * 10000000;
  } else if (value >= 100000000 && value < 1000000000) {         //100.000.000 step
    return Math.round(value / 10000000) * 10000000;
  } else if (value >= 1000000000 && value < 10000000000) {       //1.000.000.000 step
    return Math.round(value / 100000000) * 100000000;
  } else {
    return Math.round(value);
  }
}

/**
 * This function exports a html table with letious options and creates a JSON.
 * The function had to be adapted and implemented here due to loading issues.
 * (C) Daniel White: http://www.developerdan.com/table-to-json/
 *
 * @param table The html Table to convert
 * @param opts Optional options for converting the table
 *  -) ignoreColumns --> Array of column indexes to ignore. EXPECTS: Array
 *  -) onlyColumns --> Array of column indexes to include, all other are ignored. EXPECTS: Array
 *  -) ignoredHiddenRows --> If hidden rows should be ignored. EXPECTS: Boolean
 *  -) headings --> Array of column headings to use. When given all table rows are treated as values.
 *  -) allowHTML --> If HTML Tags in table cells should be perserved. EXPECTS: Boolean
 *  -) includeRowId --> Determines if the id attribute of each <tr> element is included in the JSON
 *     EXPECTS: Boolean or String. If true then ids are included under rowIds. If String its used as
 *     the header instead of the default rowId
 * @returns {Array} Generated JSON
 */
/*export function tableToJSON(table, opts?) {
 // Set options
 let defaults = {
 ignoreColumns: [],
 onlyColumns: null,
 ignoreHiddenRows: true,
 ignoreEmptyRows: false,
 headings: null,
 allowHTML: false,
 includeRowId: false,
 textDataOverride: 'data-override',
 textExtractor: null
 };
 opts = $.extend(defaults, opts);

 let notNull = function(value) {
 return value !== undefined && value !== null;
 };

 let ignoredColumn = function(index) {
 if( notNull(opts.onlyColumns) ) {
 return $.inArray(index, opts.onlyColumns) === -1;
 }
 return $.inArray(index, opts.ignoreColumns) !== -1;
 };

 let arraysToHash = function(keys, values) {
 let result = {}, index = 0;
 $.each(values, function(i, value) {
 // when ignoring columns, the header option still starts
 // with the first defined column
 if ( index < keys.length && notNull(value) ) {
 result[ keys[index] ] = value;
 index++;
 }
 });
 return result;
 };

 let cellValues = function(cellIndex, cell, isHeader?) {
 let $cell = $(cell),
 // textExtractor
 extractor = opts.textExtractor,
 override = $cell.attr(opts.textDataOverride);
 // don't use extractor for header cells
 if ( extractor === null || isHeader ) {
 return $.trim( override || ( opts.allowHTML ? $cell.html() : cell.textContent || $cell.text() ) || '' );
 } else {
 // overall extractor function
 if ( $.isFunction(extractor) ) {
 return $.trim( override || extractor(cellIndex, $cell) );
 } else if ( typeof extractor === 'object' && $.isFunction( extractor[cellIndex] ) ) {
 return $.trim( override || extractor[cellIndex](cellIndex, $cell) );
 }
 }
 // fallback
 return $.trim( override || ( opts.allowHTML ? $cell.html() : cell.textContent || $cell.text() ) || '' );
 };

 let rowValues = function(row, isHeader) {
 let result = [];
 let includeRowId = opts.includeRowId;
 let useRowId = (typeof includeRowId === 'boolean') ? includeRowId : (typeof includeRowId === 'string') ? true : false;
 let rowIdName = (typeof includeRowId === 'string') === true ? includeRowId : 'rowId';
 if (useRowId) {
 if (typeof $(row).attr('id') === 'undefined') {
 result.push(rowIdName);
 }
 }
 $(row).children('td,th').each(function(cellIndex, cell) {
 result.push( cellValues(cellIndex, cell, isHeader) );
 });
 return result;
 };

 let getHeadings = function(table) {
 let firstRow = table.find('tr:first').first();
 return notNull(opts.headings) ? opts.headings : rowValues(firstRow, true);
 };

 let construct = function(table, headings) {
 let i, j, len, len2, txt, $row, $cell,
 tmpArray = [], cellIndex = 0, result = [];
 table.children('tbody,*').children('tr').each(function(rowIndex, row) {
 if( rowIndex > 0 || notNull(opts.headings) ) {
 let includeRowId = opts.includeRowId;
 let useRowId = (typeof includeRowId === 'boolean') ? includeRowId : (typeof includeRowId === 'string') ? true : false;

 $row = $(row);

 let isEmpty = ($row.find('td').length === $row.find('td:empty').length) ? true : false;

 if( ( $row.is(':visible') || !opts.ignoreHiddenRows ) && ( !isEmpty || !opts.ignoreEmptyRows ) && ( !$row.data('ignore') || $row.data('ignore') === 'false' ) ) {
 cellIndex = 0;
 if (!tmpArray[rowIndex]) {
 tmpArray[rowIndex] = [];
 }
 if (useRowId) {
 cellIndex = cellIndex + 1;
 if (typeof $row.attr('id') !== 'undefined') {
 tmpArray[rowIndex].push($row.attr('id'));
 } else {
 tmpArray[rowIndex].push('');
 }
 }

 $row.children().each(function(){
 $cell = $(this);
 // skip column if already defined
 while (tmpArray[rowIndex][cellIndex]) { cellIndex++; }

 // process rowspans
 if ($cell.filter('[rowspan]').length) {
 len = parseInt( $cell.attr('rowspan'), 10) - 1;
 txt = cellValues(cellIndex, $cell);
 for (i = 1; i <= len; i++) {
 if (!tmpArray[rowIndex + i]) { tmpArray[rowIndex + i] = []; }
 tmpArray[rowIndex + i][cellIndex] = txt;
 }
 }
 // process colspans
 if ($cell.filter('[colspan]').length) {
 len = parseInt( $cell.attr('colspan'), 10) - 1;
 txt = cellValues(cellIndex, $cell);
 for (i = 1; i <= len; i++) {
 // cell has both col and row spans
 if ($cell.filter('[rowspan]').length) {
 len2 = parseInt( $cell.attr('rowspan'), 10);
 for (j = 0; j < len2; j++) {
 tmpArray[rowIndex + j][cellIndex + i] = txt;
 }
 } else {
 tmpArray[rowIndex][cellIndex + i] = txt;
 }
 }
 }

 txt = tmpArray[rowIndex][cellIndex] || cellValues(cellIndex, $cell);
 if (notNull(txt)) {
 tmpArray[rowIndex][cellIndex] = txt;
 }
 cellIndex++;
 });
 }
 }
 });
 $.each(tmpArray, function( i, row ){
 if (notNull(row)) {
 // remove ignoredColumns / add onlyColumns
 let newRow = notNull(opts.onlyColumns) || opts.ignoreColumns.length ?
 $.grep(row, function(v, index){ return !ignoredColumn(index); }) : row,

 // remove ignoredColumns / add onlyColumns if headings is not defined
 newHeadings = notNull(opts.headings) ? headings :
 $.grep(headings, function(v, index){ return !ignoredColumn(index); });

 txt = arraysToHash(newHeadings, newRow);
 result[result.length] = txt;
 }
 });
 return result;
 };

 // Run
 let headings = getHeadings(table);
 return construct(table, headings);
 };
 */

/**
 * This method creates a downloadable file which contains the json or data it was given. An example
 * call would be: downloadFile(JSON.stringify(json), 'output.txt', 'text/plain');
 * This creates a file named output.txt if the user visits the website or presses a button.
 * @param text is the text or json object which should be written to the file
 * @param name is the file name
 * @param type the type of the file which can be specified
 */
export function downloadFile(text, name, type) {
  const a = document.createElement('a');
  const file = new Blob([text], {type});
  a.href = URL.createObjectURL(file);
  a.download = name;
  a.click();
}

/**
 * generate a random alphanumeric (base36) string of given length.
 * Source: https://stackoverflow.com/a/10727155/1140589
 * @param length number of characters
 */
export function randomString(length: number): string {
  return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

/**
 * This function fades in a text or fades over a text on a given html element
 * @param element html to fade the text onto
 * @param newText the text to show in the html elment
 */
export function textTransition(element: d3.Selection<any>, newText: string, duration: number) {
  element.transition().duration(duration)
    .style('opacity', 0)
    .transition().duration(duration)
    .style('opacity', 1)
    .text(newText);
}

/**
 * This function can be used in order to compute the dimensions of a string, that is going to be drawn
 * but without drawing it.
 * @param text that should be drawn
 * @returns {{width: number, height: number}} the dimensions of the drawn text
 */
export function textSize(text): {width: number, height: number} {
  const container = d3.select('body').append('svg');
  container.append('text').attr({x: -99999, y: -99999}).text(text);
  const size = (container.node() as any).getBBox();
  container.remove();
  return {width: size.width, height: size.height};
}
/**
 * This function can be used to add text ellipses to overvlowing text. It will add dots to all text
 * that is above the given width.
 * @param text element in d3 which contains the text e.g. d3.selectAll('text');
 * @param maxTextWidth the width in pixel where the text should be broken
 */
export function d3TextEllipse(text, maxTextWidth) {
  text.each(function () {
    const text = d3.select(this);
    const words = text.text().split(/\s+/);
    const ellipsis = text.text('').append('tspan').attr('class', 'elip').text('...');
    const numWords = words.length;
    const tspan = text.insert('tspan', ':first-child').text(words.join(' '));

    //While it's too long and we have words left we keep removing words
    while ((tspan.node() as any).getComputedTextLength() > maxTextWidth && words.length > 1) {
      words.pop();
      tspan.text(words.join(' '));
    }

    // only 1 word left & if too long, keep removing characters
    if (words.length === 1) {
      let length = words[0].length;
      while ((tspan.node() as any).getComputedTextLength() > maxTextWidth && length > 1) {
        length--;
        tspan.text(words[0].slice(0, length));
      }
    }

    if (words.length === numWords) {
      ellipsis.remove();
    }
  });
}

/**
 * Sanitized the data in a way such that all the nodes with the same name have the same tags
 * @param data to sanitize
 * @param filteredData data with the correct tags and their respective nodes
 */
export function applyTagChangesToNode(data: any, filteredData: any): any {
  const newData = data;
  for (const entry of newData) {
    const sourceValue = entry.sourceNode.toLowerCase();
    const targetValue = entry.targetNode.toLowerCase();

    filteredData.forEach(function (d) {
      const term = d.key.toLowerCase();
      if (sourceValue === term) {
        entry.sourceTag = d.values;
      }
      if (targetValue === term) {
        entry.targetTag = d.values;
      }
    });
  }
  localforage.setItem('data', newData).then(function (value) {
    return localforage.getItem('data');
  });
}

export class Tooltip {
  public static tooltip1 = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .style('z-index', '200000');

  public static tooltip2 = d3.select('body').append('div')
    .attr('class', 'tooltip2')
    .style('opacity', 0)
    .style('z-index', '200000');

  public static mouseOver(data, text, type: string) {
    if (type === 'T1') {
      Tooltip.tooltip1.transition().duration(200).style('opacity', .9);
      Tooltip.tooltip1.html(text)
        .style('left', ((<any>d3).event.pageX - 20) + 'px')
        .style('top', ((<any>d3).event.pageY - 140) + 'px');
    } else {
      let left = (<any>d3).event.pageX;
      const screenWidth = document.documentElement.clientWidth;
      if ((left + 200) > screenWidth) {
        left = screenWidth - 200; // Reduce by tooltip width = 200 and offset = 20
      } else {
        left = left - 20;
      }
      Tooltip.tooltip2.transition().duration(200).style('opacity', .9);
      Tooltip.tooltip2.html(text)
        .style('left', left + 'px')
        .style('top', ((<any>d3).event.pageY) + 'px');
    }
  }

  public static mouseOut(type: string) {
    Tooltip.tooltip1.transition().duration(500).style('opacity', 0);
    Tooltip.tooltip2.transition().duration(500).style('opacity', 0);
  }
}

/**
 * Displays a tooltip about a node.
 * @param d data of a node as received from D3
 * @param valuePostFix either "to" or "from"
 */
export function assembleNodeTooltip(d: any, valuePostFix: string) {
  const direction = (d.sourceLinks.length <= 0) ? 'from' : 'to';
  // Table because of aligned decimal numbers
  const text = `${d.name}
    <br />
    <table class='node'>
      <tr><td>
        <svg width='8' height='8'>
          <rect width='8' height='8' fill='#DA5A6B' />
        </svg>
        ${dotFormat(d.value) + valuePostFix}
      </td><td> ${direction} displayed elements.</td></tr>
    `;

  // compare to a small number to avoid floating point issues
  const hiddenFlows = (d.overall - d.value) > 0.00001 ? `
    <tr><td>
      <svg width='8' height='8'>
        <defs>
          <pattern id='diagonalHatch2' patternUnits='userSpaceOnUse' width='4' height='4'>
            <rect width='4' height='4' fill='#DA5A6B' />
            <path d='M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2' stroke='#ffffff' 'stroke-width='1' />
          </pattern>
        </defs>
      <rect width='8' height='8' fill='url(#diagonalHatch2)' />
      </svg>
    ${dotFormat((d.overall - d.value)) + valuePostFix}</td><td>are not displayed.</td></tr>
    <tr><td>${dotFormat(d.overall) + valuePostFix}</td><td>in total.</td></tr>
    ` : '';

  Tooltip.mouseOver(d, text + hiddenFlows + '</table>', 'T2');
}

/**
 * This method sets the default column labels if none are found or initialized.
 * Structure: ['sourceNode', 'targetNode', 'timeNode', 'valueNode', 'sourceTag',
 *  'targetTag', 'attribute1', 'attribute2']
 * @param columnLabels object we want to transform the column labels at
 * @returns {any} the new column labels with default values
 */
export function initDefaultColumnLabels(columnLabels: any) {
  columnLabels = {};
  columnLabels.sourceNode = 'source';
  columnLabels.targetNode = 'target';
  columnLabels.timeNode = 'time';
  columnLabels.valueNode = 'value';
  columnLabels.sourceTag = 'sourceHash';
  columnLabels.targetTag = 'targetHash';
  columnLabels.attribute1 = 'attribute 1';
  // columnLabels.attribute2 = 'attribute 2';

  return columnLabels;
}

// ---------------------------------------------------------------------------------------------------------------------
/*
 * Create a copy of an object to log it out:
 * Object.assign({},this._container)
 */
