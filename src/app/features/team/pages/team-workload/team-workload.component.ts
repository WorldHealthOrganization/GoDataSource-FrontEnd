import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { TeamFollowupsPerDayModel } from '../../../../core/models/team-followups-per-day.model';
import { Constants } from '../../../../core/models/constants';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { TeamModel } from '../../../../core/models/team.model';
import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
    selector: 'app-team-workload',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './team-workload.component.html',
    styleUrls: ['./team-workload.component.less']
})
export class TeamWorkloadComponent extends ListComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_TEAMS_TITLE',
            '/teams'
        ),
        new BreadcrumbItemModel(
            'LNG_PAGE_TEAMS_WORKLOAD_TITLE',
            '.',
            true
        )
    ];

    selectedOutbreak: OutbreakModel;
    metricTeamsFollowups: TeamFollowupsPerDayModel;
    dates: string[] = [];
    teams: TeamModel[];
    teamsMap: any = [];
    selectedTeamsIds: string[] = [];

    constructor(
        private outbreakDataService: OutbreakDataService,
        private followUpsDataService: FollowUpsDataService,
        protected snackbarService: SnackbarService,
        private genericDataService: GenericDataService,
        private i18nService: I18nService,
        private teamDataService: TeamDataService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // subscribe to the Selected Outbreak
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // selected outbreak
                this.selectedOutbreak = selectedOutbreak;
                // get teams
                this.teamDataService
                    .getTeamsList()
                    .subscribe((teams) => {
                        this.teams = teams;
                        _.forEach(this.teams, (team) => {
                            const teamObj: any = {name: team.name, dates: []};
                            this.teamsMap[team.id] = teamObj;
                        });
                        this.formatData();

                        // ...and re-load the list
                        this.needsRefreshList(true);
                    });
            });
    }

    /**
     * Refresh list
     */
    refreshList() {
        if (this.selectedOutbreak) {
            this.genericDataService
                .getServerUTCToday()
                .subscribe((currentDate) => {
                    this.dates = [];
                    const outbreakPeriod = this.selectedOutbreak.periodOfFollowup;
                    this.dates.push(this.i18nService.instant('LNG_PAGE_TEAMS_WORKLOAD_TEAM_LABEL'));
                    currentDate.subtract(1, 'days');
                    this.dates.push(currentDate.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT));
                    for (let i = 1; i <= outbreakPeriod; i++) {
                        this.dates.push(currentDate.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT));
                        currentDate.add(1, 'days');
                    }
                    if (this.dates) {
                        // get first and last dates
                        const firstDate = this.dates[1];
                        const lastDate = _.last(this.dates);
                        // retrieve the list of Follow Ups
                        this.followUpsDataService
                            .getFollowUpsPerDayTeam(this.selectedOutbreak.id, firstDate, lastDate, this.queryBuilder)
                            .subscribe((metricTeamsFollowups: TeamFollowupsPerDayModel) => {
                                this.metricTeamsFollowups = metricTeamsFollowups;
                                this.formatData();
                            });
                    }
                });
        }
    }

    /**
     * format the data
     */
    formatData() {
        // get data
        if (this.metricTeamsFollowups) {
            const teams = this.metricTeamsFollowups.teams;
            if (teams) {
                this.selectedTeamsIds = [];
                _.forEach(teams, (team) => {
                    if (team.id) {
                        this.selectedTeamsIds.push(team.id);
                        const dates = [];
                        if (team.dates) {
                            _.forEach(team.dates, (date) => {
                                const dateObj: any = {};
                                const formattedDate = moment(date.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
                                dateObj.totalFollowupsCount = date.totalFollowupsCount;
                                dateObj.successfulFollowupsCount = date.successfulFollowupsCount;
                                dates[formattedDate] = (dateObj);
                            });
                        }
                        if (this.teamsMap[team.id]) {
                            this.teamsMap[team.id].dates = dates;
                        }
                    }
                });
            }
        }
    }

    /**
     * Return value to display in the table
     * @param {string} teamId
     * @param {string} date
     * @param {number} d
     * @returns {string}
     */
    getTotalFollowupsCount(teamId: string, date: string, d: number) {
        let result = this.i18nService.instant('LNG_PAGE_TEAMS_WORKLOAD_TABLE_OF_LABEL', {done: '0', total: '0'});
        // first column - show team name
        if (d === 0) {
            if (this.teamsMap[teamId]) {
                result = this.teamsMap[teamId].name;
            }
        } else {
            if (this.teamsMap[teamId]) {
                if (this.teamsMap[teamId].dates[date]) {
                    const total = this.teamsMap[teamId].dates[date].totalFollowupsCount;
                    const successful = this.teamsMap[teamId].dates[date].successfulFollowupsCount;
                    result = this.i18nService.instant('LNG_PAGE_TEAMS_WORKLOAD_TABLE_OF_LABEL', {done: successful, total: total});
                }
            }
        }
        return result;
    }
}
