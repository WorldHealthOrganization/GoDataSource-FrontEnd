/**
 * Model representing a Breadcrumbs item
 */
export class BreadcrumbItemModel {
    constructor(
        public label: string = '',
        public link: string = '.',
        public active: boolean = false,
        public params: {} = {}
    ) {
    }
}
