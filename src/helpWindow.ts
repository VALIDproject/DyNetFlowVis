/**
 * Created by rind on 9/19/17.
 */

import * as events from 'phovea_core/src/event';
import * as d3 from 'd3';
import {AppConstants} from './app_constants';
import {MAppViews} from './app';

export default class HelpWindow implements MAppViews {

  // for the UI (= button)
  private $node: d3.Selection<any>;
  private parentDOM: string;
  private htmlString: string;

  constructor(parent: Element, private options: any) {
    this.parentDOM = options.parentDOM;
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<MAppViews>}
   */
  init(): Promise<MAppViews> {
    this.$node = d3.select(this.parentDOM).append('p');

    this.build();
    this.attachListener();

    //Return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  /**
   * Build the basic DOM elements
   */
  private build() {
    this.$node.append('a')
      .attr('id', 'helpTextBtn')
      .attr('title', 'Help Site')
      .append('i')
      .attr('class', 'fa fa-question fa-2x web')
      .attr('style', 'cursor: pointer;');

  }

  /**
   * Attach the event listeners
   */
  private attachListener() {
    d3.select('#helpTextBtn').on('click', (e) => {
      // Open the HTML tags first and the basic stuff;
      this.htmlString = `<html><head>
                            <title>Help Site</title>
                            <link href='https://fonts.googleapis.com/css?family=Yantramanav' rel='stylesheet'>
                            <style>${this.customStyle()}</style>
                         </head><body>`;

      // Add the custom HTML now
      this.htmlString += this.customHtml();

      // Close the HTML tags again
      this.htmlString += `
      <script>${this.customJs()}</script>
      </body></html>
      `;

      // Open the new Tab with the page we generated
      const newwindow = window.open();
      const newdocument = newwindow.document;
      newdocument.write(this.htmlString);
      newdocument.close();
    });
  }

  /**
   * This function is used in order to define the styles for the custom html site.
   * @returns {string} of the styles
   */
  private customStyle(): string {
    return `
    body {
      font-family: Yantramanav, 'Helvetica Neue', Helvetica, sans-serif;
      font-weight: 400;
      padding:10px;
    }

    .logo {
        float: left;
        background-repeat: no-repeat;      
        margin-right:20px;
        font-size: 150%;
        font-family: 'Oswald', sans-serif;
      }         
      
      #validHeader {
        float: left;
        display: inline-block;
        width: 100%;
      }
      .screen img{
        width: 800px; 
        border: 1px solid grey;
        
      }
      #content {
        display: none;
      }

      #videos {
        display: none;
      }
      
      .btn_design {
        display: inline-block;
        margin-bottom: 0;
        background-color:white;
        font-size: 12px;
        font-weight: 400;
        line-height: 1.42857143;
        text-align: center;
        white-space: nowrap;
        vertical-align: middle;
        cursor: pointer;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        background-image: none;
        border: 1.5px solid transparent;
        border-radius: 4px;
        padding: 5px 16px;
        color: #45B07C;
        border-color: #45B07C;
      }
    `;
  }

  /**
   * This function is used to create the script of the custom site.
   * @returns {string} the whole script elements of the site.
   */
  private customJs(): string {
    return `
    let x = document.getElementById('content');
    x.style.display = 'none'; 
    let y = document.getElementById('videos');
    y.style.display = 'none'; 

    function showScreenshots(mediaType) {       
        if (mediaType === 'content') {
          x.style.display = 'block';
          y.style.display = 'none';
        } else {
          y.style.display = 'block';
          x.style.display = 'none';
        }
      }
    `;
  }

  /**
   * This function is used to define the html body of the custom html site.
   * @returns {string} the whole html body of the site.
   */
  private customHtml(): string {
    return `
      <div id='validHeader'>
        <img src='https://www.dropbox.com/s/2lpi4sb9b2oxd0u/netflowerlogoN.png?raw=1'
         type='text/html' alt='Netflower Logo' class='responsive' width='200' height='100'/>    
      </div>
      <p>Dear user, this is the help site of netflower. You will find tutorial videos and help materials in form of screenshots and textual descriptions here.
      Please select first, if you like to watch videos or use screenshots & textual elements to get help.</p>
      <button class='btn_design' onclick='showScreenshots("content")' type='button'>Screens & Text</button>
      <button class='btn_design' onclick='showScreenshots("video")' type='button'>Videos</button>

      <div>
        <h2>Table of Content:</h2>
        <p><a href='#loaddata'>How to load data:</a></p>
        <p><a href='#readviz'>How to read the visulization:</a></p>
        <p><a href='#filter'>How to filter, sort and order:</a></p>
        <p><a href='#notebook'>How to use the notebook:</a></p>
      </div>
      <hr />
      <br />

      <!--Videos-->
      <div id='videos'>
      <h3 id='loaddata'>How to load data:</h3>
      <video controls>
        <source src='https://www.dropbox.com/s/oaqfe5d9vd2tjk1/Loading_Voiceover.mp4?raw=1' type='video/mp4'>
      </video>
      <p>
      This tool requires a specific format for the tables in order to visualize them appropriately. 
      Also only the <strong>.CSV</strong> format is accepted. If the required format isn't met, it will result in erros or no displayed data. 
      The format of the table headings defines all further views but needs to be in a specific order.</p>
      <p> (1) Prepare your data file as a .csv file with the structure shown in the table<br />
      (2) Load you data here and click 'Load & Show' <br />
      (3) Here you can download some sample files. </p>	
      <br />
      
      <h3 id='readviz'>How to read the visulization:</h3>  
      <video controls>
        <source src='https://www.dropbox.com/s/9j5vfifm38jcn9t/Visual_Voiceover.mp4?raw=1' type='video/mp4'>
      </video>
      <p>
      (1) The main visualization form is a sankey diagram. You read the sankey diagram from left to right. 
      In this example you see the number of Asylum seekers which make an application. The left side represent the origin countries
      and on the right side are the destination countries.</p>  
      <p>The screen above shows the visual encoding. There is this example table of asylum data. The lines from the table to the sankey diagram
      show the encoding from the data to the visual element - in this case a sankey diagram.</p> 
      <p>(2) The small bar charts left and right show the amount of asylum applications from the origin country and destination country point of view.</p>
        <p>By clicking on one connection line in the sankey diagram, you get a detail view showing the amount of asylum applications between 
        the two nodes (origin countries and destination countries).</p>

        <p>On the end of the site, you find two buttons <strong>'Show Less'</strong> and <strong>'Show more'</strong>. Here you can load more nodes or show less nodes. When you hover over
        the nodes (Rects) in the visualization you get the information of how many asylum applications were made from the selected country (node). You also 
        see that maybe not all destination and origin countries are visible by the hatching rect. Here you can use the buttons below to load more origin and destination countries.</p>


      <h3 id='filter'>How to filter, sort and order:</h3>  
      <video controls>
        <source src='https://www.dropbox.com/s/3c2r9g0boplw3xw/Filter_Voiceover.mp4?raw=1' type='video/mp4'>
      </video>
      <p>You can filter, sort and order the data, which influences the visualization view. <br />
        1) You can filter the data in time and connection. <br />
        2) You can sort the data by source, target and flow and order it, ascending and decending. <br />
        3) Exporting the data from the current view. You get a .csv file with the data of the current visualization, including all sorting and
        filtering operations.<br />
        4) You can limit the number of asylum applications by using the slider on both sides. <br />
        5) Search for a particular country in the origin and also in the destination countries using the seach box. </p>

      <h3 id='notebook'>How to use the notebook:</h3>  
      <video controls>
        <source src='https://www.dropbox.com/s/eojnigrttqxftm3/Notes_Voiceover.mp4?raw=1' type='video/mp4'>
      </video>
        <p>You can use a notebook, which opens when clicking the handler on the left side of the screen. 
        You can add some notes and also export it as a .txt. file. This file can be loaded in the notebook sidebar, when starting
        for example a new session analysing data with netflower. 
          <p style='border:2px; border-style:solid; border-color:#DA5A6B; padding: 1em;'>
          <i>Please notice, that if you clean your browser forcefully shut down your device, the data gets lost. However, if
          you referesh the page or go back to it if you closed the browser normally it will still be there!</i> 
          </p>
        </p>
      </div>


      <!--Content Screenshot-->
      <div id ='content'>
      <h3 id='loaddata'>How to load data:</h3>   
      <div class='container-fluid'>
    	<div class='row'>
	  	<div class='col-md-12'>
			<div class='row'>
        <div class='col-md-8'>
        <span class='screen'>
          <img src='https://www.dropbox.com/s/kqw2z6ndh7uw2gl/load_data_marks.png?raw=1'/>
        </span>
				</div>
				<div class='col-md-4'>
					<p>
          This tool requires a specific format for the tables in order to visualize them appropriately. 
          Also only <strong>.CSV</strong> files are accepted. If the required format isn't met, it will result in erros or no displayed data. 
          The format of the table headings defines all further views but needs to be in a specific order.</p>
          <p> (1) Prepare your data file as a .csv file with the structure shown in the table <br />
          (2) Load you data here and click 'Load & Show' <br />
          (3) Here you can download some sample files. </p>					
				</div>
			</div>
		</div>
  </div>
  
  <h3 id='readviz'>How to read the visulization:</h3>  
  <div class='container-fluid'>
    	<div class='row'>
	  	<div class='col-md-12'>
			<div class='row'>
        <div class='col-md-8'>
        <span class = 'screen'>
          <img src='https://www.dropbox.com/s/z26ahjx9g6nqsmu/vis_marks.png?raw=1'/>              
        </span>
      
				</div>
				<div class='col-md-4'>
					<p>
          (1) The main visualization is a sankey diagram. You read the sankey diagram from left to right. 
          In this example you see the number of Asylum seekers which make an application. The left side show the origin countries
         and on the right are the destination countries.</p>  
        <img style='width: 400px' src = 'https://www.dropbox.com/s/gwnl46zrjllrpob/encoding.png?raw=1'/>
        <p>The screen above shows the visual encoding. There is this example table of asylum data. The lines from the table to the sankey diagram
        show the encoding from the data to the visual element - in this case a sankey diagram. </p>
        <p>(2) The small bar charts left and right show the amount of asylum applications from the original country and destination country point of 
        view. </p>
        <img style='width: 400px'src = 'https://www.dropbox.com/s/gnn8vd483z6iyi8/detailview.png?raw=1'/>
        <p>By clicking on one connection line in the sankey diagram, you get a detail view showing the amount of asylum applications between 
        the two nodes (origin countries and destination countries).</p>
        <p>On the end of the site, you find two buttons <strong>'Show Less'</strong> and <strong>'Show more'</strong>. Here you can load more nodes or show less nodes. When you hover over
        the nodes (Rects) in the visualization you get the information of how many asylum applications were made from the selected country (node). You also 
        see that maybe not all destination and origin countries are visible by the hatching rect. Here you can use the buttons below to load more origin and destination countries.</p>
				</div>
			</div>
		</div>
  </div>

  <h3 id='filter'>How to filter, sort and order:</h3>  
    <div class='container-fluid'>
    	<div class='row'>
	  	<div class='col-md-12'>
			<div class='row'>
        <div class='col-md-8'>
        <span class = 'screen'>
        <img src = 'https://www.dropbox.com/s/pgpvtm7n6icel59/filter_marks2.png?raw=1'/>
        </span>
				</div>
				<div class='col-md-4'>
        <p>You can filter, sort and order the data, which influences the visualization view. <br />
        1) You can filter the data in time and connection. <br />
        2) You can sort the data by source, target and flow and order it, ascending and decending. <br />
        3) Exporting the data from the current view. You get a .csv file with the data of the current visualization, including all sorting and
        filtering operations.<br />
        4) You can limit the number of asylum applications by using the slider on both sides. <br />
        5) Search for a particular country in the origin and also in the destination countries using the seach box. </p>
				</div>
			</div>
		</div>
  </div>


  <h3 id='notebook'>How to use the notebook:</h3>  
    <div class='container-fluid'>
    	<div class='row'>
	  	<div class='col-md-12'>
			<div class='row'>
        <div class='col-md-8'>
        <span class = 'screen'>
          <img src = 'https://www.dropbox.com/s/ejf85l057deiw30/notebook.png?raw=1'/>
        </span>
				</div>
				<div class='col-md-4'>
        <p>You can use a notebook, which opens when clicking the handler on the left side of the screen. 
        You can add some notes and also export it as a .txt. file. This file can be loaded in the notebook sidebar, when starting
        for example a new session analysing data with netflower. 
          <p style='border:2px; border-style:solid; border-color:#DA5A6B; padding: 1em;'>
          <i>Please notice, that if you clean your browser forcefully shut down your device, the data gets lost. However, if
          you referesh the page or go back to it if you closed the browser normally it will still be there!</i> 
          </p>
        </p>
				</div>
        </div>
      </div>
    </div>
    </div>    
  </div> 
  <!--End Screenshots-->
    `;
  }
}

/**
 * Factory method to create a new SimpleLogging instance
 * @param parent
 * @param options
 * @returns {SparklineBarChart}
 */
export function create(parent: Element, options: any) {
  return new HelpWindow(parent, options);
}
