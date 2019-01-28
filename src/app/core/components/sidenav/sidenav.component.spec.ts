import { TestBed, async } from '@angular/core/testing';
import { SidenavComponent } from './sidenav.component';

describe('SidenavComponent', () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                SidenavComponent
            ],
            imports: [],
            providers: []
        })
            .compileComponents();
    }));

    it(`should have My Account menu item`, async(() => {
        const fixture = TestBed.createComponent(SidenavComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app.accountItem).toBeTruthy();
    }));
});
