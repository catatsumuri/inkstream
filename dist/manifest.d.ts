/**
 * Syntax surface shared with inkstream v1.
 *
 * Tag names and attribute names mirror the frozen v1 manifest
 * (inkstream/src/syntax/markdown-syntax-manifest.ts). Additions are safe;
 * renames and removals are breaking for published content.
 */
export declare const MINTLIFY_CALLOUT_VARIANTS: {
    readonly Note: "note";
    readonly Tip: "tip";
    readonly Info: "info";
    readonly Warning: "alert";
    readonly Check: "check";
};
export declare const MINTLIFY_CALLOUT_TAG_NAMES: (keyof typeof MINTLIFY_CALLOUT_VARIANTS)[];
export declare const MINTLIFY_BLOCK_TAG_NAMES: readonly ["Card", "CardGroup", "Columns", "Tabs", "Tab", "Accordion", "AccordionGroup", "Steps", "Step", "ResponseField", "ParamField", "CodeGroup", "Update", "Tree", ...("Note" | "Tip" | "Info" | "Warning" | "Check")[]];
export declare const MINTLIFY_INLINE_TAG_NAMES: readonly ["Badge", "Tooltip"];
/**
 * GitHub blockquote alert markers (`> [!NOTE]` etc.) mapped onto the same
 * callout variants the Mintlify tags and `:::message` produce. WARNING and
 * CAUTION intentionally share the strongest variant, mirroring v1.
 */
export declare const GITHUB_ALERT_VARIANTS: {
    readonly NOTE: "note";
    readonly TIP: "tip";
    readonly IMPORTANT: "info";
    readonly WARNING: "alert";
    readonly CAUTION: "alert";
};
export declare const MINTLIFY_ATTRIBUTE_NAMES: readonly ["title", "icon", "sync", "borderBottom", "href", "cols", "name", "type", "required", "default", "deprecated", "path", "query", "body", "color", "size", "shape", "stroke", "disabled", "tip", "headline", "cta", "label", "description", "tags"];
//# sourceMappingURL=manifest.d.ts.map