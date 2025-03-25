import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import * as d3 from 'd3';
import {
  FormattedDataService,
  FormattedEntry
} from '../../core/services/formatted-data.service';

interface FinancialData {
  date: Date;
  assetsTotal: number;
  liabilitiesTotal: number;
  netWorth: number;
}

@Component({
  selector: 'app-chart',
  imports: [CommonModule, MatButtonModule],
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartContainer') private chartContainer!: ElementRef;

  entries: FormattedEntry[] = [];
  financialData: FinancialData[] = [];
  filteredData: FinancialData[] = [];
  selectedTimeFrame = 'all';

  private svg: any;
  private margin = { top: 20, right: 30, bottom: 50, left: 100 };
  private width = 960;
  private height = 500;

  constructor(private formattedDataService: FormattedDataService) {}

  async ngAfterViewInit(): Promise<void> {
    this.entries = await this.formattedDataService.getFormattedEntries();
    this.financialData = this.getFinancialData();
    this.filteredData = [...this.financialData];
    this.createChart();

    window.addEventListener('resize', () => this.handleResize());
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', () => this.handleResize());
  }

  handleResize(): void {
    this.createChart();
  }

  getFinancialData(): FinancialData[] {
    const financialData: FinancialData[] = [];

    for (const entry of this.entries) {
      let assetsTotal = 0;
      let liabilitiesTotal = 0;
      let netWorth = 0;

      for (const account of entry.accounts) {
        if (account.category?.type === 'Asset') {
          assetsTotal += account.balance;
        } else if (account.category?.type === 'Liability') {
          liabilitiesTotal += account.balance;
        }
      }

      netWorth = assetsTotal - liabilitiesTotal;

      financialData.push({
        date: new Date(entry.date),
        assetsTotal,
        liabilitiesTotal,
        netWorth
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
      case '1w':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case '1m':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '6m':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1); // Jan 1 of current year
        break;
      case '1y':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case '5y':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 5);
        break;
      case 'all':
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

    // Set dynamic width based on container
    const containerWidth = this.chartContainer.nativeElement.offsetWidth;
    this.width = containerWidth - this.margin.left - this.margin.right;

    // Clear any existing SVG
    d3.select(this.chartContainer.nativeElement).selectAll('*').remove();

    // Create SVG
    this.svg = d3
      .select(this.chartContainer.nativeElement)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    this.updateChart();
  }

  updateChart(): void {
    if (!this.svg || this.filteredData.length === 0) return;

    // Clear existing chart elements
    this.svg.selectAll('.line').remove();
    this.svg.selectAll('.axis').remove();
    this.svg.selectAll('.grid').remove();
    this.svg.selectAll('.axis-label').remove();

    // X scale
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

    // Add X axis
    this.svg
      .append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${this.height})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickFormat((domainValue: Date | d3.NumberValue) =>
            d3.timeFormat('%b %Y')(
              domainValue instanceof Date
                ? domainValue
                : new Date(domainValue.valueOf())
            )
          )
      );

    // Add Y axis
    this.svg
      .append('g')
      .attr('class', 'axis y-axis')
      .call(
        d3.axisLeft(y).tickFormat((d: any) => {
          // Format currency values
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(d);
        })
      );

    // Add horizontal grid lines
    this.svg
      .append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .tickSize(-this.width)
          .tickFormat('' as any)
      );

    // Define line generators
    const createLine = (accessor: (d: FinancialData) => number) => {
      return d3
        .line<FinancialData>()
        .x((d) => x(d.date))
        .y((d) => y(accessor(d)))
        .curve(d3.curveMonotoneX);
    };

    // Draw assets line
    this.svg
      .append('path')
      .datum(this.filteredData)
      .attr('stroke', 'var(--mat-sys-tertiary)')
      .attr('stroke-width', 2)
      .attr(
        'd',
        createLine((d) => d.assetsTotal)
      );

    // Draw liabilities line
    this.svg
      .append('path')
      .datum(this.filteredData)
      .attr('stroke', 'var(--mat-sys-error)')
      .attr('stroke-width', 2)
      .attr(
        'd',
        createLine((d) => d.liabilitiesTotal)
      );

    // Draw net worth line
    this.svg
      .append('path')
      .datum(this.filteredData)
      .attr('stroke', 'var(--mat-sys-primary)')
      .attr('stroke-width', 3)
      .attr(
        'd',
        createLine((d) => d.netWorth)
      );

    // Add X axis label
    this.svg
      .append('text')
      .attr('x', this.width / 2)
      .attr('y', this.height + this.margin.top + 20)
      .style('text-anchor', 'middle')
      .style('fill', 'var(--mat-sys-on-surface-variant)')
      .text('Date');

    // Add Y axis label
    this.svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 10 - this.margin.left)
      .attr('x', -this.height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', 'var(--mat-sys-on-surface-variant)')
      .text('Balance ($)');
  }
}
