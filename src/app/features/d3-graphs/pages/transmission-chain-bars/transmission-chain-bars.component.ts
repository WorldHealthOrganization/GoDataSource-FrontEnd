import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import * as d3 from 'd3';
import * as moment from 'moment';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-transmission-chain-bars',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chain-bars.component.html',
    styleUrls: ['./transmission-chain-bars.component.less']
})
export class TransmissionChainBarsComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_TRANSMISSION_CHAIN_BARS_TITLE', null, true)
    ];

    mockData = {
        cases: [
            {
                visualId: '1301',
                dateOfOnset: '2019-02-01',
                isolation: [
                    {date: '2019-02-04'}, {date: '2019-02-05'}, {date: '2019-02-06'}, {date: '2019-02-07'}, {date: '2019-02-08'}, {date: '2019-02-09'},
                ],
                labResult: 'G'
            },
            {
                visualId: '1304',
                dateOfOnset: '2019-02-05',
                isolation: [
                    {date: '2019-02-07'}, {date: '2019-02-08'}, {date: '2019-02-09'},
                ],
                labResult: 'G'
            },
            {
                visualId: '1305',
                dateOfOnset: '2019-02-06',
                isolation: [
                    {date: '2019-02-09'}, {date: '2019-02-10'}, {date: '2019-02-11'}, {date: '2019-02-12'}, {date: '2019-02-13'},
                ],
                labResult: 'M'
            },
        ],
        minDate: '2018-02-01',
        maxDate: '2018-02-14',
    };
    days: string[] = [];

    @ViewChild('chart') chartContainer: ElementRef;

    ngOnInit() {
        this.detectAllDays();

        // this.initializeChart();
    }

    onResize() {
        this.initializeChart();
    }

    private initializeChart() {
        // #TODO determine min and max values

        const canvas = d3
            .select(this.chartContainer.nativeElement);

        const element = this.chartContainer.nativeElement;

        const svg = d3.select(element).append('svg')
            .attr('width', element.offsetWidth)
            .attr('height', element.offsetHeight);

        const x = d3
            .scaleBand()
            .rangeRound([0, element.offsetWidth])
            .padding(0.1)
            .domain(['x', 'y', 'z']);
        const y = d3
            .scaleLinear()
            .rangeRound([element.offsetHeight, 0])
            .domain([0, 7]);

        const g = svg.append('g');

        g.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', 'translate(0,' + element.offsetHeight + ')')
            .call(d3.axisBottom(x));

        g.append('g')
            .attr('class', 'axis axis--y')
            .call(d3.axisLeft(y).ticks(10, '%'))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '0.71em')
            .attr('text-anchor', 'end')
            .text('Frequency');

        g.selectAll('.bar')
            .data([{text: 'x', val: 1}, {text: 'y', val: 4}, {text: 'z', val: 7}])
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.text))
            .attr('y', d => y(d.val))
            .attr('width', x.bandwidth())
            .attr('height', d => element.offsetWidth - y(d.val));
    }

    private detectAllDays() {
        const dateMoment = moment(this.mockData.minDate);
        const maxDateMoment = moment(this.mockData.maxDate);

        this.days = [];
        while (!dateMoment.isAfter(maxDateMoment)) {
            this.days.push(dateMoment.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT));
            dateMoment.add(1, 'days');
        }
    }
}
