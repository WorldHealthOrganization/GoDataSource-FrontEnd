import { NgxWigComponent, TButton } from 'ngx-wig';
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
 * Handles custom buttons for our wysiwyg
 * @param i18nService
 */
export class NgxWigCustomLibraryButtons {
    /**
     * Html listeners
     */
    static htmlListenerDblClickImg: () => void;
    static htmlListenerSelectCaretPosition: () => void;

    /**
     * Components
     */
    static components: {
        [name: string]: NgxWigComponent
    } = {};

    /**
     * Disabled Components
     */
    static disabledComponents: {
        [name: string]: true
    } = {};

    /**
     * List of buttons
     */
    public list1: TButton;
    public list2: TButton;
    public bold: TButton;
    public italic: TButton;
    public underline: TButton;
    public linkCustom: TButton;
    public insertImageCustom: TButton;

    /**
     * Default buttons setup
     */
    private readonly defaultButtonsConf: {
        [idButton: string]: TButton
    } = {
        list1: {
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
        },
        list2: {
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
        },
        bold: {
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
        },
        italic: {
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
        },
        underline: {
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
        },
        linkCustom: {
            label: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK',
            title: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_TITLE_LINK',
            command: (ctx: NgxWigComponent) => {
                ctx.execCommand(
                    'createlink', // CUSTOM
                    ''
                );
            },
            styleClass: 'link',
            icon: 'icon-link'
        },
        insertImageCustom: {
            label: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE',
            title: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_TITLE_INSERT_IMAGE',
            styleClass: 'file-image',
            command: (ctx: NgxWigComponent) => {
                // display add image dialog
                this.displayImageDialog(ctx);
            }
        }
    };

    /**
     * Image width / height unit types
     */
    private unitTypes: LabelValuePair[] = [
        new LabelValuePair(
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_WIDTH_TYPE_PX',
            'px'
        ),
        new LabelValuePair(
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_WIDTH_TYPE_PERCENT',
            '%'
        )
    ];

    /**
     * Keep selection ranges values
     */
    private selectionRanges: {
        [name: string]: any
    } = {};

    /**
     * Check if our selection is a child of a ngx-wig
     * @param parentTag
     * @param child
     * @returns boolean | ParentNode
     */
    static getDescendant(parentTag, child) {
        // search for descendant parent
        let node = child.parentNode;
        while (node != null) {
            // is this the parent node we're looking for ?
            if (
                node.tagName &&
                node.tagName.toLowerCase() === parentTag
            ) {
                // return node descendant
                return node;
            }

            // parent node
            node = node.parentNode;
        }

        // no descendant
        return false;
    }

    /**
     * Release Html listeners
     */
    static releaseHtmlListeners() {
        // caret position
        if (NgxWigCustomLibraryButtons.htmlListenerSelectCaretPosition) {
            NgxWigCustomLibraryButtons.htmlListenerSelectCaretPosition();
            NgxWigCustomLibraryButtons.htmlListenerSelectCaretPosition = null;
        }

        // img dbl click
        if (NgxWigCustomLibraryButtons.htmlListenerDblClickImg) {
            NgxWigCustomLibraryButtons.htmlListenerDblClickImg();
            NgxWigCustomLibraryButtons.htmlListenerDblClickImg = null;
        }
    }

    /**
     * Release components
     */
    static releaseComponentsMap(
        name?: string
    ) {
        if (name) {
            delete NgxWigCustomLibraryButtons.components[name];
        } else {
            NgxWigCustomLibraryButtons.components = {};
        }
    }

    /**
     * Register component
     * @param name
     * @param ctx
     */
    static registerComponent(
        name: string,
        ctx: NgxWigComponent
    ) {
        NgxWigCustomLibraryButtons.components[name] = ctx;
    }

    /**
     * Remove component from disabled components
     */
    static unregisterDisabledComponent(
        name: string
    ) {
        delete NgxWigCustomLibraryButtons.disabledComponents[name];
    }

    /**
     * Register disabled component
     */
    static registerDisabledComponent(
        name: string
    ) {
        NgxWigCustomLibraryButtons.disabledComponents[name] = true;
    }

    /**
     * Get component name
     * @param element
     */
    static getName(element): string {
        // find name component
        const ctxNode = NgxWigCustomLibraryButtons.getDescendant('app-form-ngx-wig', element);
        return ctxNode ? ctxNode.getAttribute('name') : null;
    }

    /**
     * Construct buttons library
     * @param i18nService
     * @param dialogService
     * @param renderer2
     */
    constructor(
        @Inject(I18nService) private i18nService: I18nService,
        @Inject(DialogService) private dialogService: DialogService,
        @Inject(Renderer2) private renderer2: Renderer2
    ) {
        // add global listeners
        this.addHtmlListeners();

        // initialize buttons
        this.initButtons();

        // update tokens on translate
        this.addLanguageListener();
    }

    /**
     * Init buttons
     */
    private initButtons() {
        // initialize buttons
        _.each(
            this.defaultButtonsConf,
            (button: TButton, idButton: string) => {
                // clone list of buttons so we don't alter anything
                this[idButton] = _.cloneDeep(button);

                // translate tokens & labels
                this[idButton].label = this.i18nService.instant(button.label);
                this[idButton].title = this.i18nService.instant(button.title);
            }
        );
    }

    /**
     * Add html listeners
     */
    private addHtmlListeners() {
        // release old listeners
        NgxWigCustomLibraryButtons.releaseHtmlListeners();

        // release ranges
        this.selectionRanges = {};

        // release components
        NgxWigCustomLibraryButtons.releaseComponentsMap();

        // remember caret position
        NgxWigCustomLibraryButtons.htmlListenerSelectCaretPosition = this.renderer2.listen(
            'document',
            'selectionchange',
            () => {
                // if it is a child of ngx-wig, then we need to remember caret position
                const name: string = NgxWigCustomLibraryButtons.getName(document.activeElement);
                if (name) {
                    const selection = window.getSelection();
                    if (
                        selection.getRangeAt &&
                        selection.rangeCount
                    ) {
                        this.selectionRanges[name] = selection.getRangeAt(0);
                    }
                }
            }
        );

        // handle custom double click events
        NgxWigCustomLibraryButtons.htmlListenerDblClickImg = this.renderer2.listen(
            'body',
            'dblclick',
            (event) => {
                // images
                if (
                    event.target &&
                    event.target.classList &&
                    event.target.classList.contains('ngx-wig-img')
                ) {
                    // check if not disabled
                    const name: string = NgxWigCustomLibraryButtons.getName(event.target);
                    if (
                        !name ||
                        !NgxWigCustomLibraryButtons.disabledComponents[name]
                    ) {
                        // update image
                        this.displayImageDialog(null, event.target);
                    }
                }
            }
        );
    }

    /**
     * Add language listener
     */
    private addLanguageListener() {
        // // update tokens on translate
        // subscription = this.i18nService.languageChangedEvent
        //     .subscribe(() => {
        //         // update buttons translations
        //         _.each(finalButtons, (button: TButton, idButton: string) => {
        //             // translate tokens & labels
        //             button.label = i18nService.instant(buttons[idButton].label);
        //             button.title = i18nService.instant(buttons[idButton].title);
        //         });
        //
        //         // reset buttons list
        //         if (ctxItem) {
        //             ctxItem.ngOnInit();
        //         }
        //     });
        // subscription...release
    }

    /**
     * Display image create / update dialog
     * @param ctx
     * @param element
     */
    private displayImageDialog(
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
        this.dialogService
            .showInput(
                new DialogConfiguration({
                    message: element ? 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_MODIFY' : 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_ADD',
                    yesLabel: element ? 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_MODIFY_BUTTON' : 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_ADD_BUTTON',
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
                            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_URL',
                            description: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_URL_DESCRIPTION',
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
                            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_WIDTH',
                            description: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_WIDTH_DESCRIPTION',
                            type: 'number',
                            fieldType: DialogFieldType.TEXT,
                            value: widthValue
                        }),
                        new DialogField({
                            name: 'imgWidthType',
                            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_SIZE_TYPE',
                            description: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_SIZE_TYPE_DESCRIPTION',
                            inputOptions: this.unitTypes,
                            inputOptionsClearable: false,
                            value: widthUnit
                        }),

                        // image height
                        new DialogField({
                            name: 'imgHeight',
                            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_HEIGHT',
                            description: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_HEIGHT_DESCRIPTION',
                            type: 'number',
                            fieldType: DialogFieldType.TEXT,
                            value: heightValue
                        }),
                        new DialogField({
                            name: 'imgHeightType',
                            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_SIZE_TYPE',
                            description: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_SIZE_TYPE_DESCRIPTION',
                            inputOptions: this.unitTypes,
                            inputOptionsClearable: false,
                            value: heightUnit
                        }),

                        // title
                        new DialogField({
                            name: 'imgTitle',
                            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_TITLE',
                            description: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_TITLE_DESCRIPTION',
                            fieldType: DialogFieldType.TEXT,
                            value: element ? element.title : undefined
                        }),

                        // Alt
                        new DialogField({
                            name: 'imgAlt',
                            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_ALT',
                            description: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_Alt_DESCRIPTION',
                            fieldType: DialogFieldType.TEXT,
                            value: element ? element.alt : undefined
                        })
                    ]
                })
            )
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // date used to create / update image
                    const data = {
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
                        this.addNewImage(ctx, data);
                    } else {
                        // update image details
                        this.updateImage(element, data);
                    }
                }
            });
    }

    /**
     * Insert new image
     * @param ctx
     * @param data
     */
    private addNewImage(
        ctx: NgxWigComponent,
        data: INgxWigImgData
    ) {
        // determine caret position
        const name: string = NgxWigCustomLibraryButtons.getName(ctx.container);
        if (
            name &&
            this.selectionRanges[name]
        ) {
            const selection = window.getSelection();
            if (selection.removeAllRanges) {
                selection.removeAllRanges();
            }
            if (selection.addRange) {
                selection.addRange(this.selectionRanges[name]);
            }
        }

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
     * @param data
     */
    private updateImage(
        element,
        data: INgxWigImgData
    ) {
        // update URL
        this.renderer2.setAttribute(
            element,
            'src',
            data.imgUrl
        );

        // set width ?
        if (
            _.isNumber(data.imgWidth) ||
            !_.isEmpty(data.imgWidth)
        ) {
            this.renderer2.setAttribute(
                element,
                'width',
                `${data.imgWidth}${data.imgWidthType}`
            );
        } else {
            this.renderer2.removeAttribute(
                element,
                'width'
            );
        }

        // set height ?
        if (
            _.isNumber(data.imgHeight) ||
            !_.isEmpty(data.imgHeight)
        ) {
            this.renderer2.setAttribute(
                element,
                'height',
                `${data.imgHeight}${data.imgHeightType}`
            );
        } else {
            this.renderer2.removeAttribute(
                element,
                'height'
            );
        }

        // title
        if (!_.isEmpty(data.imgTitle)) {
            this.renderer2.setAttribute(
                element,
                'title',
                data.imgTitle
            );
        } else {
            this.renderer2.removeAttribute(
                element,
                'title'
            );
        }

        // alt
        if (!_.isEmpty(data.imgAlt)) {
            this.renderer2.setAttribute(
                element,
                'alt',
                data.imgAlt
            );
        } else {
            this.renderer2.removeAttribute(
                element,
                'alt'
            );
        }

        // content changed - mark as dirty
        // get name & determine if we have a context associated with it
        const name: string = NgxWigCustomLibraryButtons.getName(element);
        if (
            name &&
            NgxWigCustomLibraryButtons.components[name]
        ) {
            NgxWigCustomLibraryButtons.components[name].onContentChange(NgxWigCustomLibraryButtons.components[name].container.innerHTML);
        }
    }
}
