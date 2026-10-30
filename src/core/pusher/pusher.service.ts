import { Injectable } from '@nestjs/common';
import Pusher from 'pusher';
import { configuration } from '~/common/configuration';

@Injectable()
export class PusherService {
    private readonly pusher: Pusher;
    constructor() {
        this.pusher = new Pusher({
            appId: configuration().pusher.appId,
            key: configuration().pusher.key,
            secret: configuration().pusher.secret,
            cluster: configuration().pusher.cluster,
            useTLS: configuration().pusher.useTLS,
        });
    }

    /**
     * Trigger a pusher event with the given channel, event, and data.
     * @param {string} channel - The channel to trigger the event on.
     * @param {string} event - The event to trigger.
     * @param {any} data - The data to trigger the event with.
     */
    async trigger(channel: string, event: string, data: any) {
        await this.pusher.trigger(channel, event, data);
    }
}
