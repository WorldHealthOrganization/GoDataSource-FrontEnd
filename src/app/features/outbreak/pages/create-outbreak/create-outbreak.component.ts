import { Component, ViewEncapsulation } from '@angular/core';
import {OutbreakModel} from "../../../../core/models/outbreak.model";
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';

@Component({
    selector: 'app-create-outbreak',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-outbreak.component.html',
    styleUrls: ['./create-outbreak.component.less']
})
export class CreateOutbreakComponent {
    outbreak = {
        name: '',
        description: '',
        disease: '',
        active: ''
    };

    constructor(
        private outbreakDataService: OutbreakDataService
    ) {
    }

    save(){

        this.outbreakDataService
            .create(this.outbreak)
            .subscribe();

            console.log(this.outbreak);


    }


}
