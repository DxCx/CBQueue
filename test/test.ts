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
            done();
        });
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
    it("should be instanced", (done) => {
        const cbqDict: CBQueueDict<void> = new CBQueueDict<void>();

        expect(cbqDict).be.instanceOf(CBQueueDict);
        done();
    });

    it("should run callbacks", (done) => {
        const cbqDict: CBQueueDict<void> = new CBQueueDict<void>();

        let cbRun: Array<boolean> = [false, false];

        expect(cbqDict.push).to.be.a("function");
        expect(cbqDict.push("ObsA", () => {
            cbRun[0] = true;
        })).be.fulfilled;

        expect(cbqDict.push("ObsB", () => {
            cbRun[1] = true;
        })).be.instanceof(Promise);

        expect(cbqDict.start).to.be.a("function");
        cbqDict.start().then(() => {
            expect(cbRun[0]).be.true;
            expect(cbRun[1]).be.true;
            done();
        });
    });

    it("should remove queues", (done) => {
        const cbqDict: CBQueueDict<void> = new CBQueueDict<void>();

        let cbRun: Array<boolean> = [false, false];

        expect(cbqDict.push("ObsA", () => {
            cbRun[0] = true;
        })).be.fulfilled;

        expect(cbqDict.push("ObsB", () => {
            cbRun[1] = true;
        })).be.instanceof(Promise);

        expect(cbqDict.remove).to.be.a("function");
        expect(cbqDict.remove("ObsB")).to.be.fulfilled;

        cbqDict.start().then(() => {
            expect(cbRun[0]).be.true;
            expect(cbRun[1]).be.false;
            done();
        });
    });

    it("all to be working", (done) => {
        const cbqDict: CBQueueDict<void> = new CBQueueDict<void>();
        let counter: number = 0;

        expect(cbqDict.push("ObsA", () => {
        })).be.fulfilled;

        expect(cbqDict.push("ObsB", () => {
        })).be.instanceof(Promise);

        expect(cbqDict.push("ObsC", () => {
        })).be.instanceof(Promise);

        expect(cbqDict.remove("ObsB")).to.be.fulfilled;

        expect(cbqDict.all).to.be.a("function");
        expect(cbqDict.all(() => {
            counter += 1;
        })).to.be.fulfilled;

        expect(cbqDict.start).to.be.a("function");
        cbqDict.start().then(() => {
            expect(counter).to.be.equal(2);
            done();
        });
    });
});
