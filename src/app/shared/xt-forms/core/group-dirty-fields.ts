import { FormControl } from '@angular/forms';

export interface GroupDirtyFields {
    getDirtyFields(): {
        [name: string]: FormControl
    };
}
