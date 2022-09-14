import { UntypedFormControl } from '@angular/forms';

export interface GroupDirtyFields {
  getDirtyFields(): {
    [name: string]: UntypedFormControl
  };
}
