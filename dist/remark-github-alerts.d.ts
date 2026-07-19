import type { Root } from 'mdast';
/**
 * Normalizes GitHub-style blockquote alerts (`> [!NOTE]` etc.) onto the same
 * `<aside class="msg …">` contract that the Mintlify callout tags and
 * `:::message` directives produce, so one renderer handles all three
 * syntaxes.
 */
export declare function remarkGithubAlerts(): (tree: Root) => void;
//# sourceMappingURL=remark-github-alerts.d.ts.map