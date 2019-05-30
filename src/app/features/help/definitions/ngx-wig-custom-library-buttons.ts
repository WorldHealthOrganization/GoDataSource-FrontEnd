import { NgxWigComponent, TButton } from 'ngx-wig';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { DialogAnswer, DialogAnswerButton, DialogConfiguration, DialogField, DialogFieldType } from '../../../shared/components';
import { Observable } from 'rxjs/internal/Observable';
import { of } from 'rxjs/internal/observable/of';
import { Renderer2 } from '@angular/core';
import * as _ from 'lodash';
import { LabelValuePair } from '../../../core/models/label-value-pair';

/**
 * List of active listeners
 */
let ngxWigCustomLibraryButtonsListeners: (() => void)[] = [];

/**
 * Handles custom buttons for our wysiwyg
 * @param i18nService
 */
export const ngxWigCustomLibraryButtonsFactory = (
    i18nService: I18nService,
    dialogService: DialogService,
    renderer2: Renderer2
) => {
    // image width / height unit types
    const unitTypes: LabelValuePair[] = [
        new LabelValuePair(
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_WIDTH_TYPE_PX',
            'px'
        ),
        new LabelValuePair(
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_INSERT_IMAGE_DIALOG_WIDTH_TYPE_PERCENT',
            '%'
        )
    ];

    // add / update image dialog
    let ngxWigSelectedRange;
    const displayImageDialog = (
        ctx: NgxWigComponent,
        element?: any
    ) => {
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
        dialogService
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
                            inputOptions: unitTypes,
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
                            inputOptions: unitTypes,
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
                    // insert or update image
                    if (!element) {
                        // position caret is where it should be
                        if (ngxWigSelectedRange) {
                            const selection = window.getSelection();
                            if (selection.removeAllRanges) {
                                selection.removeAllRanges();
                            }
                            if (selection.addRange) {
                                selection.addRange(ngxWigSelectedRange);
                            }
                        }

                        // construct image html
                        let imgHtml = `<img class="ngx-wig-img" src="${answer.inputValue.value.imgUrl}"`;

                        // set width ?
                        if (
                            _.isNumber(answer.inputValue.value.imgWidth) ||
                            !_.isEmpty(answer.inputValue.value.imgWidth)
                        ) {
                            imgHtml += ` width="${answer.inputValue.value.imgWidth}${answer.inputValue.value.imgWidthType}"`;
                        }

                        // set height ?
                        if (
                            _.isNumber(answer.inputValue.value.imgHeight) ||
                            !_.isEmpty(answer.inputValue.value.imgHeight)
                        ) {
                            imgHtml += ` height="${answer.inputValue.value.imgHeight}${answer.inputValue.value.imgHeightType}"`;
                        }

                        // title
                        if (!_.isEmpty(answer.inputValue.value.imgTitle)) {
                            imgHtml += ` title="${answer.inputValue.value.imgTitle}"`;
                        }

                        // alt
                        if (!_.isEmpty(answer.inputValue.value.imgAlt)) {
                            imgHtml += ` alt="${answer.inputValue.value.imgAlt}"`;
                        }

                        // insert image
                        ctx.execCommand(
                            'insertHtml',
                            `${imgHtml} />`
                        );
                    } else {
                        // update
                        element.setAttribute('src', answer.inputValue.value.imgUrl);

                        // set width ?
                        if (
                            _.isNumber(answer.inputValue.value.imgWidth) ||
                            !_.isEmpty(answer.inputValue.value.imgWidth)
                        ) {
                            element.setAttribute('width', `${answer.inputValue.value.imgWidth}${answer.inputValue.value.imgWidthType}`);
                        } else {
                            element.removeAttribute('width');
                        }

                        // set height ?
                        if (
                            _.isNumber(answer.inputValue.value.imgHeight) ||
                            !_.isEmpty(answer.inputValue.value.imgHeight)
                        ) {
                            element.setAttribute('height', `${answer.inputValue.value.imgHeight}${answer.inputValue.value.imgHeightType}`);
                        } else {
                            element.removeAttribute('height');
                        }

                        // title
                        if (!_.isEmpty(answer.inputValue.value.imgTitle)) {
                            element.setAttribute('title', answer.inputValue.value.imgTitle);
                        } else {
                            element.removeAttribute('title');
                        }

                        // alt
                        if (!_.isEmpty(answer.inputValue.value.imgAlt)) {
                            element.setAttribute('alt', answer.inputValue.value.imgAlt);
                        } else {
                            element.removeAttribute('alt');
                        }

                        // content changed
                        ctx.onContentChange(ctx.container.innerHTML);
                    }
                }
            });
    };

    // default buttons
    // hack for language change - doesn't work if we have multiple contexts
    let ctxItem: NgxWigComponent;
    const buttons: {
        [idButton: string]: TButton
    } = {
        list1: {
            label: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_UNORDERED_LIST',
            title: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_TITLE_UNORDERED_LIST',
            command: (ctx: NgxWigComponent) => {
                ctxItem = ctx;
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
                ctxItem = ctx;
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
                ctxItem = ctx;
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
                ctxItem = ctx;
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
                ctxItem = ctx;
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
                ctxItem = ctx;
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
                // update ctx
                ctxItem = ctx;

                // display add image dialog
                displayImageDialog(ctx);
            }
        }
    };

    // remember caret position
    ngxWigCustomLibraryButtonsListeners.push(renderer2.listen(
        'document',
        'selectionchange',
        () => {
            // check if our selection is a child of a ngx-wig
            const isDescendant = (parentTag, child) => {
                let node = child.parentNode;
                while (node != null) {
                    if (
                        node.tagName &&
                        node.tagName.toLowerCase() === parentTag
                    ) {
                        return true;
                    }
                    node = node.parentNode;
                }
                return false;
            };

            // if it is a child of ngx-wig, then we need to remember caret position
            if (isDescendant('ngx-wig', document.activeElement)) {
                // ngxWigSelectedElement = document.activeElement;
                const selection = window.getSelection();
                if (
                    selection.getRangeAt &&
                    selection.rangeCount
                ) {
                    ngxWigSelectedRange = selection.getRangeAt(0);
                }
            }
        }
    ));

    // handle custom double click events
    ngxWigCustomLibraryButtonsListeners.push(renderer2.listen(
        'body',
        'dblclick',
        (event) => {
            // images
            if (
                event.target &&
                event.target.classList &&
                event.target.classList.contains('ngx-wig-img')
            ) {
                displayImageDialog(ctxItem, event.target);
            }
        }
    ));

    // buttons
    const finalButtons: { [idButton: string]: TButton } = _.transform(
        buttons,
        (resultButtons: { [idButton: string]: TButton }, button: TButton, idButton: string) => {
            // clone list of buttons so we don't alter anything
            resultButtons[idButton] = _.cloneDeep(button);

            // translate tokens & labels
            resultButtons[idButton].label = i18nService.instant(resultButtons[idButton].label);
            resultButtons[idButton].title = i18nService.instant(resultButtons[idButton].title);
        },
        {}
    );

    // update tokens on translate
    i18nService.languageChangedEvent
        .subscribe(() => {
            // update buttons translations
            _.each(finalButtons, (button: TButton, idButton: string) => {
                // translate tokens & labels
                button.label = i18nService.instant(buttons[idButton].label);
                button.title = i18nService.instant(buttons[idButton].title);
            });

            // reset buttons list
            if (ctxItem) {
                ctxItem.ngOnInit();
            }
        });

    // finished
    return finalButtons;
};

/**
 * Release listeners
 */
export const ngxWigCustomLibraryButtonsRelease = () => {
    // release listeners
    ngxWigCustomLibraryButtonsListeners.forEach((listener) => {
        listener();
    });

    // clear list
    ngxWigCustomLibraryButtonsListeners = [];
};
