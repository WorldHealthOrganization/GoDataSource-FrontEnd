import { commandFunction, NgxWigComponent, TButton } from 'ngx-wig';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswer, DialogAnswerButton, DialogConfiguration, DialogField, DialogFieldType } from '../../dialog/dialog.component.js';
import { Observable } from 'rxjs/internal/Observable';
import { of } from 'rxjs/internal/observable/of';
import { Inject, Renderer2 } from '@angular/core';
import * as _ from 'lodash';
import { LabelValuePair } from '../../../../core/models/label-value-pair';

/**
 * Image data
 */
interface INgxWigImgData {
    imgUrl: string;
    imgWidth?: number;
    imgWidthType?: string;
    imgHeight?: number;
    imgHeightType?: string;
    imgTitle?: string;
    imgAlt?: string;
}

/**
 * Link data
 */
interface INgxWigLinkData {
    linkUrl: string;
    linkText: string;
    linkTarget: string;
}

export class TButtonExtended implements TButton {
    // TButton properties
    label: string;
    icon: string;
    title: string;
    command: string | commandFunction;
    styleClass: string;

    // other properties
    id: string;

    /**
     * Refresh translation
     */
    static refreshTranslation(button: TButtonExtended) {
        // determine parent button
        const originalButton: TButtonExtended = _.find(
            NgxWigCustomLibraryButtons.defaultButtonsConf, {
                id: button.id
            }
        );

        // translate
        button.label = originalButton.label ?
            NgxWigCustomLibraryButtons.i18nService.instant(originalButton.label) :
            originalButton.label;
        button.title = originalButton.title ?
            NgxWigCustomLibraryButtons.i18nService.instant(originalButton.title) :
            originalButton.title;
    }

    // extra params
    constructor(data?: {
        id: string,
        label?: string,
        icon?: string,
        title?: string,
        command?: string | commandFunction,
        styleClass?: string
    }) {
        // assign properties
        Object.assign(
            this,
            data
        );
    }

    /**
     * Refresh translation
     */
    public refreshTranslation() {
        TButtonExtended.refreshTranslation(this);
    }
}

/**
 * Handles custom buttons for our wysiwyg
 * @param i18nService
 */
export class NgxWigCustomLibraryButtons {
    // constants
    static readonly SELECTION_RANGE_PATH = 'ngxWigEditable.nativeElement.selectionRange';

    /**
     * Keep an instance of the services to access them from static methods
     */
    static i18nService: I18nService;
    static dialogService: DialogService;
    static renderer2: Renderer2;

    /**
     * Image width / height unit types
     */
    static readonly unitTypes: LabelValuePair[] = [
        new LabelValuePair(
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_WIDTH_TYPE_PX',
            'px'
        ),
        new LabelValuePair(
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_WIDTH_TYPE_PERCENT',
            '%'
        )
    ];

    /**
     * Link target types
     */
    static readonly targetTypes: LabelValuePair[] = [
        new LabelValuePair(
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_TARGET_TYPE_BLANK',
            '_blank'
        ),
        new LabelValuePair(
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_TARGET_TYPE_SELF',
            '_self'
        ),
        new LabelValuePair(
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_TARGET_TYPE_PARENT',
            '_parent'
        ),
        new LabelValuePair(
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_TARGET_TYPE_TOP',
            '_top'
        )
    ];

    /**
     * Default buttons setup
     */
    static readonly defaultButtonsConf: {
        [idButton: string]: TButtonExtended
    } = {
        _: new TButtonExtended({
            id: '_',
            label: ' ',
            title: '',
            styleClass: '',
            command: () => {}
        }),
        list1: new TButtonExtended({
            id: 'list1',
            label: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_UNORDERED_LIST',
            title: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_TITLE_UNORDERED_LIST',
            command: (ctx: NgxWigComponent) => {
                ctx.execCommand(
                    'insertunorderedlist',
                    ''
                );
            },
            styleClass: 'list-ul',
            icon: 'icon-list-ul'
        }),
        list2: new TButtonExtended({
            id: 'list2',
            label: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_ORDERED_LIST',
            title: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_TITLE_ORDERED_LIST',
            command: (ctx: NgxWigComponent) => {
                ctx.execCommand(
                    'insertorderedlist',
                    ''
                );
            },
            styleClass: 'list-ol',
            icon: 'icon-list-ol'
        }),
        bold: new TButtonExtended({
            id: 'bold',
            label: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_BOLD',
            title: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_TITLE_BOLD',
            command: (ctx: NgxWigComponent) => {
                ctx.execCommand(
                    'bold',
                    ''
                );
            },
            styleClass: 'bold',
            icon: 'icon-bold'
        }),
        italic: new TButtonExtended({
            id: 'italic',
            label: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_ITALIC',
            title: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_TITLE_ITALIC',
            command: (ctx: NgxWigComponent) => {
                ctx.execCommand(
                    'italic',
                    ''
                );
            },
            styleClass: 'italic',
            icon: 'icon-italic'
        }),
        underline: new TButtonExtended({
            id: 'underline',
            label: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_UNDERLINE',
            title: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_TITLE_UNDERLINE',
            command: (ctx: NgxWigComponent) => {
                ctx.execCommand(
                    'underline',
                    ''
                );
            },
            styleClass: 'format-underlined',
            icon: 'icon-underline'
        }),
        linkCustom: new TButtonExtended({
            id: 'linkCustom',
            label: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK',
            title: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_TITLE_LINK',
            styleClass: 'link',
            icon: 'icon-link',
            command: (ctx: NgxWigComponent) => {
                // display add image dialog
                NgxWigCustomLibraryButtons.displayLinkDialog(
                    ctx
                );
            }
        }),
        insertImageCustom: new TButtonExtended({
            id: 'insertImageCustom',
            label: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE',
            title: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_TITLE_INSERT_IMAGE',
            styleClass: 'file-image',
            command: (ctx: NgxWigComponent) => {
                // display add image dialog
                NgxWigCustomLibraryButtons.displayImageDialog(
                    ctx
                );
            }
        })
    };

    /**
     * List of buttons
     */
    public list1: TButtonExtended;
    public list2: TButtonExtended;
    public bold: TButtonExtended;
    public italic: TButtonExtended;
    public underline: TButtonExtended;
    public linkCustom: TButtonExtended;
    public insertImageCustom: TButtonExtended;

    /**
     * Display image create / update dialog
     * @param ctx
     * @param element
     */
    static displayImageDialog(
        ctx: NgxWigComponent,
        element?: any
    ) {
        // determine width & height of element
        let widthValue: number;
        let widthUnit: string = 'px';
        let heightValue: number;
        let heightUnit: string = 'px';
        if (element) {
            // width
            let width = element.getAttribute('width');
            if (width) {
                width = /^[0-9\.]+/.exec(width);
                widthUnit = width.input.substr(width[0].length);
                widthValue = parseFloat(width[0]);
            }

            // height
            let height = element.getAttribute('height');
            if (height) {
                height = /^[0-9\.]+/.exec(height);
                heightUnit = height.input.substr(height[0].length);
                heightValue = parseFloat(height[0]);
            }
        }

        // display insert / modify image dialog
        NgxWigCustomLibraryButtons.dialogService
            .showInput(
                new DialogConfiguration({
                    message: element ? 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_MODIFY' : 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_ADD',
                    yesLabel: element ? 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_MODIFY_BUTTON' : 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_ADD_BUTTON',
                    fieldsListLayout: [
                        100,
                        30, 20, 30, 20,
                        100,
                        100
                    ],
                    fieldsList: [
                        // url
                        new DialogField({
                            name: 'imgUrl',
                            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_URL',
                            description: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_URL_DESCRIPTION',
                            required: true,
                            value: element ? element.src : 'http://',
                            fieldType: DialogFieldType.URL,
                            urlAsyncValidator: (url: string): Observable<boolean> => {
                                return of(url.indexOf('http://') === 0 || url.indexOf('https://') === 0);
                            }
                        }),

                        // image width
                        new DialogField({
                            name: 'imgWidth',
                            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_WIDTH',
                            description: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_WIDTH_DESCRIPTION',
                            type: 'number',
                            fieldType: DialogFieldType.TEXT,
                            value: widthValue
                        }),
                        new DialogField({
                            name: 'imgWidthType',
                            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_SIZE_TYPE',
                            description: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_SIZE_TYPE_DESCRIPTION',
                            inputOptions: NgxWigCustomLibraryButtons.unitTypes,
                            inputOptionsClearable: false,
                            value: widthUnit
                        }),

                        // image height
                        new DialogField({
                            name: 'imgHeight',
                            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_HEIGHT',
                            description: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_HEIGHT_DESCRIPTION',
                            type: 'number',
                            fieldType: DialogFieldType.TEXT,
                            value: heightValue
                        }),
                        new DialogField({
                            name: 'imgHeightType',
                            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_SIZE_TYPE',
                            description: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_SIZE_TYPE_DESCRIPTION',
                            inputOptions: NgxWigCustomLibraryButtons.unitTypes,
                            inputOptionsClearable: false,
                            value: heightUnit
                        }),

                        // title
                        new DialogField({
                            name: 'imgTitle',
                            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_TITLE',
                            description: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_TITLE_DESCRIPTION',
                            fieldType: DialogFieldType.TEXT,
                            value: element ? element.title : undefined
                        }),

                        // Alt
                        new DialogField({
                            name: 'imgAlt',
                            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_ALT',
                            description: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_Alt_DESCRIPTION',
                            fieldType: DialogFieldType.TEXT,
                            value: element ? element.alt : undefined
                        })
                    ]
                })
            )
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // date used to create / update image
                    const data: INgxWigImgData = {
                        imgUrl: answer.inputValue.value.imgUrl,
                        imgWidth: answer.inputValue.value.imgWidth,
                        imgWidthType: answer.inputValue.value.imgWidthType,
                        imgHeight: answer.inputValue.value.imgHeight,
                        imgHeightType: answer.inputValue.value.imgHeightType,
                        imgTitle: answer.inputValue.value.imgTitle,
                        imgAlt: answer.inputValue.value.imgAlt
                    };

                    // insert or update image
                    if (!element) {
                        NgxWigCustomLibraryButtons.addNewImage(
                            ctx,
                            data
                        );
                    } else {
                        // update image details
                        NgxWigCustomLibraryButtons.updateImage(
                            ctx,
                            element,
                            data
                        );
                    }
                }
            });
    }

    /**
     * Reset caret position
     */
    static resetCaretPosition(ctx: NgxWigComponent) {
        // determine caret position
        const selectionRange = _.get(
            ctx,
            NgxWigCustomLibraryButtons.SELECTION_RANGE_PATH
        );
        if (selectionRange) {
            // clear all selections
            const selection = window.getSelection();
            if (selection.removeAllRanges) {
                selection.removeAllRanges();
            }

            // select old selection
            if (selection.addRange) {
                selection.addRange(selectionRange);
            }
        }
    }

    /**
     * Insert new image
     */
    static addNewImage(
        ctx: NgxWigComponent,
        data: INgxWigImgData
    ) {
        // reset caret position
        NgxWigCustomLibraryButtons.resetCaretPosition(ctx);

        // construct image html
        let imgHtml = `<img class="ngx-wig-img" src="${data.imgUrl}"`;

        // set width ?
        if (
            _.isNumber(data.imgWidth) ||
            !_.isEmpty(data.imgWidth)
        ) {
            imgHtml += ` width="${data.imgWidth}${data.imgWidthType}"`;
        }

        // set height ?
        if (
            _.isNumber(data.imgHeight) ||
            !_.isEmpty(data.imgHeight)
        ) {
            imgHtml += ` height="${data.imgHeight}${data.imgHeightType}"`;
        }

        // title
        if (!_.isEmpty(data.imgTitle)) {
            imgHtml += ` title="${data.imgTitle}"`;
        }

        // alt
        if (!_.isEmpty(data.imgAlt)) {
            imgHtml += ` alt="${data.imgAlt}"`;
        }

        // insert image
        ctx.execCommand(
            'insertHtml',
            `${imgHtml} />`
        );
    }

    /**
     * Update image details
     */
    static updateImage(
        ctx: NgxWigComponent,
        element,
        data: INgxWigImgData
    ) {
        // update URL
        NgxWigCustomLibraryButtons.renderer2.setAttribute(
            element,
            'src',
            data.imgUrl
        );

        // set width ?
        if (
            _.isNumber(data.imgWidth) ||
            !_.isEmpty(data.imgWidth)
        ) {
            NgxWigCustomLibraryButtons.renderer2.setAttribute(
                element,
                'width',
                `${data.imgWidth}${data.imgWidthType}`
            );
        } else {
            NgxWigCustomLibraryButtons.renderer2.removeAttribute(
                element,
                'width'
            );
        }

        // set height ?
        if (
            _.isNumber(data.imgHeight) ||
            !_.isEmpty(data.imgHeight)
        ) {
            NgxWigCustomLibraryButtons.renderer2.setAttribute(
                element,
                'height',
                `${data.imgHeight}${data.imgHeightType}`
            );
        } else {
            NgxWigCustomLibraryButtons.renderer2.removeAttribute(
                element,
                'height'
            );
        }

        // title
        if (!_.isEmpty(data.imgTitle)) {
            NgxWigCustomLibraryButtons.renderer2.setAttribute(
                element,
                'title',
                data.imgTitle
            );
        } else {
            NgxWigCustomLibraryButtons.renderer2.removeAttribute(
                element,
                'title'
            );
        }

        // alt
        if (!_.isEmpty(data.imgAlt)) {
            NgxWigCustomLibraryButtons.renderer2.setAttribute(
                element,
                'alt',
                data.imgAlt
            );
        } else {
            NgxWigCustomLibraryButtons.renderer2.removeAttribute(
                element,
                'alt'
            );
        }

        // content changed - mark as dirty
        ctx.onContentChange(ctx.container.innerHTML);
    }

    /**
     * Display link create / update dialog
     * @param ctx
     * @param element
     */
    static displayLinkDialog(
        ctx: NgxWigComponent,
        element?: any
    ) {
        // display insert / modify image dialog
        NgxWigCustomLibraryButtons.dialogService
            .showInput(
                new DialogConfiguration({
                    message: element ? 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_MODIFY' : 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_ADD',
                    yesLabel: element ? 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_MODIFY_BUTTON' : 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_ADD_BUTTON',
                    fieldsListLayout: [
                        100,
                        75, 25
                    ],
                    fieldsList: [
                        // link
                        new DialogField({
                            name: 'linkUrl',
                            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_URL',
                            description: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_URL_DESCRIPTION',
                            required: true,
                            value: element ? element.href : 'http://',
                            fieldType: DialogFieldType.URL,
                            urlAsyncValidator: (url: string): Observable<boolean> => {
                                return of(url.indexOf('http://') === 0 || url.indexOf('https://') === 0);
                            }
                        }),

                        // text
                        new DialogField({
                            name: 'linkText',
                            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_TEXT',
                            description: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_TEXT_DESCRIPTION',
                            required: true,
                            fieldType: DialogFieldType.TEXT,
                            value: element ? element.innerText : undefined
                        }),

                        // target
                        new DialogField({
                            name: 'linkTarget',
                            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_TARGET',
                            description: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_TARGET_DESCRIPTION',
                            inputOptions: NgxWigCustomLibraryButtons.targetTypes,
                            inputOptionsClearable: false,
                            value: element ? element.target : '_blank'
                        })
                    ]
                })
            )
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // date used to create / update link
                    const data: INgxWigLinkData = {
                        linkUrl: answer.inputValue.value.linkUrl,
                        linkText: answer.inputValue.value.linkText,
                        linkTarget: answer.inputValue.value.linkTarget
                    };

                    // insert or update link
                    if (!element) {
                        NgxWigCustomLibraryButtons.addNewLink(
                            ctx,
                            data
                        );
                    } else {
                        // update link details
                        NgxWigCustomLibraryButtons.updateLink(
                            ctx,
                            element,
                            data
                        );
                    }
                }
            });
    }

    /**
     * Insert new link
     */
    static addNewLink(
        ctx: NgxWigComponent,
        data: INgxWigLinkData
    ) {
        // reset caret position
        NgxWigCustomLibraryButtons.resetCaretPosition(ctx);

        // construct link html
        let linkHtml = `<a class="ngx-wig-link" href="${data.linkUrl}"`;

        // target
        if (!_.isEmpty(data.linkTarget)) {
            linkHtml += ` target="${data.linkTarget}"`;
        }

        // text - MUST BE LAST
        if (!_.isEmpty(data.linkText)) {
            linkHtml += '>' + data.linkText + '</a>';
        }

        // insert image
        ctx.execCommand(
            'insertHtml',
            linkHtml
        );
    }

    /**
     * Update link details
     */
    static updateLink(
        ctx: NgxWigComponent,
        element,
        data: INgxWigLinkData
    ) {
        // update URL
        NgxWigCustomLibraryButtons.renderer2.setAttribute(
            element,
            'href',
            data.linkUrl
        );

        // text
        element.innerText = data.linkText;

        // target
        NgxWigCustomLibraryButtons.renderer2.setAttribute(
            element,
            'target',
            data.linkTarget
        );

        // content changed - mark as dirty
        ctx.onContentChange(ctx.container.innerHTML);
    }

    /**
     * Construct buttons library
     * @param i18nService
     * @param dialogService
     * @param renderer2
     */
    constructor(
        @Inject(I18nService) i18nService: I18nService,
        @Inject(DialogService) dialogService: DialogService,
        @Inject(Renderer2) renderer2: Renderer2
    ) {
        // remember services
        NgxWigCustomLibraryButtons.i18nService = i18nService;
        NgxWigCustomLibraryButtons.dialogService = dialogService;
        NgxWigCustomLibraryButtons.renderer2 = renderer2;

        // initialize buttons
        this.initButtons();
    }

    /**
     * Init buttons
     */
    private initButtons() {
        // initialize buttons
        _.each(
            NgxWigCustomLibraryButtons.defaultButtonsConf,
            (button: TButtonExtended, idButton: string) => {
                // clone list of buttons so we don't alter anything
                // translate tokens & labels
                const buttonClone: TButtonExtended = new TButtonExtended(_.cloneDeep(button));
                buttonClone.refreshTranslation();
                this[idButton] = buttonClone;
            }
        );
    }
}
