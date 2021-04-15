import { MomentDateAdapter } from '@angular/material-moment-adapter';

export class CustomDateAdapter extends MomentDateAdapter {

    /**
     * Start the calendar with this day of the week
     * 0 = Sunday
     * 1 = Monday
     *
     * return number
     */
    getFirstDayOfWeek(): number {
        return 1;
    }

}
