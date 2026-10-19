/**
 * Syntax surface shared with inkstream v1.
 *
 * Tag names and attribute names mirror the frozen v1 manifest
 * (inkstream/src/syntax/markdown-syntax-manifest.ts). Additions are safe;
 * renames and removals are breaking for published content.
 */
export const MINTLIFY_CALLOUT_VARIANTS = {
    Note: 'note',
    Tip: 'tip',
    Info: 'info',
    Warning: 'alert',
    Check: 'check',
} as const;

export const MINTLIFY_CALLOUT_TAG_NAMES = Object.keys(
    MINTLIFY_CALLOUT_VARIANTS,
) as (keyof typeof MINTLIFY_CALLOUT_VARIANTS)[];

export const MINTLIFY_BLOCK_TAG_NAMES = [
    'Card',
    'CardGroup',
    'Frame',
    'Columns',
    'Tabs',
    'Tab',
    'Accordion',
    'AccordionGroup',
    'Expandable',
    'Steps',
    'Step',
    'ResponseField',
    'ParamField',
    'CodeGroup',
    'Update',
    'Tree',
    ...MINTLIFY_CALLOUT_TAG_NAMES,
] as const;

export const MINTLIFY_INLINE_TAG_NAMES = ['Badge', 'Tooltip'] as const;

/** Generative UI tags. These are only enabled by the opt-in profile. */
export const GENERATIVE_UI_BLOCK_TAG_NAMES = [
    'Box',
    'Row',
    'Column',
    'Badge',
    'Icon',
    'Form',
    'Input',
    'Slider',
    'Checkbox',
    'Select',
    'Option',
] as const;

export const GENERATIVE_UI_INLINE_TAG_NAMES = ['Icon', 'Button'] as const;

export const GENERATIVE_UI_TAG_ATTRIBUTES = {
    Box: ['padding'],
    Row: ['align', 'justify', 'gap'],
    Column: ['align', 'justify', 'gap'],
    Icon: ['name'],
    Form: ['id', 'action'],
    Button: ['action', 'type'],
    Input: ['id', 'label', 'default', 'placeholder'],
    Slider: ['id', 'label', 'min', 'max', 'step', 'default'],
    Checkbox: ['id', 'label', 'default'],
    Select: ['id', 'label', 'default'],
    Option: ['value'],
} as const;

/**
 * GitHub blockquote alert markers (`> [!NOTE]` etc.) mapped onto the same
 * callout variants the Mintlify tags and `:::message` produce. WARNING and
 * CAUTION intentionally share the strongest variant, mirroring v1.
 */
export const GITHUB_ALERT_VARIANTS = {
    NOTE: 'note',
    TIP: 'tip',
    IMPORTANT: 'info',
    WARNING: 'alert',
    CAUTION: 'alert',
} as const;

export const MINTLIFY_ATTRIBUTE_NAMES = [
    'caption',
    'hint',
    'title',
    'icon',
    'sync',
    'borderBottom',
    'href',
    'cols',
    'name',
    'type',
    'required',
    'default',
    'deprecated',
    'path',
    'query',
    'body',
    'color',
    'size',
    'shape',
    'stroke',
    'disabled',
    'tip',
    'headline',
    'cta',
    'label',
    'description',
    'tags',
    'defaultOpen',
] as const;
