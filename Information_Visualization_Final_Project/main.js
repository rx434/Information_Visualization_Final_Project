const month1to11 = {'Jan':1 ,'Feb': 2,'Mar':3,'Apr':4,'May':5,'Jun':6,'Jul':7,'Aug':8,'Sep':9,'Oct':10,'Nov':11}

function getcase(){
    d3.selectAll("g")
    .remove();
    d3.select("#palette")
    .remove();
///////////////////////////////




//////////////////////////////////
    let select = document.getElementById('Month');
    let val = select.value;


    d3.select("#Isolating")
    .remove()                
    let g = d3.select('svg')
    g.append('rect')
    .attr('width', (width-(11-month1to11[val])*93.5))
    .attr('height', 650)
    .attr('transform', 'translate(70,700)')
    .attr('fill', '#fce703')
    .attr('opacity',0.3)
    .attr('id', 'Isolating')


    Promise.all([
        d3.json('states-projection.json'),
        d3.csv("us-states.csv")
    ]).then(([mapdata, USdata_all]) => {
        let USmonth = [];
        //console.log(USdata_all1)
        USmonth = each_month_data(val, USdata_all);
        console.log(USmonth);
        let cases = USmonth.map(d => Number(d.cases));
        let min_cases = 0;
        let max_cases = d3.max(cases);
        const RedcolorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([min_cases, max_cases]);

        let states = topojson.feature(mapdata, mapdata.objects.states).features;
    // console.log(states);

        states = combine(USmonth, states);
        // console.log(states);
        // console.log(states.length);

        const pathGenerator = d3.geoPath();
    
        svg.append("g")
            .selectAll("path")
            .data(states)
            .enter()
            .append("path")
            .attr("class", "states")
            .attr("id", function (d) {return d.id})
            .style("fill", d => RedcolorScale(Number(d.cases)))
            .on("mouseover", function(){
            //console.log(Object.values(this)[0].name);
                d3.select("#mytooltip")
                .style("visibility", "visible")
                .text("State:" + Object.values(this)[0].name + "\n"+ "Cases:" + Object.values(this)[0].cases + "\n");
            })
            .on("mousemove", function(){
                d3.select("#mytooltip")
                .style("top", (event.pageY-10)+ "px")
                .style("left", (event.pageX+6) + "px");
            })
            .on("mouseout", function(){
                d3.select("#mytooltip")
                .style("visibility", "hidden");
            })
            .on("click", function(){
                // console.log(this);
                state_id = this.id;
                d3.selectAll("path")
                .style("stroke", "black")
                .style("stroke-width", 1);
                d3.select(this)
                .style("stroke", "blue")
                .style("stroke-width", 5);



//////////////////////////////////////////////////////////////////////

                d3.select("#line")
                .remove()
                d3.select("#xaxis")
                .remove()
                d3.select("#yaxis")
                .remove()
                let timeConv = d3.timeParse("%Y/%m/%d")
                console.log(USdata_all)
                dataset = USdata_all.filter(d => Number(d.fips) == Number(state_id))
                console.log(dataset)
                Promise.all([dataset]).then(([data]) => {
                    // console.log(data)
                    let slices = ["cases"].map(function(id) {
                        return {
                            values: data.map(function(d){
                                //console.log(d.date)
                                return {
                                    date: timeConv(d.date),
                                    measurement: +d[id]
                                }; 
                            })
                        };
                    })
                // console.log(slices)

                //console.log(slices)
                const xScale = d3.scaleTime().range([0,width]);
                const yScale = d3.scaleLinear().rangeRound([height-150, 0]);
                xScale.domain(d3.extent(data, function(d){
                    return timeConv(d.date)}));
                yScale.domain([(0), d3.max(slices, function(c) {
                    return d3.max(c.values, function(d) {
                        return d.measurement + 4; });
                        })
                    ]);

                const yaxis = d3.axisLeft().scale(yScale); 
                const xaxis = d3.axisBottom().
                scale(xScale);
                // const xaxis = d3.axisBottom()
                // .ticks(d3.timeDay.every(30))
                // .tickFormat(d3.timeFormat('%m %d'))
                // .scale(xScale)   

                svg.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(70," + (height + 550) + ")")
                .attr("id", "xaxis")
                .call(xaxis);

                svg.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(70," + (height-100) + ")")
                .attr("id", "yaxis")
                .call(yaxis);

                const line = d3.line()
                .x(function(d) { return xScale(d.date); })
                .y(function(d) { return yScale(d.measurement);});        

                const lines = svg.selectAll("lines")
                .data(slices)
                .enter()
                .append("g")    
                .attr("transform", "translate(70," + (height-100) + ")")


                lines.append("path")
                .attr("d", function(d) { return line(d.values); })
                .attr("id", "line");

                })








/////////////////////////////////////////////////////////////////////
            })
            .attr("d", pathGenerator)
            .attr("cases", function (d) {return d.cases})
            .attr("deaths", function (d) {return d.deaths})
            .attr("name", function (d) {return d.name})

        let palette = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'palette');
        palette
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%');
          
        let pop_levels = d3.range(min_cases, max_cases, max_cases/10);
        //console.log(pop_levels)
        palette.selectAll('stop')
            .data(pop_levels)
            .enter()
            .append('stop')
            .attr('offset',  (d, i) => { 
             return`${(i+1)*100/pop_levels.length}%`
            })
            .attr('stop-color', d => RedcolorScale(d));
            
        let legend = svg.append('g');
        legend.attr('transform', 'translate(300, 0)');
        legend.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 300)
            .attr('height', 20)
            .style('fill', 'url(#palette');
      
        let legendScale = d3.scaleLinear()
            .range([0, 300])
            .domain([min_cases, max_cases])
            .nice();
        let legnedAxis = d3.axisBottom(legendScale).ticks(5, '~s');
        legend.append('g')
            .attr('transform', 'translate(0, 20)')
            .call(legnedAxis);
        })

//START//////////////////////////////////get case of line
        const timeConv = d3.timeParse("%Y-%m-%d")

        let dataset = d3.csv("US.csv");
        dataset.then(function(data){

        const slices = data.columns.slice(1,2).map(function(id) {
            return {
                values: data.map(function(d){
                    //console.log(d.date)
                    return {
                    date: timeConv(d.date),
                    measurement: +d[id]
                    };
                })
            };
        })
    // console.log(slices);

    const xScale = d3.scaleTime().range([0,width]);
    const yScale = d3.scaleLinear().rangeRound([height-150, 0]);
    xScale.domain(d3.extent(data, function(d){
        return timeConv(d.date)}));
    yScale.domain([(0), d3.max(slices, function(c) {
        return d3.max(c.values, function(d) {
            return d.measurement + 4; });
            })
        ]);

    const yaxis = d3.axisLeft().scale(yScale); 
    const xaxis = d3.axisBottom().
    scale(xScale);
    // const xaxis = d3.axisBottom()
    // .ticks(d3.timeDay.every(30))
    // .tickFormat(d3.timeFormat('%m %d'))
    // .scale(xScale)   
    
    svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(70," + (height + 550) + ")")
    .attr("id", "xaxis")
    .call(xaxis);

    svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(70," + (height-100) + ")")
    .attr("id", "yaxis")
    .call(yaxis);

    let line = d3.line()
    .x(function(d) { return xScale(d.date); })
    .y(function(d) { return yScale(d.measurement);});        
 
    let lines = svg.selectAll("lines")
    .data(slices)
    .enter()
    .append("g")    
    .attr("transform", "translate(70," + (height-100) + ")")


    lines.append("path")
    .attr("d", function(d) { return line(d.values); })
    .attr("id", "line");

})    
//ENDddddddddddddddddddddddddddddddddd////////////////////////////////get case of line
}

function getdeath(){
    d3.selectAll("g")
    .remove();
    d3.select("#palette")
    .remove();

    let select = document.getElementById('Month');
    let val = select.value;

    d3.select("#Isolating")
    .remove()                
    let g = d3.select('svg')
    g.append('rect')
    .attr('width', (width-(11-month1to11[val])*93.5))
    .attr('height', 650)
    .attr('transform', 'translate(70,700)')
    .attr('fill', '#fce703')
    .attr('opacity',0.3)
    .attr('id', 'Isolating')


    Promise.all([
        d3.json('states-projection.json'),
        d3.csv("us-states.csv")
    ]).then(([mapdata, USdata_all]) => {
        let USmonth = [];
        USmonth = each_month_data(val, USdata_all);
        //console.log(USmonth);
        let deaths =  USmonth.map(d => Number(d.deaths));
        let min_deaths = 0;
        let max_deaths = d3.max(deaths);
        const GreycolorScale = d3.scaleSequential(d3.interpolateGreys)
        .domain([min_deaths, max_deaths]);

        let states = topojson.feature(mapdata, mapdata.objects.states).features;
    // console.log(states);

        states = combine(USmonth, states);
        // console.log(states);
        // console.log(states.length);

        const pathGenerator = d3.geoPath();
    
        svg.append("g")
            .selectAll("path")
            .data(states)
            .enter()
            .append("path")
            .attr("class", "states")
            .attr("id", function (d) {return d.id})
            .style("fill", d => GreycolorScale(Number(d.deaths)))
            .on("mouseover", function(){
            //console.log(Object.values(this)[0].name);
                d3.select("#mytooltip")
                .style("visibility", "visible")
                .text("State:" + Object.values(this)[0].name + "\n"+ "Deaths:" + Object.values(this)[0].deaths + "\n");
            })
            .on("mousemove", function(event){
                d3.select("#mytooltip")
                .style("top", (event.pageY-10)+ "px")
                .style("left", (event.pageX+6) + "px");
            })
            .on("mouseout", function(){
                d3.select("#mytooltip")
                .style("visibility", "hidden");
            })
            .on("click", function(){
                console.log(this);
                let state_id = this.id;
                d3.selectAll("path")
                .style("stroke", "black")
                .style("stroke-width", 1);
                d3.select(this)
                .style("stroke", "blue")
                .style("stroke-width", 5);


//START/////////////////////////////////////////////////////////State line chart death/////////////////////////////////////

            d3.select("#line")
            .remove()
            d3.select("#xaxis")
            .remove()
            d3.select("#yaxis")
            .remove()
            let timeConv = d3.timeParse("%Y/%m/%d")
            dataset = USdata_all.filter(d => Number(d.fips) == Number(state_id))
            // console.log(dataset)
            Promise.all([dataset]).then(([data]) => {
                // console.log(data)
                let slices = ["deaths"].map(function(id) {
                    return {
                        values: data.map(function(d){
                            //console.log(d.date)
                            return {
                                date: timeConv(d.date),
                                measurement: +d[id]
                            }; 
                        })
                    };
                })
            console.log(slices)
        
            //console.log(slices)
            const xScale = d3.scaleTime().range([0,width]);
            const yScale = d3.scaleLinear().rangeRound([height-150, 0]);
            xScale.domain(d3.extent(data, function(d){
                return timeConv(d.date)}));
            yScale.domain([(0), d3.max(slices, function(c) {
                return d3.max(c.values, function(d) {
                    return d.measurement + 4; });
                    })
                ]);
    
            const yaxis = d3.axisLeft().scale(yScale); 
            const xaxis = d3.axisBottom().
            scale(xScale);
            // const xaxis = d3.axisBottom()
            // .ticks(d3.timeDay.every(30))
            // .tickFormat(d3.timeFormat('%m %d'))
            // .scale(xScale)   
            
            svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(70," + (height + 550) + ")")
            .attr("id", "xaxis")
            .call(xaxis);
        
            svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(70," + (height-100) + ")")
            .attr("id", "yaxis")
            .call(yaxis);
    
            const line = d3.line()
            .x(function(d) { return xScale(d.date); })
            .y(function(d) { return yScale(d.measurement);});        
         
            const lines = svg.selectAll("lines")
            .data(slices)
            .enter()
            .append("g")    
            .attr("transform", "translate(70," + (height-100) + ")")
    
    
            lines.append("path")
            .attr("d", function(d) { return line(d.values); })
            .attr("id", "line");

            })

///////////////////////////////////////////////////////////END death state line chart按照州来

            })
            .attr("d", pathGenerator)
            .attr("cases", function (d) {return d.cases})
            .attr("deaths", function (d) {return d.deaths})
            .attr("name", function (d) {return d.name})

        let palette = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'palette');
        palette
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%');
          
        let pop_levels = d3.range(min_deaths, max_deaths, max_deaths/10);
        //console.log(pop_levels)
        palette.selectAll('stop')
            .data(pop_levels)
            .enter()
            .append('stop')
            .attr('offset',  (d, i) => { 
             return`${(i+1)*100/pop_levels.length}%`
            })
            .attr('stop-color', d => GreycolorScale(d));
            
        let legend = svg.append('g');
        legend.attr('transform', 'translate(300, 0)');
        legend.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 300)
            .attr('height', 20)
            .style('fill', 'url(#palette');
      
        let legendScale = d3.scaleLinear()
            .range([0, 300])
            .domain([min_deaths, max_deaths])
            .nice();
        let legnedAxis = d3.axisBottom(legendScale).ticks(5, '~s');
        legend.append('g')
            .attr('transform', 'translate(0, 20)')
            .call(legnedAxis);
        })
    //START/////////////////////////////////////////////US death num

    
    const timeConv = d3.timeParse("%Y-%m-%d")

    let dataset = d3.csv("US.csv");
    dataset.then(function(data){

        const slices = data.columns.slice(2,3).map(function(id) {
            return {
                values: data.map(function(d){
                    console.log(d.id)
                    return {
                        date: timeConv(d.date),
                        measurement: +d[id]
                    };
                })
            };
        })
        // console.log(slices);

        const xScale = d3.scaleTime().range([0,width]);
        const yScale = d3.scaleLinear().rangeRound([height-150, 0]);
        xScale.domain(d3.extent(data, function(d){
            return timeConv(d.date)}));
        yScale.domain([(0), d3.max(slices, function(c) {
            return d3.max(c.values, function(d) {
                return d.measurement + 4; });
                })
            ]);

        const yaxis = d3.axisLeft().scale(yScale); 
        const xaxis = d3.axisBottom().
        scale(xScale);
        // const xaxis = d3.axisBottom()
        // .ticks(d3.timeDay.every(30))
        // .tickFormat(d3.timeFormat('%m %d'))
        // .scale(xScale)   
        
        svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(70," + (height + 550) + ")")
        .attr("id", "xaxis")
        .call(xaxis);
    
        svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(70," + (height-100) + ")")
        .attr("id", "yaxis")
        .call(yaxis);

        let line = d3.line()
        .x(function(d) { return xScale(d.date); })
        .y(function(d) { return yScale(d.measurement);});        
     
        let lines = svg.selectAll("lines")
        .data(slices)
        .enter()
        .append("g")    
        .attr("transform", "translate(70," + (height-100) + ")")


        lines.append("path")
        .attr("d", function(d) { return line(d.values); })
        .attr("id", "line");

    })    
    //END/////////////////////////////////////////////US death num


}

function combine(data1, data2){
    let rel = [];
    let i = 0;
    let j = 0;
    for (i = 0; i < data1.length; i++){
        for (j = 0; j < data2.length; j++){
            if (Number(data1[i].fips) == Number(data2[j].id)){
                rel.push({
                    type: data2[j].type,
                    id: data2[j].id,
                    properties: data2[j].properties,
                    geometry: data2[j].geometry,
                    name: data1[i].state,
                    cases: Number(data1[i].cases),
                    deaths: Number(data1[i].deaths)
                });
            }
        }
    }
    return rel;
}

function each_month_data(month, data){
    let USdata_month = [];
    let USdata_month1 = [];
    let USdata_month2 = [];
    if (month == "Total"){
        USdata_month = data.filter(d => d.date == "2020/11/27");
    }
    if (month == "Jan"){
        USdata_month = data.filter(d => d.date == "2020/1/31");
    }
    if (month == "Feb"){
        USdata_month1 = data.filter(d => d.date == "2020/2/29");
        USdata_month2 = data.filter(d => d.date == "2020/1/31");
        USdata_month = substract(USdata_month1, USdata_month2);
    }
    if (month == "Mar"){
        USdata_month1 = data.filter(d => d.date == "2020/3/31");
        USdata_month2 = data.filter(d => d.date == "2020/2/29");
        USdata_month = substract(USdata_month1, USdata_month2);
    }
    if (month == "Apr"){
        USdata_month1 = data.filter(d => d.date == "2020/4/30");
        USdata_month2 = data.filter(d => d.date == "2020/3/31");
        USdata_month = substract(USdata_month1, USdata_month2);
    }
    if (month == "May"){
        USdata_month1 = data.filter(d => d.date == "2020/5/31");
        USdata_month2 = data.filter(d => d.date == "2020/4/30");
        USdata_month = substract(USdata_month1, USdata_month2);
    }
    if (month == "Jun"){
        USdata_month1 = data.filter(d => d.date == "2020/6/30");
        USdata_month2 = data.filter(d => d.date == "2020/5/31");
        USdata_month = substract(USdata_month1, USdata_month2);
    }
    if (month == "Jul"){
        USdata_month1 = data.filter(d => d.date == "2020/7/31");
        USdata_month2 = data.filter(d => d.date == "2020/6/30");
        USdata_month = substract(USdata_month1, USdata_month2);
    }
    if (month == "Aug"){
        USdata_month1 = data.filter(d => d.date == "2020/8/31");
        USdata_month2 = data.filter(d => d.date == "2020/7/31");
        USdata_month = substract(USdata_month1, USdata_month2);
    }
    if (month == "Sep"){
        USdata_month1 = data.filter(d => d.date == "2020/9/30");
        USdata_month2 = data.filter(d => d.date == "2020/8/31");
        USdata_month = substract(USdata_month1, USdata_month2);
    }
    if (month == "Oct"){
        USdata_month1 = data.filter(d => d.date == "2020/10/31");
        USdata_month2 = data.filter(d => d.date == "2020/9/30");
        USdata_month = substract(USdata_month1, USdata_month2);
    }
    if (month == "Nov"){
        USdata_month1 = data.filter(d => d.date == "2020/11/27");
        USdata_month2 = data.filter(d => d.date == "2020/10/31");
        USdata_month = substract(USdata_month1, USdata_month2);
    }
    return USdata_month;
}

function substract(data1, data2){
    console.log(data1);
    let i = 0;
    let j = 0;
    let new_array = [];
    for (i = 0; i < data2.length; i++){
        for (j = 0; j < data1.length; j++){
            if (data2[i].fips == data1[j].fips){
                new_array.push({
                    date: data1[j].date,
                    state: data1[j].state,
                    fips: data1[j].fips,
                    cases: data1[j].cases - data2[i].cases,
                    deaths: data1[j].deaths - data2[i].deaths
                })
                }
            }
        }
    return new_array;
}
const margin = 300;
const svg = d3.select('svg');
const width = svg.attr("width") - 0.5 * margin;
const height = svg.attr("height") - 2 * margin;
var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .attr("id", "mytooltip")
    .style("visibility", "hidden")
    .style("border", "solid")
    .text("simple toolkit")




Promise.all([
    d3.json('states-projection.json'),
    d3.csv("us-states.csv")
]).then(([mapdata, USdata_all]) => {
    console.log(USdata_all);
    USdata = USdata_all.filter(d => d.date == "2020/11/27");
    let cases = USdata.map(d => Number(d.cases));
    // console.log(USdata);

    let min_cases = 0;
    let max_cases = d3.max(cases);
    const colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain([min_cases, max_cases]);

    // console.log(cases);
    // console.log(min_cases);
    // console.log(max_cases);
    

    let states = topojson.feature(mapdata, mapdata.objects.states).features;
    // console.log(states);

    states = combine(USdata, states);
    console.log(states);
    // console.log(states.length);

    const pathGenerator = d3.geoPath();

    svg.append("g")
        .selectAll("path")
        .data(states)
        .enter()
        .append("path")
        .attr("class", "states")
        .attr("id", function (d) {return d.id})
        .style("fill", d => colorScale(Number(d.cases)))
        .on("mouseover", function(){
            //console.log(Object.values(this)[0].name);
            d3.select("#mytooltip")
            .style("visibility", "visible")
            .text("State:" + Object.values(this)[0].name + "\n"+ "Cases:" + Object.values(this)[0].cases + "\n");
        })
        .on("mousemove", function(){
            d3.select("#mytooltip")
            .style("top", (event.pageY-10)+ "px")
            .style("left", (event.pageX+6) + "px");
        })
        .on("mouseout", function(){
            d3.select("#mytooltip")
            .style("visibility", "hidden");
        })
        .on("click", function(){
            console.log(this.id);
            let state_id = this.id;
            d3.selectAll("path")
            .style("stroke", "black")
            .style("stroke-width", 1);
            d3.select(this)
            .style("stroke", "darkblue")
            .style("stroke-width", 5);
//START------------------------------------------------------------State case
        // console.log(dataset)
        // dataset = dataset.filter(d => d.fips == this.id)
        // console.log(dataset)
            // console.log(state_id)
            // console.log(USdata_all)

            d3.select("#line")
            .remove()
            d3.select("#xaxis")
            .remove()
            d3.select("#yaxis")
            .remove()
            let timeConv = d3.timeParse("%Y/%m/%d")
            dataset = USdata_all.filter(d => Number(d.fips) == Number(state_id))
            // console.log(dataset)
            Promise.all([dataset]).then(([data]) => {
                // console.log(data)
                let slices = ["cases"].map(function(id) {
                    return {
                        values: data.map(function(d){
                            //console.log(d.date)
                            return {
                                date: timeConv(d.date),
                                measurement: +d[id]
                            }; 
                        })
                    };
                })
            console.log(slices)
        
            //console.log(slices)
            const xScale = d3.scaleTime().range([0,width]);
            const yScale = d3.scaleLinear().rangeRound([height-150, 0]);
            xScale.domain(d3.extent(data, function(d){
                return timeConv(d.date)}));
            yScale.domain([(0), d3.max(slices, function(c) {
                return d3.max(c.values, function(d) {
                    return d.measurement + 4; });
                    })
                ]);
    
            const yaxis = d3.axisLeft().scale(yScale); 
            const xaxis = d3.axisBottom().
            scale(xScale);
            // const xaxis = d3.axisBottom()
            // .ticks(d3.timeDay.every(30))
            // .tickFormat(d3.timeFormat('%m %d'))
            // .scale(xScale)   
            
            svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(70," + (height + 550) + ")")
            .attr("id", "xaxis")
            .call(xaxis);
        
            svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(70," + (height-100) + ")")
            .attr("id", "yaxis")
            .call(yaxis);
    
            const line = d3.line()
            .x(function(d) { return xScale(d.date); })
            .y(function(d) { return yScale(d.measurement);});        
         
            const lines = svg.selectAll("lines")
            .data(slices)
            .enter()
            .append("g")    
            .attr("transform", "translate(70," + (height-100) + ")")
    
    
            lines.append("path")
            .attr("d", function(d) { return line(d.values); })
            .attr("id", "line");

            })
//END STATE
    })
        
        .attr("d", pathGenerator)
        .attr("cases", function (d) {return d.cases})
        .attr("deaths", function (d) {return d.deaths})
        .attr("name", function (d) {return d.name})
    
    // svg.selectAll("path")
    // .data(states)
    // .attr("id", function (d) {return d.id})
    // .style("fill", d => colorScale(Number(d.cases)))
    // .on("mouseover", function(){
    //     console.log(this);
    // })

    // svg.append("path")
    //     .attr("class", "state-borders")
    //     .attr("d", pathGenerator(topojson.mesh(data, data.objects.states, function(a, b) { return a !== b; })));

    let palette = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'palette');
    palette
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    
    let pop_levels = d3.range(min_cases, max_cases, max_cases/10);
    //console.log(pop_levels)
    palette.selectAll('stop')
      .data(pop_levels)
      .enter()
      .append('stop')
      .attr('offset',  (d, i) => { 
       return`${(i+1)*100/pop_levels.length}%`
      })
      .attr('stop-color', d => colorScale(d));
      
    let legend = svg.append('g');
    legend.attr('transform', 'translate(300, 0)');
    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 300)
      .attr('height', 20)
      .style('fill', 'url(#palette');

    let legendScale = d3.scaleLinear()
      .range([0, 300])
      .domain([min_cases, max_cases])
      .nice();
    let legnedAxis = d3.axisBottom(legendScale).ticks(5, '~s');
    legend.append('g')
      .attr('transform', 'translate(0, 20)')
      .call(legnedAxis);



//START///////////////////////////////////------Line----Chart-----USall--------////////////////////////////////////START
    let timeConv = d3.timeParse("%Y-%m-%d")

    let dataset = d3.csv("US.csv");
    dataset.then(function(data){

        // console.log(data)
        const slices = data.columns.slice(1,2).map(function(id) {
            return {
                values: data.map(function(d){
                    // console.log(d.id)
                    return {
                        date: timeConv(d.date),
                        measurement: +d[id]
                    };
                })
            };
        })
        console.log(slices);

        const xScale = d3.scaleTime().range([0,width]);
        const yScale = d3.scaleLinear().rangeRound([height-150, 0]);
        xScale.domain(d3.extent(data, function(d){
            return timeConv(d.date)}));
        yScale.domain([(0), d3.max(slices, function(c) {
            return d3.max(c.values, function(d) {
                return d.measurement + 4; });
                })
            ]);

        const yaxis = d3.axisLeft().scale(yScale); 
        const xaxis = d3.axisBottom().
        scale(xScale);
        // const xaxis = d3.axisBottom()
        // .ticks(d3.timeDay.every(30))
        // .tickFormat(d3.timeFormat('%m %d'))
        // .scale(xScale)   
        
        svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(70," + (height + 550) + ")")
        .attr("id", "xaxis")
        .call(xaxis);
    
        svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(70," + (height-100) + ")")
        .attr("id", "yaxis")
        .call(yaxis);

        let line = d3.line()
        .x(function(d) { return xScale(d.date); })
        .y(function(d) { return yScale(d.measurement);});        
     
        let lines = svg.selectAll("lines")
        .data(slices)
        .enter()
        .append("g")    
        .attr("transform", "translate(70," + (height-100) + ")")


        lines.append("path")
        .attr("d", function(d) { return line(d.values); })
        .attr("id", "line");
    })    
    /////////////////////////////////////------Line----Chart-----US--------////////////////////////////////////

})

