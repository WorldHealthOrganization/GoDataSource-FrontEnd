// import-data each page component
import { ImportHierarchicalLocationsComponent } from './import-hierarchical-locations/import-hierarchical-locations.component';
import { ImportCaseLabDataComponent } from './import-case-lab-data/import-case-lab-data.component';
import { ImportDataComponent } from '../components/import-data/import-data.component';

// export each page component individually
export * from './import-hierarchical-locations/import-hierarchical-locations.component';
export * from './import-case-lab-data/import-case-lab-data.component';
export * from '../components/import-data/import-data.component';

// export the list of all page components
export const pageComponents: any[] = [
    ImportDataComponent,
    ImportHierarchicalLocationsComponent,
    ImportCaseLabDataComponent
];
