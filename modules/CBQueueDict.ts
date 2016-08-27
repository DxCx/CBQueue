"use strict";

import {CBQueue} from "./CBQueue";

export class CBQueueDict<T> {
    private _queues: { [key: string]: CBQueue<T> };
    private _started: boolean = false;
    private _initialValue: T;

    constructor() {
        this._queues = {};
    }

    public isBusy(queueName: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if ( true === this._started ) {
                throw new Error("Queue can be started only once!");
            }

            resolve(this._queues[queueName].busy$.take(1).toPromise());
        });
    }

    /**
     * method is used to push a new callback to the queue,
     *
     * @param queueName the name of the queue to push into
     * @param handler callback to push.
     * @param highPriority setting to true will cause the callback to be called
     * just right after the currently running one is done.
     * low priority items will be appended to the end.
     * @returns a promise that determinates the current callback has ran.
     */
    public push(queueName: string,
                handler: () => T | Promise<T>,
                highPriority: boolean = false): Promise<T> {
        if ( false === this._queues.hasOwnProperty(queueName) ) {
            this._queues[queueName] = new CBQueue<T>();

            if ( this._started ) {
                this._queues[queueName].start(this._initialValue);
            }
        }

        return this._queues[queueName].push(handler, highPriority);
    }

    /**
     * method is used to run callback on all Queues in dict.
     * @param handler callback to push.
     * @param highPriority setting to true will cause the callback to be called
     * just right after the currently running one is done.
     * low priority items will be appended to the end.
     */
    public all(handler: (queueName: string) => T | Promise<T>,
               highPriority: boolean = false): Promise<T[]> {
        let pArray: Array<Promise<T>> = [];

        for ( let q in this._queues ) {
            if ( true === this._queues.hasOwnProperty(q) ) {
                pArray.push(this._queues[q].push(() => {
                    return handler(q);
                }, highPriority));
            }
        }

        return Promise.all<T>(pArray);
    }

    /**
     * method is used to remove CBQueues from the dict.
     * @param queueName the name of the queue to remove
     * @returns a promsie that resolves when the queue is removed.
     */
    public remove(queueName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if ( false === this._queues.hasOwnProperty(queueName) ) {
                reject(`${queueName} is not a queue`);
            }
            delete this._queues[queueName];
            resolve(undefined);
        });
    }

    /**
     * method is used to start the queue handling,
     *
     * @param initialValue to pass to the first callback in chain.
     * @returns a promise that all prepared queues has started to run.
     */
    public start(initialValue?: T): Promise<T[]> {
        if ( true === this._started ) {
            throw new Error("Queue can be started only once!");
        }

        this._started = true;
        this._initialValue = initialValue;

        return Promise.all<T>(Object.keys(this._queues).map((q: string) => {
            return this._queues[q].start(initialValue);
        }));
    }
}
