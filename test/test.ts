"use strict";

import { CBQueue, CBQueueDict } from "../";
import { expect } from "chai";

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

    it("should run in the right sequance", (done) => {
        // TODO: Sequance test
        done();
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
