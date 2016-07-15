"use strict";

import {CBQueue} from "./CBQueue";
import * as Q from "q";

export class CBQueueDict<T> {
    private _queues: Array<CBQueue<T>>;
    private _started: boolean = false;
    private _initialValue: T;

    constructor() {
        this._queues = [];
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
                handler: () => T | Q.Promise<T>,
                highPriority: boolean = false): Q.Promise<T> {
        if ( false === this._queues.hasOwnProperty(queueName) ) {
            this._queues[queueName] = new CBQueue<T>();

            if ( this._started ) {
                this._queues[queueName].start(this._initialValue);
            }
        }

        return this._queues[queueName].push(handler, highPriority);
    }

    /**
     * method is used to start the queue handling,
     *
     * @param initialValue to pass to the first callback in chain.
     * @returns a promise that all prepared queues has started to run.
     */
    public start(initialValue?: T): Q.Promise<T[]> {
        let pArray: Array<Q.Promise<T>> = [];

        if ( true === this._started ) {
            throw new Error("Queue can be started only once!");
        }

        this._started = true;
        this._initialValue = initialValue;
        for ( let q of this._queues ) {
            pArray.push(q.start(initialValue));
        }

        return Q.all(pArray);
    }
}
