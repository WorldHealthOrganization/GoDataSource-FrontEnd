import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Constants } from '../../../../core/models/constants';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ActivatedRoute } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';
import { CytoscapeGraphComponent } from '../../../../shared/components/cytoscape-graph/cytoscape-graph.component';
import { TransmissionChainsDashletComponent } from '../../components/transmission-chains-dashlet/transmission-chains-dashlet.component';
import { ImportExportDataService } from '../../../../core/services/data/import-export.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
    selector: 'app-transmission-chains-graph',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chains-graph.component.html',
    styleUrls: ['./transmission-chains-graph.component.less']
})
export class TransmissionChainsGraphComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_TITLE', null, true)
    ];

    @ViewChild(TransmissionChainsDashletComponent) cotDashletChild;

    // used for export
    @ViewChild('buttonDownloadFile') private buttonDownloadFile: ElementRef;


    // provide constants to template
    Constants = Constants;

    // authenticated user
    authUser: UserModel;
    // filter used for size of chains
    sizeOfChainsFilter: number = null;
    // person Id - to filter the chain
    personId: string = null;
    // type of the selected person . event
    selectedEntityType: EntityType = null;

    constructor(
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        protected route: ActivatedRoute,
        private importExportDataService: ImportExportDataService,
        private i18nService: I18nService
    ) {}

    ngOnInit() {
        // get authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.route.queryParams
            .subscribe((params: {personId: string, selectedEntityType: EntityType, sizeOfChainsFilter: number}) => {
                // check if person id was sent in url
                if (params.personId && params.selectedEntityType) {
                    this.personId = params.personId;
                    this.selectedEntityType = params.selectedEntityType;
                }
                // check if the size of chains was sent in url
                if (params.sizeOfChainsFilter) {
                    this.sizeOfChainsFilter = params.sizeOfChainsFilter;
                }
            });
    }

    /**
     * Check if the user has read access to cases
     * @returns {boolean}
     */
    hasReadCasePermissions(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_CASE);
    }

    /**
     * Check if the user has read report permission
     * @returns {boolean}
     */
    hasReadReportPermissions(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_REPORT);
    }

    exportChainsOfTransmission() {

        const pngBase64 = this.cotDashletChild.getPng64().replace('data:image/png;base64,', '');

        this.importExportDataService.exportImageToPdf({image: pngBase64, responseType: 'blob', splitFactor: 1})
            .subscribe((blob) => {
                const urlT = window.URL.createObjectURL(blob);
                const link = this.buttonDownloadFile.nativeElement;
                const fileName = this.i18nService.instant('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_TITLE');

                link.href = urlT;
                link.download = `${fileName}.pdf`;
                link.click();

                window.URL.revokeObjectURL(urlT);
            });
    }
}
