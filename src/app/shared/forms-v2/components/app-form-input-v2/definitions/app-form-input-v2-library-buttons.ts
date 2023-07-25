import { CommandFunction, NgxWigComponent, TButton } from 'ngx-wig';
import { Inject, Injectable, Renderer2 } from '@angular/core';
import * as _ from 'lodash';
import { I18nService } from '../../../../../core/services/helper/i18n.service';
import { DialogV2Service } from '../../../../../core/services/helper/dialog-v2.service';
import { ILabelValuePairModel } from '../../../core/label-value-pair.model';
import {
  IV2SideDialogConfigButtonType,
  IV2SideDialogConfigInputNumber,
  IV2SideDialogConfigInputRow,
  IV2SideDialogConfigInputSingleDropdown,
  IV2SideDialogConfigInputText,
  V2SideDialogConfigInputType
} from '../../../../components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { of } from 'rxjs';

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

/**
 * Button
 */
class TButtonExtended implements TButton {
  // TButton properties
  label: string;
  icon: string;
  title: string;
  command: string | CommandFunction;
  styleClass: string;

  // other properties
  id: string;

  // extra params
  constructor(data?: {
    id: string,
    label?: string,
    icon?: string,
    title?: string,
    command?: string | CommandFunction,
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
    // determine parent button
    const originalButton: TButtonExtended = _.find(
      AppFormInputV2LibraryButtons.defaultButtonsConf, {
        id: this.id
      }
    );

    // translate
    this.label = originalButton.label ?
      AppFormInputV2LibraryButtons.i18nService.instant(originalButton.label) :
      originalButton.label;
    this.title = originalButton.title ?
      AppFormInputV2LibraryButtons.i18nService.instant(originalButton.title) :
      originalButton.title;
  }
}

/**
 * Handles custom buttons for our wysiwyg
 */
@Injectable()
export class AppFormInputV2LibraryButtons {
  // constants
  static readonly SELECTION_RANGE_PATH = 'ngxWigEditable.nativeElement.selectionRange';

  /**
   * Keep an instance of the services to access them from static methods
   */
  static i18nService: I18nService;
  private static _dialogV2Service: DialogV2Service;
  private static _renderer2: Renderer2;

  /**
   * Image width / height unit types
   */
  static readonly unitTypes: ILabelValuePairModel[] = [
    {
      label: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_WIDTH_TYPE_PX',
      value: 'px'
    },
    {
      label: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_WIDTH_TYPE_PERCENT',
      value: '%'
    }
  ];

  /**
   * Link target types
   */
  static readonly targetTypes: ILabelValuePairModel[] = [
    {
      label: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_TARGET_TYPE_BLANK',
      value: '_blank'
    },
    {
      label: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_TARGET_TYPE_SELF',
      value: '_self'
    },
    {
      label: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_TARGET_TYPE_PARENT',
      value: '_parent'
    },
    {
      label: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_TARGET_TYPE_TOP',
      value: '_top'
    }
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
          AppFormInputV2LibraryButtons.displayLinkDialog(
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
          AppFormInputV2LibraryButtons.displayImageDialog(
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
    AppFormInputV2LibraryButtons._dialogV2Service
      .showSideDialog({
        title: {
          get: () => element ?
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_MODIFY' :
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_ADD'
        },
        hideInputFilter: true,
        inputs: [{
          type: V2SideDialogConfigInputType.TEXT,
          placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_URL',
          tooltip: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_URL_DESCRIPTION',
          name: 'imgUrl',
          value: element ? element.src : 'http://',
          validators: {
            required: () => true,
            async: (_data, _handler, input: IV2SideDialogConfigInputText) => {
              return of(input.value.indexOf('http://') === 0 || input.value.indexOf('https://') === 0);
            }
          }
        }, {
          type: V2SideDialogConfigInputType.ROW,
          name: 'width',
          inputs: [{
            type: V2SideDialogConfigInputType.NUMBER,
            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_WIDTH',
            tooltip: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_WIDTH_DESCRIPTION',
            name: 'imgWidth',
            value: widthValue
          }, {
            type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_SIZE_TYPE',
            tooltip: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_SIZE_TYPE_DESCRIPTION',
            name: 'imgWidthType',
            options: AppFormInputV2LibraryButtons.unitTypes,
            clearable: false,
            value: widthUnit
          }]
        }, {
          type: V2SideDialogConfigInputType.ROW,
          name: 'height',
          inputs: [{
            type: V2SideDialogConfigInputType.NUMBER,
            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_HEIGHT',
            tooltip: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_HEIGHT_DESCRIPTION',
            name: 'imgHeight',
            value: heightValue
          }, {
            type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
            placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_SIZE_TYPE',
            tooltip: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_SIZE_TYPE_DESCRIPTION',
            name: 'imgHeightType',
            options: AppFormInputV2LibraryButtons.unitTypes,
            clearable: false,
            value: heightUnit
          }]
        }, {
          type: V2SideDialogConfigInputType.TEXT,
          placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_TITLE',
          tooltip: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_TITLE_DESCRIPTION',
          name: 'imgTitle',
          value: element ? element.title : undefined
        }, {
          type: V2SideDialogConfigInputType.TEXT,
          placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_ALT',
          tooltip: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_Alt_DESCRIPTION',
          name: 'imgAlt',
          value: element ? element.alt : undefined
        }],
        bottomButtons: [{
          type: IV2SideDialogConfigButtonType.OTHER,
          label: element ?
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_MODIFY_BUTTON' :
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_IMAGE_DIALOG_ADD_BUTTON',
          color: 'primary',
          key: 'apply',
          disabled: (_data, handler): boolean => {
            return !handler.form ||
              handler.form.invalid ||
              handler.form.pending;
          }
        }, {
          type: IV2SideDialogConfigButtonType.CANCEL,
          label: 'LNG_COMMON_BUTTON_CANCEL',
          color: 'text'
        }]
      })
      .subscribe((response) => {
        // cancelled ?
        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
          // finished
          return;
        }

        // date used to create / update image
        const data: INgxWigImgData = {
          imgUrl: (response.data.map.imgUrl as IV2SideDialogConfigInputText).value,
          imgWidth: ((response.data.map.width as IV2SideDialogConfigInputRow).inputs[0] as IV2SideDialogConfigInputNumber).value,
          imgWidthType: ((response.data.map.width as IV2SideDialogConfigInputRow).inputs[1] as IV2SideDialogConfigInputSingleDropdown).value,
          imgHeight: ((response.data.map.height as IV2SideDialogConfigInputRow).inputs[0] as IV2SideDialogConfigInputNumber).value,
          imgHeightType: ((response.data.map.height as IV2SideDialogConfigInputRow).inputs[1] as IV2SideDialogConfigInputSingleDropdown).value,
          imgTitle: (response.data.map.imgTitle as IV2SideDialogConfigInputText).value,
          imgAlt: (response.data.map.imgAlt as IV2SideDialogConfigInputText).value
        };

        // insert or update image
        if (!element) {
          AppFormInputV2LibraryButtons.addNewImage(
            ctx,
            data
          );
        } else {
          // update image details
          AppFormInputV2LibraryButtons.updateImage(
            ctx,
            element,
            data
          );
        }

        // close popup
        response.handler.hide();
      });
  }

  /**
   * Reset caret position
   */
  static resetCaretPosition(ctx: NgxWigComponent) {
    // determine caret position
    const selectionRange = _.get(
      ctx,
      AppFormInputV2LibraryButtons.SELECTION_RANGE_PATH
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
    AppFormInputV2LibraryButtons.resetCaretPosition(ctx);

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
    AppFormInputV2LibraryButtons._renderer2.setAttribute(
      element,
      'src',
      data.imgUrl
    );

    // set width ?
    if (
      _.isNumber(data.imgWidth) ||
      !_.isEmpty(data.imgWidth)
    ) {
      AppFormInputV2LibraryButtons._renderer2.setAttribute(
        element,
        'width',
        `${data.imgWidth}${data.imgWidthType}`
      );
    } else {
      AppFormInputV2LibraryButtons._renderer2.removeAttribute(
        element,
        'width'
      );
    }

    // set height ?
    if (
      _.isNumber(data.imgHeight) ||
      !_.isEmpty(data.imgHeight)
    ) {
      AppFormInputV2LibraryButtons._renderer2.setAttribute(
        element,
        'height',
        `${data.imgHeight}${data.imgHeightType}`
      );
    } else {
      AppFormInputV2LibraryButtons._renderer2.removeAttribute(
        element,
        'height'
      );
    }

    // title
    if (!_.isEmpty(data.imgTitle)) {
      AppFormInputV2LibraryButtons._renderer2.setAttribute(
        element,
        'title',
        data.imgTitle
      );
    } else {
      AppFormInputV2LibraryButtons._renderer2.removeAttribute(
        element,
        'title'
      );
    }

    // alt
    if (!_.isEmpty(data.imgAlt)) {
      AppFormInputV2LibraryButtons._renderer2.setAttribute(
        element,
        'alt',
        data.imgAlt
      );
    } else {
      AppFormInputV2LibraryButtons._renderer2.removeAttribute(
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
    AppFormInputV2LibraryButtons._dialogV2Service
      .showSideDialog({
        title: {
          get: () => element ?
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_MODIFY' :
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_ADD'
        },
        hideInputFilter: true,
        inputs: [{
          type: V2SideDialogConfigInputType.TEXT,
          placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_URL',
          tooltip: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_URL_DESCRIPTION',
          name: 'linkUrl',
          value: element ? element.href : 'http://',
          validators: {
            required: () => true,
            async: (_data, _handler, input: IV2SideDialogConfigInputText) => {
              return of(input.value.indexOf('http://') === 0 || input.value.indexOf('https://') === 0);
            }
          }
        }, {
          type: V2SideDialogConfigInputType.TEXT,
          placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_TEXT',
          tooltip: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_TEXT_DESCRIPTION',
          name: 'linkText',
          value: element ? element.innerText : undefined,
          validators: {
            required: () => true
          }
        }, {
          type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
          placeholder: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_TARGET',
          tooltip: 'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_TARGET_DESCRIPTION',
          name: 'linkTarget',
          options: AppFormInputV2LibraryButtons.targetTypes,
          clearable: false,
          value: element ? element.target : '_blank'
        }],
        bottomButtons: [{
          type: IV2SideDialogConfigButtonType.OTHER,
          label: element ?
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_MODIFY_BUTTON' :
            'LNG_NGX_WIG_CUSTOM_LIBRARY_BUTTONS_LABEL_LINK_DIALOG_ADD_BUTTON',
          color: 'primary',
          key: 'apply',
          disabled: (_data, handler): boolean => {
            return !handler.form ||
              handler.form.invalid ||
              handler.form.pending;
          }
        }, {
          type: IV2SideDialogConfigButtonType.CANCEL,
          label: 'LNG_COMMON_BUTTON_CANCEL',
          color: 'text'
        }]
      })
      .subscribe((response) => {
        // cancelled ?
        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
          // finished
          return;
        }

        // date used to create / update link
        const data: INgxWigLinkData = {
          linkUrl: (response.data.map.linkUrl as IV2SideDialogConfigInputText).value,
          linkText: (response.data.map.linkText as IV2SideDialogConfigInputText).value,
          linkTarget: (response.data.map.linkTarget as IV2SideDialogConfigInputSingleDropdown).value
        };

        // insert or update link
        if (!element) {
          AppFormInputV2LibraryButtons.addNewLink(
            ctx,
            data
          );
        } else {
          // update link details
          AppFormInputV2LibraryButtons.updateLink(
            ctx,
            element,
            data
          );
        }

        // close popup
        response.handler.hide();
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
    AppFormInputV2LibraryButtons.resetCaretPosition(ctx);

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
    AppFormInputV2LibraryButtons._renderer2.setAttribute(
      element,
      'href',
      data.linkUrl
    );

    // text
    element.innerText = data.linkText;

    // target
    AppFormInputV2LibraryButtons._renderer2.setAttribute(
      element,
      'target',
      data.linkTarget
    );

    // content changed - mark as dirty
    ctx.onContentChange(ctx.container.innerHTML);
  }

  /**
   * Construct buttons library
   */
  constructor(@Inject(I18nService) i18nService: I18nService,
    @Inject(DialogV2Service) dialogV2Service: DialogV2Service,
    @Inject(Renderer2) renderer2: Renderer2
  ) {
    // remember services
    AppFormInputV2LibraryButtons.i18nService = i18nService;
    AppFormInputV2LibraryButtons._dialogV2Service = dialogV2Service;
    AppFormInputV2LibraryButtons._renderer2 = renderer2;

    // initialize buttons
    this.initButtons();
  }

  /**
   * Init buttons
   */
  private initButtons() {
    // initialize buttons
    _.each(
      AppFormInputV2LibraryButtons.defaultButtonsConf,
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
