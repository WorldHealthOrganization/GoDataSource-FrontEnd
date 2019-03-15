import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import * as d3 from 'd3';
import * as moment from 'moment';
import { Constants } from '../../../../core/models/constants';
import { TransmissionChainBarsService } from '../../services/transmission-chain-bars.service';

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

    mockData: any = {
        cases: {
            'aaa': {
                visualId: 'CAS-133001',
                dateOfOnset: '2019-02-01',
                isolation: [
                    {date: '2019-02-04'}, {date: '2019-02-05'}, {date: '2019-02-06'}, {date: '2019-02-07'}, {date: '2019-02-08'}, {date: '2019-02-09'},
                ],
                labResults: [
                    {date: '2019-02-10', result: 'G'}
                ],
                firstGraphDate: '2019-02-01',
                lastGraphDate: '2019-02-10',
            },
            'bbb': {
                visualId: 'CAS-133004',
                dateOfOnset: '2019-02-05',
                isolation: [
                    {date: '2019-02-07'}, {date: '2019-02-08'}, {date: '2019-02-09'},
                ],
                labResults: [
                    {date: '2019-02-10', result: 'G'}
                ],
                firstGraphDate: '2019-02-05',
                lastGraphDate: '2019-02-10',
            },
            'ccc': {
                visualId: 'CAS-133005',
                dateOfOnset: '2019-02-06',
                isolation: [
                    {date: '2019-02-09'}, {date: '2019-02-10'}, {date: '2019-02-11'}, {date: '2019-02-12'}, {date: '2019-02-13'},
                ],
                labResults: [
                    {date: '2019-02-14', result: 'M'}
                ],
                firstGraphDate: '2019-02-06',
                lastGraphDate: '2019-02-14',
            },
        },
        relationships: {
            'aaa': ['bbb', 'ccc']
        },
        minDate: '2019-02-01',
        maxDate: '2019-02-14',
    };
    days: string[] = [];

    @ViewChild('chart') chartContainer: ElementRef;

    constructor(
        private transmissionChainBarsService: TransmissionChainBarsService
    ) {
    }

    ngOnInit() {
        this.detectAllDays();

        this.transmissionChainBarsService.drawGraph(this.chartContainer.nativeElement, this.mockData);
    }

    private detectAllDays() {
        const dateMoment = moment(this.mockData.minDate);
        const maxDateMoment = moment(this.mockData.maxDate);

        this.days = [];
        this.mockData.dates = {};
        while (!dateMoment.isAfter(maxDateMoment)) {
            const dayDate = dateMoment.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
            this.mockData.dates[dayDate] = this.days.length;

            this.days.push(dayDate);
            dateMoment.add(1, 'days');
        }
    }
}
