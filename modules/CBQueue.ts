"use strict";

import * as Q from "q";

export class CBQueue<T> {
    private _callbackQueue: Q.Promise<T>;
    private _priorityItems: Array<(value?: T) => Q.Promise<T>>;
    private _started: boolean = false;
    private _initialD: Q.Deferred<T>;

    constructor() {
        this._initialD = Q.defer<T>();
        this._callbackQueue = this._initialD.promise;
        this._priorityItems = [];
    }

    /**
     * method is used to start the queue handling,
     *
     * @param initialValue to pass to the first callback in chain.
     * @returns a promise that determinates the current callback has ran.
     */
    public start(initialValue?: T): Promise<T> {
        if ( true === this._started ) {
            throw new Error("Queue can be started only once!");
        }

        this._started = true;
        this._callNext(this._initialD, initialValue);
        return new Promise<T>((resolve, reject) => {
            resolve(this._initialD.promise);
        });
    }

    /**
     * method is used to push a new callback to the queue,
     *
     * @param handler callback to push.
     * @param highPriority setting to true will cause the callback to be called
     * just right after the currently running one is done.
     * low priority items will be appended to the end.
     * @returns a promise that determinates the current callback has ran.
     */
    public push(handler: () => T | Promise<T>,
                highPriority: boolean = false): Promise<T> {
        /* Prepare our decorated handler */
        let d: Q.Deferred<T> = Q.defer<T>();
        let custHandler: (value?: T) => Q.Promise<T> = this._decorateHandler(d, handler);

        if ( false === this._callbackQueue.isPending() ) {
            /* Queue is currently empty, starting a new one */
            this._callbackQueue = custHandler();
        } else if ( false === highPriority ) {
            /*
             * Queue is running, but this is just a regular callback,
             * Chaining to main queue.
             */
            this._callbackQueue = this._callbackQueue
            .catch((err) => {/*Ignore*/})
            .then(() => { return custHandler(); });
        } else {
            /**
             * Queue is running, and this is high priority callback,
             * Chaining to high priority items.
             */
            this._priorityItems.push(custHandler);
            this._callbackQueue = d.promise;
        }

        /**
         * returns a promise for the current item under process.
         */
        return this._qToPromise(this._callbackQueue);
    }

    /**
     * Private helper used to decorate the user callback
     *
     * @param d a deferred object used to signal the result.
     * @param handler handler to decorate
     * @returns a promise that will be resolved once this block is done.
     */
    private _decorateHandler(d: Q.Deferred<T>, handler: (value?: T) => T | Promise<T>): (value?: T) => Q.Promise<T> {
        return (value?: T): Q.Promise<T> => {
            try {
                /*
                 * Initially, execute original callback,
                 * so we can retrieve the value (or a promise for a value)
                 */
                let rawRetValue: T | Promise<T> = handler();
                let retPromise: Promise<T>;

                if ( undefined === (rawRetValue as Promise<T>).then ) {
                    /* We got a value, convert to promise for that value */
                    retPromise = Promise.resolve<T>(rawRetValue as T);
                } else {
                    /* We got a promise, just use it. */
                    retPromise = rawRetValue as Promise<T>;
                }

                /*
                 * Once the handler is done,
                 * call the next one (Or resolve current)
                 */
                retPromise.then((nextValue?: T) => {
                    this._callNext(d, nextValue);
                }, d.reject);
            } catch (e) {
                d.reject(e);
            }
            return d.promise;
        };
    }

    private _qToPromise(p: Q.Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            resolve(p);
        });
    }

    /**
     * Private helper used to determinate and call next item
     *
     * @param d a deferred object used to signal the result.
     * @param value optional value to pass to the next callback.
     */
    private _callNext(d: Q.Deferred<T>, value?: T): void {
        if ( this._priorityItems.length === 0 ) {
            d.resolve(value);
        } else {
            d.resolve(this._priorityItems.shift()(value));
        }
    }
}
