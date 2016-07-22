"use strict";

import { CBQueue, CBQueueDict } from "../";
import { expect } from "chai";

describe("CBQueue", () => {
    const cbq: CBQueue<void> = new CBQueue<void>();
    it("should be instanced", () => {
        expect(cbq).be.instanceOf(CBQueue);
    });

    it("should run callbacks", () => {
        let cbRun: boolean = false;

        expect(cbq.push).to.be.a("function");
        expect(cbq.push(() => {
            cbRun = true;
        })).be.instanceof(Promise);

        expect(cbq.start).to.be.a("function");
        cbq.start().then(() => {
            expect(cbRun).be.true;
        });
    });

    it("should run in the right sequance", () => {
        // TODO: Sequance test
    });
});

describe("CBQueueDict", () => {
    const cbqDict: CBQueueDict<void> = new CBQueueDict<void>();

    it("should be instanced", () => {
        expect(cbqDict).be.instanceOf(CBQueueDict);
    });

    // TODO: Running tests.
});
