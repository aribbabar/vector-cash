import { CommonModule } from "@angular/common";
import { Component, HostListener, OnDestroy, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import * as d3 from "d3";
import { Subscription } from "rxjs";
import { AccountCategory } from "../../core/models/account-category.model";
import { Account } from "../../core/models/account.model";
import { GroupedEntry } from "../../core/models/entry.model";
import { AccountCategoryService } from "../../core/services/account-category.service";
import { AccountService } from "../../core/services/account.service";
import { EntryService } from "../../core/services/entry.service";

interface FinancialData {
  date: Date;
  assetsTotal: number;
  liabilitiesTotal: number;
  netWorth: number;
}

@Component({
  selector: "app-chart",
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: "./chart.component.html",
  styleUrls: ["./chart.component.scss"],
  // Add custom color properties for chart elements
  host: {
    style: `
      --color-assets: #4CAF50;
      --color-liabilities: #F44336;
      --color-net-worth: #2196F3;
    `
  }
})
export class ChartComponent implements OnInit, OnDestroy {
  timeFrames = ["1w", "1m", "6m", "ytd", "1y", "5y"];
  groupedEntries: GroupedEntry[] = [];
  accounts: Account[] = [];
  accountCategories: AccountCategory[] = [];
  financialData: FinancialData[] = [];
  filteredData: FinancialData[] = [];
  selectedTimeFrame = "all";
  private subscriptions = new Subscription();
  readonly minChartWidth = 600;

  constructor(
    private entryService: EntryService,
    private accountService: AccountService,
    private accountCategoryService: AccountCategoryService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    // Clean up D3 elements to prevent memory leaks
    d3.select("#chart").selectAll("*").remove();
  }

  @HostListener("window:resize")
  onResize() {
    // Redraw chart on window resize
    this.drawChart();
  }

  async loadData() {
    try {
      this.accounts = await this.accountService.getAll();
      this.accountCategories = await this.accountCategoryService.getAll();

      const entriesSub = this.entryService.entries$.subscribe(async () => {
        this.groupedEntries = await this.entryService.getAllGrouped();
        this.processFinancialData();
        this.filterByTimeFrame(this.selectedTimeFrame);
      });

      // Add this line to load data on initial component load
      this.groupedEntries = await this.entryService.getAllGrouped();
      this.processFinancialData();
      this.filterByTimeFrame(this.selectedTimeFrame);

      this.subscriptions.add(entriesSub);
    } catch (error) {
      console.error("Error loading financial data:", error);
    }
  }

  processFinancialData() {
    this.financialData = [];

    if (!this.groupedEntries.length || !this.accounts.length) {
      return;
    }

    // Convert grouped entries to financial data points
    this.groupedEntries.forEach((group) => {
      const dateObj = this.parseDate(group.date);

      let assetsTotal = 0;
      let liabilitiesTotal = 0;

      group.entries.forEach((entry) => {
        const account = this.accounts.find((a) => a.id === entry.accountId);
        if (!account) return;

        const category = this.accountCategories.find(
          (c) => c.id === account.categoryId
        );
        if (!category) return;

        if (category.type === "Asset") {
          assetsTotal += entry.balance;
        } else if (category.type === "Liability") {
          liabilitiesTotal += entry.balance;
        }
      });

      const netWorth = assetsTotal - liabilitiesTotal;

      this.financialData.push({
        date: dateObj,
        assetsTotal,
        liabilitiesTotal,
        netWorth
      });
    });

    // Sort by date ascending
    this.financialData.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  parseDate(dateStr: string): Date {
    // Parse MM/DD/YYYY format
    const [month, day, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
  }

  filterByTimeFrame(timeFrame: string) {
    this.selectedTimeFrame = timeFrame;

    if (!this.financialData.length) {
      this.filteredData = [];
      return;
    }

    if (timeFrame === "all") {
      this.filteredData = [...this.financialData];
      // Ensure we call drawChart even if previousFilteredData was empty
      this.drawChart();
      return;
    }

    const now = new Date();
    let cutoffDate = new Date();

    switch (timeFrame) {
      case "1w":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "1m":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "6m":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "ytd":
        cutoffDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "1y":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case "5y":
        cutoffDate.setFullYear(now.getFullYear() - 5);
        break;
      default:
        this.filteredData = [...this.financialData];
        this.drawChart();
        return;
    }

    // Store the previous length to detect transitions from no data to data
    const previousLength = this.filteredData.length;

    this.filteredData = this.financialData.filter(
      (data) => data.date >= cutoffDate && data.date <= now
    );

    // Always redraw if we have data now, even if we didn't before
    if (this.filteredData.length > 0) {
      this.drawChart();
    }
  }

  drawChart() {
    if (this.filteredData.length === 0) return;

    // Ensure the chart container is visible and ready
    const chartContainer = document.getElementById("chart");
    if (!chartContainer) {
      // If container isn't in DOM yet, try again shortly
      setTimeout(() => this.drawChart(), 50);
      return;
    }

    // Clear previous chart
    d3.select("#chart").selectAll("*").remove();

    // Dimensions - adjust for minimum width
    const containerWidth =
      document.getElementById("chart")?.clientWidth || window.innerWidth - 40;
    const margin = { top: 20, right: 30, bottom: 50, left: 80 };

    // Set chart width based on container, but ensure minimum width
    const width = Math.max(this.minChartWidth, containerWidth);
    const height = 500;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG with responsive width
    const svg = d3
      .select("#chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMinYMid");

    // Create container group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(this.filteredData, (d) => d.date) as [Date, Date])
      .range([0, innerWidth]);

    // Find max value across all three data series for y-scale
    const yMax =
      d3.max(this.filteredData, (d) =>
        Math.max(d.assetsTotal, d.liabilitiesTotal, d.netWorth)
      ) || 0;

    // Find min value (particularly for net worth which might be negative)
    const yMin = d3.min(this.filteredData, (d) => Math.min(0, d.netWorth)) || 0;

    // Increase the padding on the y-axis range for better visualization
    const yScale = d3
      .scaleLinear()
      .domain([yMin * 1.2, yMax * 1.2]) // Increase padding to 20% on both ends
      .range([innerHeight, 0])
      .nice();

    // Create line generators
    const assetsLine = d3
      .line<FinancialData>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.assetsTotal))
      .curve(d3.curveMonotoneX);

    const liabilitiesLine = d3
      .line<FinancialData>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.liabilitiesTotal))
      .curve(d3.curveMonotoneX);

    const netWorthLine = d3
      .line<FinancialData>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.netWorth))
      .curve(d3.curveMonotoneX);

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    g.append("g")
      .attr("class", "xAxis")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis);

    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat((d) => `$${d3.format(",.0f")(d)}`);

    g.append("g").attr("class", "yAxis").call(yAxis);

    // Add grid lines
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(yScale.ticks())
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "#e0e0e0")
      .attr("stroke-dasharray", "3,3");

    // Get theme colors from CSS variables
    const assetColor =
      getComputedStyle(document.documentElement).getPropertyValue(
        "--color-assets"
      ) || "#4CAF50";
    const liabilityColor =
      getComputedStyle(document.documentElement).getPropertyValue(
        "--color-liabilities"
      ) || "#F44336";
    const netWorthColor =
      getComputedStyle(document.documentElement).getPropertyValue(
        "--color-net-worth"
      ) || "#2196F3";

    // Add lines with theme colors
    g.append("path")
      .datum(this.filteredData)
      .attr("class", "line assets-line")
      .attr("d", assetsLine)
      .attr("fill", "none")
      .attr("stroke", assetColor)
      .attr("stroke-width", 2);

    g.append("path")
      .datum(this.filteredData)
      .attr("class", "line liabilities-line")
      .attr("d", liabilitiesLine)
      .attr("fill", "none")
      .attr("stroke", liabilityColor)
      .attr("stroke-width", 2);

    g.append("path")
      .datum(this.filteredData)
      .attr("class", "line net-worth-line")
      .attr("d", netWorthLine)
      .attr("fill", "none")
      .attr("stroke", netWorthColor)
      .attr("stroke-width", 2.5);

    // Add data points for assets
    g.selectAll(".asset-point")
      .data(this.filteredData)
      .enter()
      .append("circle")
      .attr("class", "asset-point")
      .attr("cx", (d) => xScale(d.date))
      .attr("cy", (d) => yScale(d.assetsTotal))
      .attr("r", 3)
      .attr("fill", assetColor)
      .attr("stroke", "var(--mat-sys-surface)")
      .attr("stroke-width", 1);

    // Add data points for liabilities
    g.selectAll(".liability-point")
      .data(this.filteredData)
      .enter()
      .append("circle")
      .attr("class", "liability-point")
      .attr("cx", (d) => xScale(d.date))
      .attr("cy", (d) => yScale(d.liabilitiesTotal))
      .attr("r", 3)
      .attr("fill", liabilityColor)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    // Add data points for net worth
    g.selectAll(".net-worth-point")
      .data(this.filteredData)
      .enter()
      .append("circle")
      .attr("class", "net-worth-point")
      .attr("cx", (d) => xScale(d.date))
      .attr("cy", (d) => yScale(d.netWorth))
      .attr("r", 3)
      .attr("fill", netWorthColor)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    // Add tooltip functionality
    const tooltip = d3.select("#tooltip");
    const tooltipLine = g
      .append("line")
      .attr("class", "tooltip-line")
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#666")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .style("opacity", 0);

    const assetsPoint = g
      .append("circle")
      .attr("r", 5)
      .attr("fill", "#4CAF50")
      .style("opacity", 0);

    const liabilitiesPoint = g
      .append("circle")
      .attr("r", 5)
      .attr("fill", "#F44336")
      .style("opacity", 0);

    const netWorthPoint = g
      .append("circle")
      .attr("r", 5)
      .attr("fill", "#2196F3")
      .style("opacity", 0);

    // Create overlay for mouse events
    const bisect = d3.bisector<FinancialData, Date>((d) => d.date).left;

    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mousemove", (event: any) => {
        const mouseX = d3.pointer(event)[0];
        const x0 = xScale.invert(mouseX);
        const i = bisect(this.filteredData, x0, 1);
        const d0 = i > 0 ? this.filteredData[i - 1] : null;
        const d1 = i < this.filteredData.length ? this.filteredData[i] : null;
        const d =
          d0 && d1
            ? x0.getTime() - d0.date.getTime() >
              d1.date.getTime() - x0.getTime()
              ? d1
              : d0
            : d0 || d1;

        if (!d) return;

        const xPos = xScale(d.date);

        // Update line and points
        tooltipLine.attr("x1", xPos).attr("x2", xPos).style("opacity", 1);

        assetsPoint
          .attr("cx", xPos)
          .attr("cy", yScale(d.assetsTotal))
          .style("opacity", 1);

        liabilitiesPoint
          .attr("cx", xPos)
          .attr("cy", yScale(d.liabilitiesTotal))
          .style("opacity", 1);

        netWorthPoint
          .attr("cx", xPos)
          .attr("cy", yScale(d.netWorth))
          .style("opacity", 1);

        // Format date for tooltip
        const formatDate = d3.timeFormat("%b %d, %Y");

        // Get mouse position relative to chart container
        const chartContainer = document.querySelector(
          ".chart-content"
        ) as HTMLElement;
        const chartRect = chartContainer.getBoundingClientRect();
        const mousePosition = d3.pointer(event);

        // Calculate position relative to chart container
        const tooltipNode = tooltip.node() as HTMLElement;
        const tooltipWidth = tooltipNode.offsetWidth;
        const tooltipHeight = tooltipNode.offsetHeight;

        // Add offset from cursor to prevent tooltip from blocking view
        const xOffset = 25;
        const yOffset = 65;

        // Calculate tooltip position based on mouse position
        let xPosition = mouseX - margin.left - xOffset;
        let yPosition = mousePosition[1] - margin.top - yOffset;

        // Convert to page coordinates
        xPosition += chartRect.left;
        yPosition += chartRect.top;

        // Ensure tooltip doesn't go off the screen edges
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        if (xPosition + tooltipWidth > windowWidth) {
          xPosition = xPosition - tooltipWidth - xOffset * 2;
        }

        if (yPosition + tooltipHeight > windowHeight) {
          yPosition = yPosition - tooltipHeight - yOffset * 2;
        }

        // Apply positioning
        tooltip
          .style("display", "block")
          .style("left", `${xPosition}px`)
          .style("top", `${yPosition}px`);

        tooltip.select(".date").text(formatDate(d.date));
        tooltip
          .select(".assets-value")
          .text(`$${d3.format(",.2f")(d.assetsTotal)}`);
        tooltip
          .select(".liabilities-value")
          .text(`$${d3.format(",.2f")(d.liabilitiesTotal)}`);
        tooltip
          .select(".net-worth-value")
          .text(`$${d3.format(",.2f")(d.netWorth)}`);
      })
      .on("mouseleave", function () {
        tooltipLine.style("opacity", 0);
        assetsPoint.style("opacity", 0);
        liabilitiesPoint.style("opacity", 0);
        netWorthPoint.style("opacity", 0);
        tooltip.style("display", "none");
      });

    // Add labels
    svg
      .append("text")
      .attr("class", "y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 20)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#666")
      .text("Amount ($)");

    svg
      .append("text")
      .attr("class", "x-axis-label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("font-size", "12px")
      .attr("fill", "#666")
      .text("Date");
  }
}
