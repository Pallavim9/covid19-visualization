const nationalDataURL = 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us.csv';
const stateDataURL = 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv';

const parseTime = d3.timeParse("%Y-%m-%d");
const formatTime = d3.timeFormat("%B %d, %Y");
const formatComma = d3.format(",");

const continentalStates = ["Alabama", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
    "Florida", "Georgia", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska",
    "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas",
    "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];

const surgeDates = [
    { date: parseTime('2020-11-08'), label: 'First Surge' },
    { date: parseTime('2021-12-26'), label: 'Second Surge' }
];

function viz() {
    d3.csv(nationalDataURL, d => ({
        date: parseTime(d.date),
        cases: +d.cases,
        deaths: +d.deaths
    })).then(nationalData => {
        const margin = { top: 50, right: 30, bottom: 30, left: 70 },
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        const svg1 = d3.select("#chart1").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x1 = d3.scaleTime().domain(d3.extent(nationalData, d => d.date)).range([0, width]);
        const y1 = d3.scaleLinear().domain([0, d3.max(nationalData, d => d.cases)]).range([height, 0]);

        svg1.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x1));
        svg1.append("g").call(d3.axisLeft(y1));

        svg1.append("path")
            .datum(nationalData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line().x(d => x1(d.date)).y(d => y1(d.cases)));

        svg1.append("text")
            .attr("transform", `translate(${(width / 2)}, ${-margin.top / 2})`)
            .attr("class", "title")
            .attr("text-anchor", "middle")
            .text("National Covid-19 Cases Over Time")
            .style("font-size", "18px")
            .style("text-decoration", "underline");

        const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

        svg1.selectAll("dot")
            .data(nationalData)
            .enter().append("circle")
            .attr("r", 4)
            .attr("cx", d => x1(d.date))
            .attr("cy", d => y1(d.cases))
            .attr("fill", "steelblue")
            .on("mouseover", (event, d) => {
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`${formatTime(d.date)}<br/>Cases: ${formatComma(d.cases)}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", (event, d) => {
                tooltip.transition().duration(500).style("opacity", 0);
            })
            .on("click", (event, d) => {
                updateStateChart(d.date, () => {
                    d3.select("#chart2").node().scrollIntoView({ behavior: "smooth" });
                });
            });

        const annotations1 = surgeDates.map(d => ({
            note: { label: d.label, title: formatTime(d.date) },
            data: { date: d.date, cases: nationalData.find(nd => nd.date.getTime() === d.date.getTime()).cases },
            x: x1(d.date),
            y: y1(nationalData.find(nd => nd.date.getTime() === d.date.getTime()).cases),
            dy: -50,
            dx: -50
        }));

        const makeAnnotations1 = d3.annotation().annotations(annotations1);
        svg1.append("g").attr("class", "annotation-group").call(makeAnnotations1);

        function updateStateChart(selectedDate, callback) {
            d3.csv(stateDataURL, d => ({
                date: parseTime(d.date),
                state: d.state,
                cases: +d.cases,
                deaths: +d.deaths
            })).then(stateData => {
                const filteredData = stateData.filter(d =>
                    d.date.getTime() === selectedDate.getTime() &&
                    continentalStates.includes(d.state)
                );

                const margin = { top: 50, right: 30, bottom: 70, left: 60 },
                    width = 960 - margin.left - margin.right,
                    height = 500 - margin.top - margin.bottom;

                d3.select("#chart2").html("");

                const svg2 = d3.select("#chart2").append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);

                const x2 = d3.scaleBand().domain(filteredData.map(d => d.state)).range([0, width]).padding(0.1);
                const y2 = d3.scaleLinear().domain([0, d3.max(filteredData, d => d.cases)]).range([height, 0]);

                svg2.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x2)).selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end");
                svg2.append("g").call(d3.axisLeft(y2));

                svg2.selectAll(".bar")
                    .data(filteredData)
                    .enter().append("rect")
                    .attr("class", "bar")
                    .attr("x", d => x2(d.state))
                    .attr("y", d => y2(d.cases))
                    .attr("width", x2.bandwidth())
                    .attr("height", d => height - y2(d.cases))
                    .attr("fill", "steelblue")
                    .on("mouseover", (event, d) => {
                        tooltip.transition().duration(200).style("opacity", .9);
                        tooltip.html(`${d.state}<br/>Cases: ${formatComma(d.cases)}`)
                            .style("left", (event.pageX + 5) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", (event, d) => {
                        tooltip.transition().duration(500).style("opacity", 0);
                    })
                    .on("click", (event, d) => {
                        updateStateTimeChart(selectedDate, d.state, () => {
                            d3.select("#chart3").node().scrollIntoView({ behavior: "smooth" });
                        });
                    });

                svg2.append("text")
                    .attr("transform", `translate(${(width / 2)}, ${-margin.top / 2})`)
                    .attr("class", "title")
                    .attr("text-anchor", "middle")
                    .text(`Covid-19 Cases by State on ${formatTime(selectedDate)}`)
                    .style("font-size", "18px")
                    .style("text-decoration", "underline");

                if (callback) callback();
            }).catch(error => {
                console.error('Error loading state CSV file:', error);
            });
        }

        function updateStateTimeChart(selectedDate, selectedState, callback) {
            d3.csv(stateDataURL, d => ({
                date: parseTime(d.date),
                state: d.state,
                cases: +d.cases,
                deaths: +d.deaths
            })).then(stateData => {
                const stateFilteredData = stateData.filter(d => d.state === selectedState);

                const margin = { top: 50, right: 30, bottom: 100, left: 70 },
                    width = 960 - margin.left - margin.right,
                    height = 500 - margin.top - margin.bottom;

                d3.select("#chart3").html("");

                const svg3 = d3.select("#chart3").append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom + 50)  // Increase the height to accommodate the button
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);

                const x3 = d3.scaleTime().domain(d3.extent(stateFilteredData, d => d.date)).range([0, width]);
                const y3 = d3.scaleLinear().domain([0, d3.max(stateFilteredData, d => d.cases)]).range([height, 0]);

                svg3.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x3));
                svg3.append("g").call(d3.axisLeft(y3));

                svg3.append("path")
                    .datum(stateFilteredData)
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line().x(d => x3(d.date)).y(d => y3(d.cases)));

                svg3.append("text")
                    .attr("transform", `translate(${(width / 2)}, ${-margin.top / 2})`)
                    .attr("class", "title")
                    .attr("text-anchor", "middle")
                    .text(`Covid-19 Cases Over Time for ${selectedState}`)
                    .style("font-size", "18px")
                    .style("text-decoration", "underline");

                svg3.selectAll("dot")
                    .data(stateFilteredData)
                    .enter().append("circle")
                    .attr("r", 4)
                    .attr("cx", d => x3(d.date))
                    .attr("cy", d => y3(d.cases))
                    .attr("fill", "steelblue")
                    .on("mouseover", (event, d) => {
                        tooltip.transition().duration(200).style("opacity", .9);
                        tooltip.html(`${formatTime(d.date)}<br/>Cases: ${formatComma(d.cases)}`)
                            .style("left", (event.pageX + 5) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", (event, d) => {
                        tooltip.transition().duration(500).style("opacity", 0);
                    });

                const annotations3 = surgeDates.map(d => ({
                    note: { label: d.label, title: formatTime(d.date) },
                    data: { date: d.date, cases: stateFilteredData.find(sd => sd.date.getTime() === d.date.getTime()).cases },
                    x: x3(d.date),
                    y: y3(stateFilteredData.find(sd => sd.date.getTime() === d.date.getTime()).cases),
                    dy: -50,
                    dx: -50
                }));

                const makeAnnotations3 = d3.annotation().annotations(annotations3);
                svg3.append("g").attr("class", "annotation-group").call(makeAnnotations3);

                svg3.append("foreignObject")
                    .attr("x", width - 60)
                    .attr("y", height + margin.bottom - 70)  // Adjust the position to ensure it's within the view
                    .attr("width", 100)
                    .attr("height", 50)  // Increase height to avoid cutting
                    .append("xhtml:button")
                    .attr("id", "restartButton")
                    .text("Restart")
                    .style("background-color", "steelblue")
                    .style("color", "white")
                    .style("padding", "10px")
                    .style("border", "none")
                    .style("border-radius", "5px")
                    .style("cursor", "pointer")
                    .on("click", () => {
                        d3.select("#chart1").node().scrollIntoView({ behavior: "smooth" });
                    });

                if (callback) callback();
            }).catch(error => {
                console.error('Error loading state CSV file:', error);
            });
        }

        updateStateChart(nationalData[nationalData.length - 1].date);
    }).catch(error => {
        console.error('Error loading national CSV file:', error);
    });
}

window.onload = viz;
