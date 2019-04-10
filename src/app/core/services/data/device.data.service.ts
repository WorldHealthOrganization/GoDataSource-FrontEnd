import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { DeviceModel } from '../../models/device.model';
import { DeviceHistoryModel } from '../../models/device-history.model';

@Injectable()
export class DeviceDataService {
    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {}

    /**
     * Retrieve the list of Devices
     * @returns {Observable<DeviceModel[]>}
     */
    getDevices(
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<DeviceModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`devices?filter=${filter}`),
            DeviceModel
        );
    }

    /**
     * Retrieve a device
     * @param {string} deviceId
     * @returns {Observable<DeviceModel>}
     */
    getDevice(deviceId: string): Observable<DeviceModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`devices/${deviceId}`),
            DeviceModel
        );
    }

    /**
     * Retrieve wipe history
     * @param {string} deviceId
     * @returns {Observable<DeviceHistoryModel>}
     */
    getHistoryDevice(deviceId: string): Observable<DeviceHistoryModel[]> {
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`devices/${deviceId}/history`),
            DeviceHistoryModel
        );
    }

    /**
     * Modify an existing Device
     * @param {string} deviceId
     * @param deviceData
     * @returns {Observable<DeviceModel>}
     */
    modifyDevice(deviceId: string, deviceData): Observable<DeviceModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.put(`devices/${deviceId}`, deviceData),
            DeviceModel
        );
    }

    /**
     * Delete an existing Device
     * @param {string} deviceId
     * @returns {Observable<any>}
     */
    deleteDevice(deviceId: string): Observable<any> {
        return this.http.delete(`devices/${deviceId}`);
    }

    /**
     * Wipe data from an existing Device
     * @param {string} deviceId
     * @returns {Observable<any>}
     */
    wipeDevice(deviceId: string): Observable<any> {
        return this.http.post(`devices/${deviceId}/wipe`, {});
    }

}

