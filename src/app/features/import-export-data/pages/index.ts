// import-data each page component
import { ImportHierarchicalLocationsComponent } from './import-hierarchical-locations/import-hierarchical-locations.component';
import { ImportCaseLabDataComponent } from './import-case-lab-data/import-case-lab-data.component';
import { ImportDataComponent } from '../components/import-data/import-data.component';
import { ImportReferenceDataComponent } from './import-reference-data/import-reference-data.component';
import { ImportCaseDataComponent } from './import-case-data/import-case-data.component';

// export each page component individually
export * from './import-hierarchical-locations/import-hierarchical-locations.component';
export * from './import-case-lab-data/import-case-lab-data.component';
export * from '../components/import-data/import-data.component';
export * from './import-reference-data/import-reference-data.component';
export * from './import-case-data/import-case-data.component';

// export the list of all page components
export const pageComponents: any[] = [
    ImportDataComponent,
    ImportHierarchicalLocationsComponent,
    ImportCaseLabDataComponent,
    ImportReferenceDataComponent,
    ImportCaseDataComponent
];
