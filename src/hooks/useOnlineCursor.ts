import { useEffect, useState } from 'react';
import { filter } from 'rxjs/operators';
import Presence from '@yomo/presencejs';
import Me from '../cursor/me';
import Other from '../cursor/other';
import { uuidv4 } from '../helper';
import { CursorMessage, OfflineMessage } from '../types';

const useOnlineCursor = ({
    presenceURL,
    presenceAuthEndpoint,
    room,
    name,
    avatar,
    color,
    onOtherEntry = () => {},
    onOtherLeave = () => {},
}: {
    presenceURL: string;
    presenceAuthEndpoint: string;
    room?: string;
    name?: string;
    avatar?: string;
    color?: string;
    onOtherEntry?: () => void;
    onOtherLeave?: () => void;
}) => {
    const [me, setMe] = useState<Me | null>(null);
    const [otherMap, setOtherMap] = useState<Map<string, Other>>(
        new Map<string, Other>()
    );
    const [others, setOthers] = useState<Array<Other>>([]);

    useEffect(() => {
        const ID = uuidv4();

        const me = new Me({
            id: ID,
            x: 0,
            y: 0,
            name: name || '',
            avatar: avatar || '',
            color: color || '',
        });

        setMe(me);

        const yomo = new Presence(presenceURL, {
            auth: {
                type: 'token',
                endpoint: presenceAuthEndpoint,
            },
        });

        yomo.on('connected', () => {
            if (room) {
                yomo.toRoom(room);
            }

            yomo.on$<CursorMessage>('online')
                .pipe(filter(data => data.id !== ID))
                .subscribe(data => {
                    setOtherMap(old => {
                        if (old.has(data.id)) {
                            return old;
                        }
                        const cursorMap = new Map(old);
                        const other = new Other(data);
                        other.onLeave = onOtherLeave;
                        other.onEnter = onOtherEntry;
                        other.goOnline(yomo);
                        cursorMap.set(other.id, other);
                        return cursorMap;
                    });
                });

            yomo.on<OfflineMessage>('offline', data => {
                setOtherMap(old => {
                    const cursorMap = new Map(old);
                    const other = cursorMap.get(data.id);
                    if (other) {
                        other.unsubscribe();
                    }
                    cursorMap.delete(data.id);
                    return cursorMap;
                });
            });

            // Answer server query, when other other go online, server will ask others states,
            // this is the response
            yomo.on$<CursorMessage>('sync')
                .pipe(filter(data => data.id !== ID))
                .subscribe(data => {
                    setOtherMap(old => {
                        if (old.has(data.id)) {
                            return old;
                        }
                        const cursorMap = new Map(old);
                        const other = new Other(data);
                        other.onLeave = onOtherLeave;
                        other.onEnter = onOtherEntry;
                        other.goOnline(yomo);
                        cursorMap.set(other.id, other);
                        return cursorMap;
                    });
                });

            me.goOnline(yomo);
        });

        // yomo.on('closed', () => {});

        const cleanup = async () => {
            await me.goOffline();
            yomo.close();
        };

        window.addEventListener('unload', cleanup);

        return () => {
            cleanup();
            window.removeEventListener('unload', cleanup);
        };
    }, [room]);

    useEffect(() => {
        setOthers(Array.from(otherMap.values()));
    }, [otherMap]);

    return { me, others };
};

export default useOnlineCursor;
