// import each component
import { HistogramTransmissionChainsSizeDashletComponent } from './histogram-transmission-chains-size-dashlet/histogram-transmission-chains-size-dashlet.component';
import { EpiCurveDashletComponent } from './epi-curve-dashlet/epi-curve-dashlet.component';
import { CaseSummaryDashletComponent } from './case-summary-dashlet/case-summary-dashlet.component';
import { CasesHospitalizedPieChartDashletComponent } from './cases-hospitalized-pie-chart-dashlet/cases-hospitalized-pie-chart-dashlet.component';
import { CasesByGeographicLocationDashletComponent } from './case-by-geographic-location-dashlet/case-by-geographic-location-dashlet.component';
import { EpiCurveOutcomeDashletComponent } from './epi-curve-outcome-dashlet/epi-curve-outcome-dashlet.component';
import { EpiCurveReportingDashletComponent } from './epi-curve-reporting-dashlet/epi-curve-reporting-dashlet.component';
import { ContactFollowUpOverviewDashletComponent } from './contact-follow-up-overview-dashlet/contact-follow-up-overview-dashlet.component';
import { CasesBasedOnContactStatusDashletComponent } from './cases-based-on-contact-status-dashlet/cases-based-on-contact-status-dashlet.component';
import { C3CombinationStackedBarChartComponent } from './c3-combination-stacked-bar-chart/c3-combination-stacked-bar-chart.component';
import { C3StackedBarChartComponent } from './c3-stacked-bar-chart/c3-stacked-bar-chart.component';
import { DashboardCustomMetricDashletComponent } from './dashboard-custom-metric-dashlet/dashboard-custom-metric-dashlet.component';
import { AppCasesKpiDashletComponent } from './app-cases-kpi-dashlet/app-cases-kpi-dashlet.component';
import { AppKpiDashletComponent } from './app-kpi-dashlet/app-kpi-dashlet.component';
import { AppContactsKpiDashletComponent } from './app-contacts-kpi-dashlet/app-contacts-kpi-dashlet.component';
import { AppCotKpiDashletComponent } from './app-cot-kpi-dashlet/app-cot-kpi-dashlet.component';

// export the list of all page components
export const components: any[] = [
  AppCasesKpiDashletComponent,
  AppContactsKpiDashletComponent,
  AppCotKpiDashletComponent,
  AppKpiDashletComponent,

  HistogramTransmissionChainsSizeDashletComponent,
  EpiCurveDashletComponent,
  EpiCurveOutcomeDashletComponent,
  EpiCurveReportingDashletComponent,
  CaseSummaryDashletComponent,
  CasesHospitalizedPieChartDashletComponent,
  CasesByGeographicLocationDashletComponent,
  ContactFollowUpOverviewDashletComponent,
  CasesBasedOnContactStatusDashletComponent,
  C3StackedBarChartComponent,
  C3CombinationStackedBarChartComponent,
  DashboardCustomMetricDashletComponent
];

