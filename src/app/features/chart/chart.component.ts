import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';
import * as d3 from 'd3';
import {
  FormattedDataService,
  FormattedNetWorth
} from '../../core/services/formatted-data.service';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css'
})
export class ChartComponent implements OnInit {
  @ViewChild('chart', { static: true }) private chartContainer!: ElementRef;

  private data: FormattedNetWorth[] = [];
  private filteredData: FormattedNetWorth[] = [];

  private svg: any;
  private margin = { top: 20, right: 50, bottom: 30, left: 50 };
  private width = 0;
  private height = 0;

  // Date range options
  dateRanges = [
    { label: '1W', value: '1week' },
    { label: '1M', value: '1month' },
    { label: '6M', value: '6months' },
    { label: 'YTD', value: 'ytd' },
    { label: '1Y', value: '1year' },
    { label: '5Y', value: '5years' },
    { label: 'All', value: 'all' }
  ];

  selectedRange = 'all';

  constructor(private formattedDataService: FormattedDataService) {}

  async ngOnInit() {
    this.data = await this.formattedDataService.getNetWorthOverTime();

    // Sort the data by date to ensure proper ordering
    this.data = this.data.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Check if data has recent entries
    this.checkDataRecency();

    this.filterDataByRange();
    this.createChart();
  }

  private checkDataRecency() {
    if (this.data.length === 0) {
      console.warn('No data available for chart.');
      return;
    }

    // Find the most recent date in the data
    const mostRecentDate = new Date(
      Math.max(...this.data.map((item) => new Date(item.date).getTime()))
    );

    // Calculate how many days ago the most recent data is
    const today = new Date();
    const daysSinceLastEntry = Math.floor(
      (today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(
      `Most recent data entry is from ${mostRecentDate.toLocaleDateString()}, which is ${daysSinceLastEntry} days ago`
    );

    // Check if the first date is too far in the past
    const oldestDate = new Date(
      Math.min(...this.data.map((item) => new Date(item.date).getTime()))
    );
    console.log(`Oldest data entry is from ${oldestDate.toLocaleDateString()}`);
  }

  @HostListener('window:resize')
  onResize() {
    // Clear previous chart when window resizes
    this.clearChart();
    this.createChart();
  }

  private clearChart() {
    // Remove everything inside the chart div
    d3.select(this.chartContainer.nativeElement).selectAll('*').remove();
  }

  changeRange(range: string) {
    this.selectedRange = range;
    this.filterDataByRange();

    // Only proceed if we have data to show
    if (this.filteredData.length > 0) {
      this.clearChart();
      this.createChart();
    } else {
      console.error('No data available for selected range');
      // Display a message to the user that there's no data for this range
      d3.select(this.chartContainer.nativeElement)
        .append('div')
        .attr('class', 'chart-error')
        .style('text-align', 'center')
        .style('padding-top', '100px')
        .style('color', '#dc3545')
        .text('No data available for the selected time period');
    }
  }

  private filterDataByRange() {
    const today = new Date();
    let startDate: Date;

    switch (this.selectedRange) {
      case '1week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case '1month':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case '6months':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 6);
        break;
      case 'ytd':
        startDate = new Date(today.getFullYear(), 0, 1); // January 1st of current year
        break;
      case '1year':
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case '5years':
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 5);
        break;
      case 'all':
      default:
        this.filteredData = [...this.data];
        return;
    }

    // Filter data to include only entries after the start date
    this.filteredData = this.data.filter(
      (item) => new Date(item.date) >= startDate
    );

    // If filtered data is empty, revert to "all" data
    if (this.filteredData.length === 0) {
      console.warn(
        `No data available for ${this.selectedRange} range, reverting to all data`
      );
      this.selectedRange = 'all';
      this.filteredData = [...this.data];
    }

    // For debugging
    console.log(
      `Data after filtering by ${this.selectedRange}:`,
      this.filteredData.length
    );
  }

  private createChart() {
    // If no data after filtering, don't attempt to render chart
    if (!this.filteredData || this.filteredData.length === 0) {
      console.error('No data available to create chart');

      // Add an error message to the chart container
      d3.select(this.chartContainer.nativeElement)
        .append('div')
        .attr('class', 'chart-error')
        .style('text-align', 'center')
        .style('padding-top', '100px')
        .style('color', '#dc3545')
        .text('No data available for the selected time period');

      return;
    }

    // Check if we have at least 2 data points (needed for a line)
    if (this.filteredData.length < 2) {
      console.warn(
        'Only one data point available - line chart requires at least two points'
      );
    }

    const element = this.chartContainer.nativeElement;

    const containerWidth = element.clientWidth;
    this.width = containerWidth - this.margin.left - this.margin.right;
    this.height = 450 - this.margin.top - this.margin.bottom - 40;

    this.svg = d3
      .select(element)
      .append('svg')
      .attr('width', '100%')
      .attr('height', this.height + this.margin.top + this.margin.bottom + 40) // Add 40px for legend
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Define scales for chart
    const dateExtent = d3.extent(
      this.filteredData,
      (d) => new Date(d.date)
    ) as [Date, Date];

    const x = d3.scaleTime().domain(dateExtent).range([0, this.width]);

    // Find min/max values for y scale
    const maxValue =
      d3.max(this.filteredData, (d) => Math.max(d.assets, d.netWorth, 0)) || 0;

    const minValue =
      d3.min(this.filteredData, (d) =>
        Math.min(0, d.netWorth, d.liabilities)
      ) || 0;

    // Create y scale with domain that includes possible negative values
    const y = d3
      .scaleLinear()
      .domain([minValue, maxValue])
      .range([this.height, 0])
      .nice(); // Makes the axis values more readable

    // Create line generators for each metric
    const assetLine = d3
      .line<FormattedNetWorth>()
      .x((d) => x(new Date(d.date)))
      .y((d) => y(d.assets));

    const liabilityLine = d3
      .line<FormattedNetWorth>()
      .x((d) => x(new Date(d.date)))
      .y((d) => y(d.liabilities));

    const netWorthLine = d3
      .line<FormattedNetWorth>()
      .x((d) => x(new Date(d.date)))
      .y((d) => y(d.netWorth));

    // Add X Axis
    this.svg
      .append('g')
      .attr('transform', `translate(0,${y(0)})`) // Position at y=0
      .call(d3.axisBottom(x));

    // Add Y Axis
    this.svg.append('g').call(d3.axisLeft(y));

    // Add a horizontal line at y=0 if we have negative values
    if (minValue < 0) {
      this.svg
        .append('line')
        .attr('x1', 0)
        .attr('y1', y(0))
        .attr('x2', this.width)
        .attr('y2', y(0))
        .attr('stroke', '#888')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4');
    }

    // Add the assets line (green)
    this.svg
      .append('path')
      .datum(this.filteredData)
      .attr('fill', 'none')
      .attr('stroke', '#28a745') // Green
      .attr('stroke-width', 2)
      .attr('d', assetLine);

    // Add the liabilities line (red)
    this.svg
      .append('path')
      .datum(this.filteredData)
      .attr('fill', 'none')
      .attr('stroke', '#dc3545') // Red
      .attr('stroke-width', 2)
      .attr('d', liabilityLine);

    // Add the net worth line (blue)
    this.svg
      .append('path')
      .datum(this.filteredData)
      .attr('fill', 'none')
      .attr('stroke', '#007bff') // Blue
      .attr('stroke-width', 2.5) // Slightly thicker
      .attr('d', netWorthLine);

    // Create legend container below the chart instead of in the corner
    const legendContainer = d3
      .select(element)
      .select('svg')
      .append('g')
      .attr('class', 'legend')
      .attr(
        'transform',
        `translate(${this.width / 2 - 100},${
          this.height + this.margin.top + 10
        })`
      );

    // Add legend items in a horizontal layout
    const legendItems = [
      { color: '#28a745', label: 'Assets' },
      { color: '#dc3545', label: 'Liabilities' },
      { color: '#007bff', label: 'Net Worth' }
    ];

    const legendSpacing = 100; // Space between legend items

    legendItems.forEach((item, index) => {
      const legendItem = legendContainer
        .append('g')
        .attr('transform', `translate(${index * legendSpacing}, 0)`);

      // Add colored line
      legendItem
        .append('line')
        .attr('x1', 0)
        .attr('y1', 10)
        .attr('x2', 20)
        .attr('y2', 10)
        .style('stroke', item.color)
        .style('stroke-width', item.label === 'Net Worth' ? 2.5 : 2);

      // Add text label
      legendItem
        .append('text')
        .attr('x', 25)
        .attr('y', 15)
        .text(item.label)
        .style('font-size', '12px')
        .style('font-family', 'Roboto, "Helvetica Neue", sans-serif');
    });
  }
}
