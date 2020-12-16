export class FileSize {
    /**
     * Convert size to readable format
     */
    static bytesToReadableForm(sizeBytes: number): string {
        // nothing to format ?
        if (!sizeBytes) {
            return '';
        }

        // format
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(sizeBytes) / Math.log(k));
        const formattedValue: string = parseFloat((sizeBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];

        // return response
        return formattedValue;
    }
}
