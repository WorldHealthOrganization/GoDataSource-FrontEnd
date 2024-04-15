import { OutbreakModel } from '../../../models/outbreak.model';
import { IV2ColumnToVisibleMandatoryConf, V2AdvancedFilterToVisibleMandatoryConf } from '../../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { V2AdvancedFilter } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { IV2Column } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';

export class ListHelperModel {
  /**
   * Check if a column should be visible depending on outbreak visible/mandatory settings
   */
  shouldVisibleMandatoryTableColumnBeVisible(
    outbreak: OutbreakModel,
    visibleMandatoryKey: string,
    prop: string
  ): boolean {
    // no custom settings found ?
    if (
      !outbreak ||
      !outbreak.visibleAndMandatoryFields ||
      !outbreak.visibleAndMandatoryFields[visibleMandatoryKey] ||
      outbreak.visibleAndMandatoryFields[visibleMandatoryKey][prop]?.visible ||
      Object.keys(outbreak.visibleAndMandatoryFields[visibleMandatoryKey]).length < 1
    ) {
      return true;
    }

    // matched
    return false;
  }

  /**
   * Filter advanced filters depending on outbreak visible/mandatory settings
   */
  filterVisibleMandatoryAdvancedFilters(advancedFilters: V2AdvancedFilterToVisibleMandatoryConf[]): V2AdvancedFilter[] {
    return (advancedFilters || []).filter((filter) => {
      return filter.visibleMandatoryIf();
    });
  }

  /**
   * Filter table columns depending on outbreak visible/mandatory settings
   */
  filterVisibleMandatoryTableColumns<T extends (IV2Column | IV2ColumnToVisibleMandatoryConf)>(items: IV2ColumnToVisibleMandatoryConf[]): T[] {
    return (items || []).filter((column) => column.visibleMandatoryIf ?
      column.visibleMandatoryIf() :
      true
    ) as T[];
  }
}
