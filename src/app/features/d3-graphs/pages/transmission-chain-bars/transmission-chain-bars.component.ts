import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { TransmissionChainBarsService } from '../../services/transmission-chain-bars.service';
import { LoadingDialogModel } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ImportExportDataService } from '../../../../core/services/data/import-export.data.service';
import * as domtoimage from 'dom-to-image';
import * as FileSaver from 'file-saver';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { TransmissionChainBarsDataService } from '../../services/transmission-chain-bars.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Subscription } from 'rxjs/Subscription';
import { RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';

@Component({
    selector: 'app-transmission-chain-bars',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chain-bars.component.html',
    styleUrls: ['./transmission-chain-bars.component.less']
})
export class TransmissionChainBarsComponent implements OnInit, OnDestroy {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_TRANSMISSION_CHAIN_BARS_TITLE', null, true)
    ];

    // selected Outbreak
    selectedOutbreak: OutbreakModel;
    outbreakSubscriber: Subscription;
    // query builder for fetching data
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder();
    // loading indicator
    loadingDialog: LoadingDialogModel;

    @ViewChild('chart') chartContainer: ElementRef;

    constructor(
        private transmissionChainBarsService: TransmissionChainBarsService,
        private transmissionChainBarsDataService: TransmissionChainBarsDataService,
        private outbreakDataService: OutbreakDataService,
        private dialogService: DialogService,
        private importExportDataService: ImportExportDataService,
        private i18nService: I18nService,
    ) {
    }

    ngOnInit() {
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                this.loadGraph();
            });
    }

    ngOnDestroy() {
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    loadGraph() {
        if (!this.selectedOutbreak) {
            return;
        }

        this.queryBuilder.sort.by('dateOfOnset', RequestSortDirection.ASC);

        this.transmissionChainBarsDataService.getTransmissionChainBarsData(this.selectedOutbreak.id, this.queryBuilder)
            .subscribe((graphData) => {
                this.transmissionChainBarsService.drawGraph(this.chartContainer.nativeElement, graphData);
            });
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
