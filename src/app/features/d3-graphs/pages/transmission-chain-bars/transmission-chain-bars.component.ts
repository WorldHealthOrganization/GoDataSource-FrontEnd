import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import * as moment from 'moment';
import { Constants } from '../../../../core/models/constants';
import { TransmissionChainBarsService } from '../../services/transmission-chain-bars.service';
import { LoadingDialogModel } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ImportExportDataService } from '../../../../core/services/data/import-export.data.service';
import * as domtoimage from 'dom-to-image';
import * as FileSaver from 'file-saver';
import { I18nService } from '../../../../core/services/helper/i18n.service';

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

    loadingDialog: LoadingDialogModel;


    mockData: any = {
        cases: {
            'aaa': {
                id: 'aaa',
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
                id: 'bbb',
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
                id: 'ccc',
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
            'ddd': {
                id: 'ddd',
                visualId: 'CAS-133006',
                dateOfOnset: '2019-02-07',
                isolation: [
                    {date: '2019-02-09'}, {date: '2019-02-10'}, {date: '2019-02-11'}, {date: '2019-02-12'}, {date: '2019-02-13'},
                ],
                labResults: [
                    {date: '2019-02-14', result: 'M'}
                ],
                firstGraphDate: '2019-02-07',
                lastGraphDate: '2019-02-14',
            },
            'eee': {
                id: 'eee',
                visualId: 'CAS-133007',
                dateOfOnset: '2019-02-08',
                isolation: [
                    {date: '2019-02-11'}, {date: '2019-02-12'}, {date: '2019-02-13'}, {date: '2019-02-14'}, {date: '2019-02-15'},
                ],
                labResults: [
                    {date: '2019-02-16', result: 'M'}
                ],
                firstGraphDate: '2019-02-08',
                lastGraphDate: '2019-02-16',
            },
            'fff': {
                id: 'fff',
                visualId: 'CAS-134008',
                dateOfOnset: '2019-01-27',
                isolation: [
                    {date: '2019-01-30'}, {date: '2019-01-31'}, {date: '2019-02-01'}, {date: '2019-02-02'}, {date: '2019-02-03'}, {date: '2019-02-04'}, {date: '2019-02-05'}, {date: '2019-02-06'},
                ],
                labResults: [
                    {date: '2019-02-09', result: 'G'}
                ],
                firstGraphDate: '2019-01-27',
                lastGraphDate: '2019-02-09',
            },
            'ggg': {
                id: 'ggg',
                visualId: 'CAS-134009',
                dateOfOnset: '2019-01-30',
                isolation: [
                    {date: '2019-02-02'}, {date: '2019-02-03'}, {date: '2019-02-04'}, {date: '2019-02-05'},
                ],
                labResults: [
                    {date: '2019-02-06', result: 'G'}
                ],
                firstGraphDate: '2019-01-30',
                lastGraphDate: '2019-02-06',
            },
            'hhh': {
                id: 'hhh',
                visualId: 'CAS-134009',
                dateOfOnset: '2019-01-30',
                isolation: [
                    {date: '2019-02-02'}, {date: '2019-02-03'}, {date: '2019-02-04'}, {date: '2019-02-05'},
                ],
                labResults: [
                    {date: '2019-02-06', result: 'G'}
                ],
                firstGraphDate: '2019-01-30',
                lastGraphDate: '2019-02-06',
            },
            'iii': {
                id: 'iii',
                visualId: 'CAS-134009',
                dateOfOnset: '2019-01-30',
                isolation: [
                    {date: '2019-02-02'}, {date: '2019-02-03'}, {date: '2019-02-04'}, {date: '2019-02-05'},
                ],
                labResults: [
                    {date: '2019-02-06', result: 'G'}
                ],
                firstGraphDate: '2019-01-30',
                lastGraphDate: '2019-02-06',
            },
            'jjj': {
                id: 'jjj',
                visualId: 'CAS-134009',
                dateOfOnset: '2019-01-30',
                isolation: [
                    {date: '2019-02-02'}, {date: '2019-02-03'}, {date: '2019-02-04'}, {date: '2019-02-05'},
                ],
                labResults: [
                    {date: '2019-02-06', result: 'G'}
                ],
                firstGraphDate: '2019-01-30',
                lastGraphDate: '2019-02-06',
            },
            'kkk': {
                id: 'kkk',
                visualId: 'CAS-134009',
                dateOfOnset: '2019-01-30',
                isolation: [
                    {date: '2019-02-02'}, {date: '2019-02-03'}, {date: '2019-02-04'}, {date: '2019-02-05'},
                ],
                labResults: [
                    {date: '2019-02-06', result: 'G'}
                ],
                firstGraphDate: '2019-01-30',
                lastGraphDate: '2019-02-06',
            },
            'lll': {
                id: 'lll',
                visualId: 'CAS-134009',
                dateOfOnset: '2019-01-30',
                isolation: [
                    {date: '2019-02-02'}, {date: '2019-02-03'}, {date: '2019-02-04'}, {date: '2019-02-05'},
                ],
                labResults: [
                    {date: '2019-02-06', result: 'G'}
                ],
                firstGraphDate: '2019-01-30',
                lastGraphDate: '2019-02-06',
            },
            'mmm': {
                id: 'mmm',
                visualId: 'CAS-134009',
                dateOfOnset: '2019-01-30',
                isolation: [
                    {date: '2019-02-02'}, {date: '2019-02-03'}, {date: '2019-02-04'}, {date: '2019-02-05'},
                ],
                labResults: [
                    {date: '2019-02-06', result: 'G'}
                ],
                firstGraphDate: '2019-01-30',
                lastGraphDate: '2019-02-06',
            },
            'nnn': {
                id: 'nnn',
                visualId: 'CAS-134099',
                dateOfOnset: '2019-01-31',
                isolation: [
                    {date: '2019-02-02'}, {date: '2019-02-03'}, {date: '2019-02-04'}, {date: '2019-02-05'},
                ],
                labResults: [
                    {date: '2019-02-06', result: 'G'}
                ],
                firstGraphDate: '2019-01-31',
                lastGraphDate: '2019-02-06',
            },
        },
        relationships: {
            'aaa': ['bbb', 'ccc'],
            'ccc': ['ddd', 'eee'],
            'fff': ['aaa', 'bbb', 'ggg']
        },
        minDate: '2019-01-27',
        maxDate: '2019-02-16',
    };
    days: string[] = [];

    @ViewChild('chart') chartContainer: ElementRef;

    constructor(
        private transmissionChainBarsService: TransmissionChainBarsService,
        private dialogService: DialogService,
        private importExportDataService: ImportExportDataService,
        private i18nService: I18nService,
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

    /**
     * Display loading dialog
     */
    private showLoadingDialog() {
        this.loadingDialog = this.dialogService.showLoadingDialog();
    }

    /**
     * Hide loading dialog
     */
    private closeLoadingDialog() {
        if (this.loadingDialog) {
            this.loadingDialog.close();
            this.loadingDialog = null;
        }
    }

    /**
     * Print chain
     */
    exportChain() {
        this.showLoadingDialog();

        domtoimage.toPng(this.chartContainer.nativeElement)
            .then((dataUrl) => {
                const dataBase64 = dataUrl.replace('data:image/png;base64,', '');

                this.importExportDataService.exportImageToPdf({image: dataBase64, responseType: 'blob', splitFactor: 1})
                    .subscribe((blob) => {
                        const fileName = this.i18nService.instant('LNG_PAGE_TRANSMISSION_CHAIN_BARS_TITLE');
                        FileSaver.saveAs(
                            blob,
                            `${fileName}.pdf`
                        );
                        this.closeLoadingDialog();
                    });
            });
    }
}
