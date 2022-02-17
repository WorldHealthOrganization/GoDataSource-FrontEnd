import * as _ from 'lodash';

export class UserFollowupsPerDayModel {
  totalFollowupsCount: number;
  successfulFollowupsCount: number;
  users: [
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
    this.users = _.get(data, 'users', []);
  }
}
