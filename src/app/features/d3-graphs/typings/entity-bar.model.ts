import { EntityType } from '../../../core/models/entity-type';

export interface EntityBarModel {
  id: string;
  type: EntityType;
  firstName: string;
  lastName?: string;
  visualId?: string;
  date: string;
  outcomeId: string;
  dateOfOutcome: string;
  safeBurial: boolean;
  dateOfBurial: string;
  addresses?: {
    locationId: string,
    date: string
  }[];
  dateRanges?: {
    typeId: string;
    startDate: string;
    endDate: string;
    locationId: string;
    centerName: string;
  }[];
  centerNames: string[];
  labResults?: {
    dateOfResult: string;
    dateSampleTaken: string;
    testType: string;
    result: string;
  }[];
  firstGraphDate: string;
  lastGraphDate: string;
}
