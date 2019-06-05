'use-strict';

(function() {

    let data = "";
    let svgContainer = "";
    let scatter_data = "";

    window.onload = function() {
        svgContainer = d3.select('.males')
                        .append('svg').attr('width', 700).attr('height', 700)
        d3.csv("data/gender_total.csv").then((csvData) => makeGraph(csvData));
        d3.csv("data/master.csv").then((masterData) => parseData(masterData));
    }

    function parseData(masterData) {
        scatter_data = masterData;
    }
    
    function makeGraph(csvData) {
        data = csvData;
        data = data.filter((row) => row["sex"] == "male");

        let suicides = data.map((row) => parseInt(row["total"]));
        let years = data.map((row) => parseInt(row["year"]));
        
        let limits = findMinMax(years, suicides);

        let functions = drawAxes(limits, "year", "total")

        plotGraph(functions);
        makeLabels();
       
    }

    function findMinMax(x, y) {
        let xMin = d3.min(x);
        let xMax = d3.max(x);
    
        let yMin = d3.min(y);
        let yMax = d3.max(y);
    
        return {
          xMin : xMin,
          xMax : xMax,
          yMin : yMin,
          yMax : yMax
        }
    }

    function drawAxes(limits, x, y) {    
        let xScale = d3.scaleLinear()
          .domain([limits.xMin - 0.5, limits.xMax + 0.5])
          .range([50, 650]);
    
        let xMap = function(d) {  return xScale(d); };
    
        let xAxis = d3.axisBottom().scale(xScale);
        svgContainer.append("g")
          .attr('transform', 'translate(0, 650)')
          .call(xAxis);
    
        let yScale = d3.scaleLinear()
          .domain([limits.yMax + 5, limits.yMin - 5])
          .range([50, 650]);
    
        let yMap = function (d) { return yScale(d); };
    
        let yAxis = d3.axisLeft().scale(yScale);
        svgContainer.append('g')
          .attr('transform', 'translate(50, 0)')
          .call(yAxis);
         
        return {
          x: xMap,
          y: yMap,
          xScale: xScale,
          yScale: yScale
        };
    }

    function makeLabels() {
        svgContainer.append('text')
          .attr('x', 250)
          .attr('y', 20)
          .style('font-size', '12pt')
          .text("Suicides for Males Over Time");
        
        svgContainer.append('text')
          .attr('x', 320)
          .attr('y', 690)
          .style('font-size', '10pt')
          .text('Time (years)');
    
        svgContainer.append('text')
          .attr('transform', 'translate(10, 375)rotate(-90)')
          .style('font-size', '10pt')
          .text('Suicides');
      }

      function getFilters(data){
        let location = data.map((row) => row["location"]);
       
        location = [... new Set(location)];
        return location;
    } 

    function makeScatterPlot(data, div) {
        let population = data.map((row) => parseInt(row["pop"]));
        let suicides = data.map((row) => parseInt(row["suicide"]));

        let limits = findMinMax(population, suicides);

        let map_functions = drawToolTipAxes(limits, population, suicides, div);

        plotToolTip(map_functions, div);
        makeTooltipLabels(div);


    }

    function makeTooltipLabels(div) {
        div.append('text')
        .attr('x', 5)
        .attr('y', 10)
        .style('font-size', '9pt')
        .text("Population and Suicide Rates");
    
        div.append('text')
        .attr('x', 100)
        .attr('y', 290)
        .style('font-size', '7pt')
        .text('Population (in 100,000)');

        div.append('text')
        .attr('transform', 'translate(6, 175)rotate(-90)')
        .style('font-size', '7pt')
        .text('No. of Suicides (in 1,000)');

    }

    function drawToolTipAxes(limits, x, y, div) {    
        let xScale = d3.scaleLinear()
          .domain([limits.xMin, limits.xMax])
          .range([20, 450]);
    
        let xMap = function(d) {  return xScale(d); };
    
        let xAxis = d3.axisBottom().scale(xScale);
        div.append("g")
          .attr('transform', 'translate(10, 250)')
          .call(xAxis);
    
        let yScale = d3.scaleLinear()
          .domain([limits.yMax, limits.yMin])
          .range([20, 250]);
    
        let yMap = function (d) { return yScale(d); };
    
        let yAxis = d3.axisLeft().scale(yScale);
        div.append('g')
          .attr('transform', 'translate(30, 0)')
          .call(yAxis);
         
        return {
          x: xMap,
          y: yMap,
          xScale: xScale,
          yScale: yScale
        };
    }

    function plotToolTip(map, div) {
        let pop = scatter_data.map((row) => +row["pop"]);
        let lims = d3.extent(pop);

        d3.scaleLinear()
          .domain([lims[0], lims[1]])
          .range([3, 20]);
        
        let xMap = map.x;
        let yMap = map.y;
         
        div.selectAll('.dot')
          .data(scatter_data)
          .enter()
          .append('circle')
            .attr('cx', function(d) { return xMap(d["pop"])})
            .attr('cy', function(d) { return yMap(d["suicide"])})
            .attr('r', 1)
            .attr('fill', "#4286f4")
    }
    

    
    function plotGraph(map) {
        let years = getFilters(data);
        
        let xMap = map.x;
        let yMap = map.y;
    
        let div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
        let toolTipContainer = div.append('svg')
          .attr('width', 300)
          .attr('height', 300);
        
    
        let line = d3.line()
            .x(function(d) {return xMap(d['year']); })
            .y(function(d) { return yMap(d['total']); });
        
        
        let draw = svgContainer.append('path').data(data.filter(function(d){return d.location==years[0]}))
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr('d', line(data.filter(function(d){return d.location==years[0]})))
        .on("mouseover", (d) => {
          makeScatterPlot(scatter_data, toolTipContainer);
          div.transition()
            .duration(200)
            .style("opacity", .9)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(2000)
            .style("opacity", 0);
        });

        let t = d3.transition().duration(2000);
        d3.select(".line")
        .transition(t)
        .style("stroke", "red");
        
        let dropDown = d3.select('body')
        .append('select')
        .on('change', function() {
            let selected = this.value;
            let selectedLocation = data.filter(location => location.location == selected);
            draw.data(selectedLocation)
                .transition()
                .attr('d', line(selectedLocation))
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2)
        });
    
        dropDown.selectAll('option')
          .data(years)
          .enter()
            .append('option')
            .text((d) => { return d; });
      }

})();