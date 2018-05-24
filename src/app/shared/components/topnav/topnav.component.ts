import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-topnav',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './topnav.component.html',
    styleUrls: ['./topnav.component.less']
})
export class TopnavComponent {

    // by default, do nothing (stay on the current page)
    @Input() addNewItemRoute = '.';

}
