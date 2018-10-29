import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import 'rxjs/add/operator/mergeMap';
import { TeamModel } from '../../models/team.model';

@Injectable()
export class TeamDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {}

    /**
     * Retrieve the list of Teams
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<TeamModel[]>}
     */
    getTeamsList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<TeamModel[]> {
        const qb = new RequestQueryBuilder();
        // include roles and permissions in response
        qb.include('locations');
        qb.include('members');

        qb.merge(queryBuilder);

        const filter = qb.buildQuery();

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`teams?filter=${filter}`),
            TeamModel
        );
    }

    /**
     * Return total number of teams
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<any>}
     */
    getTeamsCount(
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {

        const whereFilter = queryBuilder.filter.generateCondition(true);

        return this.http.get(`teams/count?where=${whereFilter}`);
    }

    /**
     * Retrieve a Team
     * @param {string} teamId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<TeamModel>}
     */
    getTeam(teamId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<TeamModel> {

        const filter = queryBuilder.buildQuery();

        return this.modelHelper.mapObservableToModel(
            this.http.get(`teams/${teamId}?filter=${filter}`),
            TeamModel
        );
    }

    /**
     * Create a new Team
     * @param team
     * @returns {Observable<any>}
     */
    createTeam(team): Observable<any> {
        return this.http.post('teams', team);
    }

    /**
     * Modify an existing Team
     * @param {string} teamId
     * @param data
     * @returns {Observable<any>}
     */
     modifyTeam(teamId: string, data: any): Observable<any> {
        return this.http.patch(`teams/${teamId}`, data);
    }

    /**
     * Delete an existing Team
     * @param {string} teamId
     * @returns {Observable<any>}
     */
     deleteTeam(teamId: string): Observable<any> {
        return this.http.delete(`teams/${teamId}`);
    }

}
