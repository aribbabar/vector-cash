import { CommonModule } from "@angular/common";
import { Component, ElementRef, HostListener, ViewChild } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import * as d3 from "d3";
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
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: "./chart.component.html",
  styleUrls: ["./chart.component.scss"]
})
export class ChartComponent {
  @ViewChild("chartContainer") private chartContainer!: ElementRef;
  @ViewChild("tooltip") private tooltip!: ElementRef;

  groupedEntries: GroupedEntry[] = [];
  accounts: Account[] = [];
  accountCategories: AccountCategory[] = [];
  financialData: FinancialData[] = [];
  filteredData: FinancialData[] = [];
  selectedTimeFrame = "all";

  private svg: any;
  private margin = { top: 20, right: 30, bottom: 50, left: 100 };
  private width = 960;
  private height = 500;

  // Cached groups for better update performance
  private xAxisGroup: any;
  private yAxisGroup: any;
  private gridGroup: any;
  private linesGroup: any;
  private focusGroup: any;

  constructor(
    private entryService: EntryService,
    private accountService: AccountService,
    private accountCategoryService: AccountCategoryService
  ) {}

  async ngAfterViewInit() {
    this.accounts = await this.accountService.getAll();
    this.accountCategories = await this.accountCategoryService.getAll();

    this.entryService.entries$.subscribe(async (entries) => {
      this.groupedEntries = await this.entryService.getAllGrouped();
      this.financialData = await this.getFinancialData();
      this.filteredData = [...this.financialData];
      this.updateChart();
      this.createChart();
    });

    window.addEventListener("resize", this.onRezize.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener("resize", this.onRezize.bind(this));
  }

  @HostListener("window:resize")
  onRezize() {
    this.createChart();
  }

  async getFinancialData(): Promise<FinancialData[]> {
    const financialData: FinancialData[] = [];

    // Precompute maps for accounts and categories for fast lookup
    const accountMap = new Map(this.accounts.map((a) => [a.id, a]));
    const categoryMap = new Map(this.accountCategories.map((c) => [c.id, c]));

    for (const groupedEntry of this.groupedEntries) {
      let assetsTotal = 0;
      let liabilitiesTotal = 0;

      for (const entry of groupedEntry.entries) {
        const account = accountMap.get(entry.accountId);
        if (!account) continue;
        const category = categoryMap.get(account.categoryId);
        if (!category) continue;

        if (category.type === "Asset") {
          assetsTotal += entry.balance;
        } else if (category.type === "Liability") {
          liabilitiesTotal += entry.balance;
        }
      }

      financialData.push({
        date: new Date(groupedEntry.date),
        assetsTotal,
        liabilitiesTotal,
        netWorth: assetsTotal - liabilitiesTotal
      });
    }

    // Sort data by date (ascending)
    return financialData.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  filterData(timeFrame: string): void {
    this.selectedTimeFrame = timeFrame;

    const now = new Date();
    let startDate: Date;

    switch (timeFrame) {
      case "1w":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "1m":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "6m":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "ytd":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "1y":
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "5y":
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 5);
        break;
      case "all":
      default:
        this.filteredData = [...this.financialData];
        this.updateChart();
        return;
    }

    this.filteredData = this.financialData.filter(
      (item) => item.date >= startDate && item.date <= now
    );

    this.updateChart();
  }

  createChart(): void {
    if (!this.chartContainer || this.filteredData.length === 0) return;

    const containerWidth = this.chartContainer.nativeElement.offsetWidth;
    this.width = containerWidth - this.margin.left - this.margin.right;

    // Clear any existing SVG
    d3.select(this.chartContainer.nativeElement).selectAll("*").remove();

    // Create the SVG container
    this.svg = d3
      .select(this.chartContainer.nativeElement)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    // Create groups for axes, grid, lines, and focus elements
    this.xAxisGroup = this.svg
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${this.height})`);
    this.yAxisGroup = this.svg.append("g").attr("class", "axis y-axis");
    this.gridGroup = this.svg.append("g").attr("class", "grid");
    this.linesGroup = this.svg.append("g").attr("class", "lines");

    // Create and cache the focus group (for tooltip elements)
    this.focusGroup = this.svg
      .append("g")
      .attr("class", "focus")
      .style("display", "none");
    this.focusGroup
      .append("circle")
      .attr("class", "assets-circle")
      .attr("r", 5)
      .attr("fill", "var(--mat-sys-tertiary)");
    this.focusGroup
      .append("circle")
      .attr("class", "liabilities-circle")
      .attr("r", 5)
      .attr("fill", "var(--mat-sys-error)");
    this.focusGroup
      .append("circle")
      .attr("class", "networth-circle")
      .attr("r", 5)
      .attr("fill", "var(--mat-sys-primary)");
    this.focusGroup
      .append("line")
      .attr("class", "focus-line")
      .attr("y1", 0)
      .attr("y2", this.height)
      .attr("stroke", "#888")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3");

    // Create transparent overlay once
    this.svg
      .append("rect")
      .attr("class", "overlay")
      .attr("width", this.width)
      .attr("height", this.height)
      .style("opacity", 0)
      .on("mouseover", () => {
        this.focusGroup.style("display", null);
        d3.select(this.tooltip.nativeElement).style("display", null);
      })
      .on("mouseout", () => {
        this.focusGroup.style("display", "none");
        d3.select(this.tooltip.nativeElement).style("display", "none");
      })
      .on("mousemove", (event: MouseEvent) => this.handleMousemove(event));

    // Initial chart render
    this.updateChart();
  }

  private handleMousemove(event: MouseEvent): void {
    // X scale (recompute to ensure it matches the current filteredData)
    const x = d3
      .scaleTime()
      .domain(d3.extent(this.filteredData, (d) => d.date) as [Date, Date])
      .range([0, this.width]);

    // Y scale
    const maxValue = d3.max([
      d3.max(this.filteredData, (d) => d.assetsTotal) ?? 0,
      d3.max(this.filteredData, (d) => d.liabilitiesTotal) ?? 0,
      d3.max(this.filteredData, (d) => d.netWorth) ?? 0
    ]) as number;
    const minValue = d3.min([
      d3.min(this.filteredData, (d) => d.netWorth) ?? 0,
      0
    ]) as number;
    const y = d3
      .scaleLinear()
      .domain([minValue < 0 ? minValue * 1.1 : 0, maxValue * 1.1])
      .range([this.height, 0]);

    const currencyFormatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    const dateFormatter = d3.timeFormat("%b %d, %Y");
    const bisect = d3.bisector<FinancialData, Date>((d) => d.date).left;

    const mouseX = d3.pointer(event)[0];
    const x0 = x.invert(mouseX);
    const i = bisect(this.filteredData, x0, 1);
    if (i >= this.filteredData.length) return;
    const d0 = this.filteredData[i - 1];
    const d1 = this.filteredData[i];
    const d =
      x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime()
        ? d1
        : d0;

    // Update focus elements positions
    this.focusGroup
      .select(".assets-circle")
      .attr("cx", x(d.date))
      .attr("cy", y(d.assetsTotal));
    this.focusGroup
      .select(".liabilities-circle")
      .attr("cx", x(d.date))
      .attr("cy", y(d.liabilitiesTotal));
    this.focusGroup
      .select(".networth-circle")
      .attr("cx", x(d.date))
      .attr("cy", y(d.netWorth));
    this.focusGroup
      .select(".focus-line")
      .attr("x1", x(d.date))
      .attr("x2", x(d.date));

    // Update tooltip content
    const tooltipEl = d3.select(this.tooltip.nativeElement);
    tooltipEl.select(".tooltip-date").text(dateFormatter(d.date));
    tooltipEl
      .select(".tooltip-value.assets span")
      .text(currencyFormatter.format(d.assetsTotal));
    tooltipEl
      .select(".tooltip-value.liabilities span")
      .text(currencyFormatter.format(d.liabilitiesTotal));
    tooltipEl
      .select(".tooltip-value.net-worth span")
      .text(currencyFormatter.format(d.netWorth));

    // Position tooltip to follow the mouse cursor
    const tooltipWidth = this.tooltip.nativeElement.offsetWidth;
    const tooltipHeight = this.tooltip.nativeElement.offsetHeight;
    const mouseLeft = event.clientX;
    const mouseTop = event.clientY;
    let tooltipLeft = mouseLeft + 20;
    let tooltipTop = mouseTop - tooltipHeight / 2;

    if (tooltipLeft + tooltipWidth > window.innerWidth)
      tooltipLeft = mouseLeft - tooltipWidth - 10;
    if (tooltipTop + tooltipHeight > window.innerHeight)
      tooltipTop = window.innerHeight - tooltipHeight - 10;
    if (tooltipTop < 0) tooltipTop = 10;

    tooltipEl.style("left", `${tooltipLeft}px`).style("top", `${tooltipTop}px`);
  }

  updateChart(): void {
    if (!this.svg || this.filteredData.length === 0) return;

    // Recompute scales
    const x = d3
      .scaleTime()
      .domain(d3.extent(this.filteredData, (d) => d.date) as [Date, Date])
      .range([0, this.width]);
    const maxValue = d3.max([
      d3.max(this.filteredData, (d) => d.assetsTotal) ?? 0,
      d3.max(this.filteredData, (d) => d.liabilitiesTotal) ?? 0,
      d3.max(this.filteredData, (d) => d.netWorth) ?? 0
    ]) as number;
    const minValue = d3.min([
      d3.min(this.filteredData, (d) => d.netWorth) ?? 0,
      0
    ]) as number;
    const y = d3
      .scaleLinear()
      .domain([minValue < 0 ? minValue * 1.1 : 0, maxValue * 1.1])
      .range([this.height, 0]);

    // Update axes
    this.xAxisGroup.call(
      d3
        .axisBottom(x)
        .ticks(5)
        .tickFormat((domainValue: any) =>
          d3.timeFormat("%b %Y")(
            domainValue instanceof Date ? domainValue : new Date(+domainValue)
          )
        )
    );
    this.yAxisGroup.call(
      d3.axisLeft(y).tickFormat((d: any) =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(d)
      )
    );

    // Update grid lines
    this.gridGroup.call(
      d3
        .axisLeft(y)
        .tickSize(-this.width)
        .tickFormat(() => "")
    );

    // Line generator function
    const createLine = (accessor: (d: FinancialData) => number) => {
      return d3
        .line<FinancialData>()
        .x((d) => x(d.date))
        .y((d) => y(accessor(d)))
        .curve(d3.curveMonotoneX);
    };

    // Use join to update paths in the linesGroup
    const linesData = [
      {
        key: "assets",
        accessor: (d: FinancialData) => d.assetsTotal,
        stroke: "var(--mat-sys-tertiary)",
        strokeWidth: 2
      },
      {
        key: "liabilities",
        accessor: (d: FinancialData) => d.liabilitiesTotal,
        stroke: "var(--mat-sys-error)",
        strokeWidth: 2
      },
      {
        key: "networth",
        accessor: (d: FinancialData) => d.netWorth,
        stroke: "var(--mat-sys-primary)",
        strokeWidth: 3
      }
    ];

    const paths = this.linesGroup
      .selectAll("path")
      .data(linesData, (d: any) => d.key);

    paths.exit().remove();

    paths
      .enter()
      .append("path")
      .merge(paths)
      .attr("fill", "none")
      .attr("stroke", (d: any) => d.stroke)
      .attr("stroke-width", (d: any) => d.strokeWidth)
      .attr("d", (d: any) => createLine(d.accessor)(this.filteredData)!);

    // Update X axis label (recreate or reposition as needed)
    this.svg.selectAll(".axis-label.x").remove(); // remove previous
    this.svg
      .append("text")
      .attr("class", "axis-label x")
      .attr("x", this.width / 2)
      .attr("y", this.height + this.margin.top + 20)
      .style("text-anchor", "middle")
      .style("fill", "var(--mat-sys-on-surface-variant)")
      .text("Date");

    // Update Y axis label
    this.svg.selectAll(".axis-label.y").remove();
    this.svg
      .append("text")
      .attr("class", "axis-label y")
      .attr("transform", "rotate(-90)")
      .attr("y", 10 - this.margin.left)
      .attr("x", -this.height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("fill", "var(--mat-sys-on-surface-variant)")
      .text("Balance ($)");
  }
}
