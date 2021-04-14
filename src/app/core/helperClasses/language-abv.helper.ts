export class LanguageAbvHelper {

    /**
     * get the appropriate language abbreviation that DateAdapter uses
     * @param language
     */
    public static getLocale(language: string): string {
        const abv = language.slice(-2);
        return abv + '-' + abv.toUpperCase();
    }
}
