"use strict";

import { CBQueue, CBQueueDict } from "../";
import { use as chaiUse, expect } from "chai";
import * as Q from "q";

chaiUse(require("chai-as-promised"));

describe("CBQueue", () => {
    const cbq: CBQueue<void> = new CBQueue<void>();
    it("should be instanced", (done) => {
        expect(cbq).be.instanceOf(CBQueue);
        done();
    });

    it("should run callbacks", (done) => {
        let cbRun: boolean = false;

        expect(cbq.push).to.be.a("function");
        expect(cbq.push(() => {
            cbRun = true;
        })).be.instanceof(Promise);

        expect(cbq.start).to.be.a("function");
        cbq.start().then(() => {
            expect(cbRun).be.true;
        });
        done();
    });

    it("should run callbacks in the right priority", (done: () => void) => {
        let counter: number = 0;

        expect(cbq.push(() => {
            counter += 1;
            expect(counter).be.equal(1);
            return new Promise<void>((resolve, reject) => {
                Q.delay(5).then(() => resolve(undefined), (err) => reject(err));
            });
        }, false)).be.fulfilled;

        expect(cbq.push(() => {
            counter += 1;
            expect(counter).be.equal(5);
            done();
        }, false)).be.fulfilled;

        expect(cbq.push(() => {
            counter += 1;
            expect(counter).be.equal(2);
            return new Promise<void>((resolve, reject) => {
                Q.delay(5).then(() => resolve(undefined), (err) => reject(err));
            });
        }, true)).be.fulfilled;

        expect(cbq.push(() => {
            counter += 1;
            expect(counter).be.equal(4);
            return new Promise<void>((resolve, reject) => {
                Q.delay(5).then(() => resolve(undefined), (err) => reject(err));
            });
        }, false)).be.fulfilled;

        expect(cbq.push(() => {
            counter += 1;
            expect(counter).be.equal(3);
            return new Promise<void>((resolve, reject) => {
                Q.delay(5).then(() => resolve(undefined), (err) => reject(err));
            });
        }, true)).be.fulfilled;
   });
});

describe("CBQueueDict", () => {
    const cbqDict: CBQueueDict<void> = new CBQueueDict<void>();

    it("should be instanced", (done) => {
        expect(cbqDict).be.instanceOf(CBQueueDict);
        done();
    });

    // TODO: Running tests.
});
