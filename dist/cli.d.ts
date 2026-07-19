#!/usr/bin/env node
export interface CliResult {
    exitCode: number;
    output: string;
}
/**
 * Runs the CLI against explicit argv (excluding the node/script path) and
 * markdown source, returning the result instead of touching process.stdout
 * / process.exit, so it's directly testable. The bottom of this module
 * wires this to the real process for the actual `inkstream` binary.
 */
export declare function runCli(argv: string[], markdown?: string): Promise<CliResult>;
//# sourceMappingURL=cli.d.ts.map