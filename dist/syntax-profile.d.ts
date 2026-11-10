/** A complete authoring dialect, with standard Markdown always available. */
export type SyntaxProfile = 'all' | 'basic' | 'zenn';
export interface SyntaxOptions {
    /** Defaults to the backwards-compatible, all-features pipeline. */
    syntax?: SyntaxProfile;
}
//# sourceMappingURL=syntax-profile.d.ts.map