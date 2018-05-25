import { Component, Input, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../core/models/outbreak.model';

@Component({
    selector: 'app-topnav',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './topnav.component.html',
    styleUrls: ['./topnav.component.less']
})
export class TopnavComponent {

    // by default, do nothing (stay on the current page)
    @Input() addNewItemRoute = '.';

    // the Active Outbreak
    activeOutbreak: OutbreakModel = new OutbreakModel();

    constructor(
        private outbreakDataService: OutbreakDataService
    ) {
        // get the active outbreak
    }

}
