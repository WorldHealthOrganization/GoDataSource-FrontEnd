import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AuthDataService } from '../../services/data/auth.data.service';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-form-debug',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './app-form-debug.component.html',
    styleUrls: ['./app-form-debug.component.less']
})
export class AppFormDebugComponent implements OnInit, OnDestroy {
    // expire time
    approximatedExpireInSeconds: number = -1;

    // used to keep subscription and release it if we don't need it anymore
    tokenInfoSubjectSubscription: Subscription;

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit(): void {
        // subscribe to token estimated time
        this.tokenInfoSubjectSubscription = this.authDataService
            .getTokenInfoSubject()
            .subscribe((tokenInfo) => {
                if (tokenInfo) {
                    this.approximatedExpireInSeconds = tokenInfo.approximatedExpireInSeconds;
                }
            });
    }

    /**
     * Component destroyed
     */
    ngOnDestroy(): void {
        // release token info subscription
        if (this.tokenInfoSubjectSubscription) {
            this.tokenInfoSubjectSubscription.unsubscribe();
            this.tokenInfoSubjectSubscription = null;
        }
    }
}
