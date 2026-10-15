import { useEffect, useRef, useState } from 'react';

/** Coalesce generation updates without delaying the final source or UI state. */
export function useStreamingSource(source: string, streaming: boolean, interval: number): string {
    const active = streaming && Number.isFinite(interval) && interval > 0 && interval <= 2_147_483_647;
    const [snapshot, setSnapshot] = useState({ source, active });
    const latest = useRef(source);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Source changes do not cancel the timer: sustained streams must not starve.
    useEffect(() => () => {
        if (timer.current !== undefined) clearTimeout(timer.current);
        timer.current = undefined;
    }, [active, interval]);

    useEffect(() => {
        latest.current = source;
        if (!active || snapshot.active !== active) {
            if (snapshot.active !== active) {
                setSnapshot({ source, active });
            }
            return;
        }
        if (source !== snapshot.source && timer.current === undefined) {
            timer.current = setTimeout(() => {
                timer.current = undefined;
                setSnapshot({ source: latest.current, active: true });
            }, Math.ceil(interval));
        }
    }, [source, active, interval, snapshot]);

    // Completion and a new generation are visible in the current render.
    return !active || snapshot.active !== active ? source : snapshot.source;
}
