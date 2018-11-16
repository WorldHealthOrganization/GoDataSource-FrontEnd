import * as _ from 'lodash';

export class TeamFollowupsPerDayModel {
    totalFollowupsCount: number;
    successfulFollowupsCount: number;
    teams: [
        {
            id: string,
            totalFollowupsCount: number,
            successfulFollowupsCount: number,
            dates: [
                {
                    date: string,
                    totalFollowupsCount: number,
                    successfulFollowupsCount: number,
                    contactIDs: string[]
                }
            ]
        }
    ];

    constructor(data = null) {
        this.totalFollowupsCount = _.get(data, 'totalFollowupsCount');
        this.successfulFollowupsCount = _.get(data, 'successfulFollowupsCount');
        this.teams = _.get(data, 'teams', []);
    }
}
