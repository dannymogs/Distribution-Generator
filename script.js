document.addEventListener('DOMContentLoaded', function() {
    const distributions = [];

    function updateUI() {
        const distType = document.getElementById('dist-type').value;
        document.querySelectorAll('.param-section').forEach(section => section.style.display = 'none');
        if (distType === 'Triangular') {
            document.getElementById('triangular-params').style.display = 'block';
        } else if (distType === 'Gaussian') {
            document.getElementById('gaussian-params').style.display = 'block';
        } else if (distType === 'Lognormal') {
            document.getElementById('lognormal-params').style.display = 'block';
        }
    }

    document.getElementById('dist-type').addEventListener('change', updateUI);

    function randomTriangular(a, b, c) {
        const U = Math.random();
        if (U < (b - a) / (c - a)) {
            return a + Math.sqrt(U * (b - a) * (c - a));
        } else {
            return c - Math.sqrt((1 - U) * (c - b) * (c - a));
        }
    }

    function generateDistribution() {
        const n = parseInt(document.getElementById('n').value);
        const distType = document.getElementById('dist-type').value;
        const title = document.getElementById('title').value;

        let distribution;
        if (distType === 'Triangular') {
            const a = parseFloat(document.getElementById('a').value);
            const b = parseFloat(document.getElementById('b').value);
            const c = parseFloat(document.getElementById('c').value);
            distribution = d3.range(n).map(() => randomTriangular(a, b, c));
        } else if (distType === 'Gaussian') {
            const mu = parseFloat(document.getElementById('mu').value);
            const sigma = parseFloat(document.getElementById('sigma').value);
            distribution = d3.range(n).map(() => d3.randomNormal(mu, sigma)());
        } else if (distType === 'Lognormal') {
            const mu = parseFloat(document.getElementById('log-mu').value);
            const sigma = parseFloat(document.getElementById('log-sigma').value);
            distribution = d3.range(n).map(() => d3.randomLogNormal(mu, sigma)());
        }

        distributions.push({ title, distribution, distType });
        plotDistribution(title, distribution);
    }

    function plotDistribution(title, data) {
        const margin = { top: 40, right: 30, bottom: 30, left: 40 };
        const width = 500 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        const svg = d3.create("svg")
            .attr("width", 500)
            .attr("height", 300);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain(d3.extent(data))
            .range([0, width]);

        const histogram = d3.histogram()
            .domain(x.domain())
            .thresholds(x.ticks(50));

        const bins = histogram(data);

        const y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([height, 0]);

        const bar = g.selectAll(".bar")
            .data(bins)
            .enter().append("g")
            .attr("class", "bar")
            .attr("transform", d => `translate(${x(d.x0)},${y(d.length)})`);

        bar.append("rect")
            .attr("x", 1)
            .attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
            .attr("height", d => height - y(d.length))
            .attr("fill", "blue");

        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format(".2f")));

        g.append("g")
            .call(d3.axisLeft(y));

        // Adding title
        svg.append("text")
            .attr("x", (width / 2) + margin.left)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("text-decoration", "underline")
            .text(title);

        const plotArea = document.getElementById('plot-area');
        plotArea.appendChild(svg.node());
    }

    document.getElementById('generate').addEventListener('click', generateDistribution);

    function combineDistributions() {
        // Filter out combined distributions
        const baseDistributions = distributions.filter(dist => !dist.title.startsWith('Combined'));

        if (baseDistributions.length < 2) {
            alert('Need at least two base distributions to combine.');
            return;
        }

        const operation = document.getElementById('combine-operation').value;

        let combinedDist = baseDistributions[0].distribution.slice();
        const usedTitles = [baseDistributions[0].title];

        for (let i = 1; i < baseDistributions.length; i++) {
            if (operation === 'Add') {
                combinedDist = combinedDist.map((d, idx) => d + baseDistributions[i].distribution[idx]);
            } else if (operation === 'Subtract') {
                combinedDist = combinedDist.map((d, idx) => d - baseDistributions[i].distribution[idx]);
            } else if (operation === 'Multiply') {
                combinedDist = combinedDist.map((d, idx) => d * baseDistributions[i].distribution[idx]);
            } else if (operation === 'Divide') {
                combinedDist = combinedDist.map((d, idx) => d / baseDistributions[i].distribution[idx]);
            }
            usedTitles.push(baseDistributions[i].title);
        }

        const combinedTitle = `Combined (${usedTitles.join(', ')})`;
        distributions.push({ title: combinedTitle, distribution: combinedDist, distType: 'Combined' });
        plotDistribution(combinedTitle, combinedDist);
    }

    document.getElementById('combine').addEventListener('click', combineDistributions);

    function deleteAllDistributions() {
        distributions.length = 0;
        document.getElementById('plot-area').innerHTML = '';
    }

    document.getElementById('delete-all').addEventListener('click', deleteAllDistributions);

    function exportCSV() {
        let csvContent = "data:text/csv;charset=utf-8,";

        const titles = distributions.map(dist => dist.title);
        csvContent += titles.join(",") + "\n";

        const maxLength = Math.max(...distributions.map(dist => dist.distribution.length));

        for (let i = 0; i < maxLength; i++) {
            const row = distributions.map(dist => dist.distribution[i] || "").join(",");
            csvContent += row + "\n";
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "distributions.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    document.getElementById('export').addEventListener('click', exportCSV);

    updateUI();
});
