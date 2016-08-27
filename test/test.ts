"use strict";

import { CBQueue, CBQueueDict } from "../";
import { should, use as chaiUse, expect } from "chai";
import * as Q from "q";
import { Subscription } from "rxjs";

chaiUse(require("chai-as-promised"));
should();

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

    it("should run callbacks in the right priority", (done: (error?: Error) => void) => {
        let counter: number = 0;

        Q.all([cbq.push(() => {
            counter += 1;
            expect(counter).be.equal(1);
            return new Promise<void>((resolve, reject) => {
                Q.delay(5).then(() => resolve(undefined), (err) => reject(err));
            });
        }, false),
        cbq.push(() => {
            counter += 1;
            expect(counter).be.equal(4);
        }, false),
        cbq.push(() => {
            counter += 1;
            expect(counter).be.equal(2);
            return new Promise<void>((resolve, reject) => {
                Q.delay(5).then(() => resolve(undefined), (err) => reject(err));
            });
        }, true),
        cbq.push(() => {
            counter += 1;
            expect(counter).be.equal(5);
            return new Promise<void>((resolve, reject) => {
                Q.delay(5).then(() => resolve(undefined), (err) => reject(err));
            });
        }, false),
        cbq.push(() => {
            counter += 1;
            expect(counter).be.equal(3);
            return new Promise<void>((resolve, reject) => {
                Q.delay(5).then(() => resolve(undefined), (err) => reject(err));
            });
        }, true),
        ]).then(() => {
            done();
        }).catch((err) => {
            console.log(err);
            done(err);
        });
    });

    it("should have a working busy$ observable", (done) => {
        let counter: number = 0;
        let busyCalls: number = 0;
        let unsubscribe = cbq.busy$.subscribe((state: Boolean) => {
            busyCalls += 1;
            switch ( busyCalls ) {
                case 1:
                    // Start off empty queue
                    expect(counter).be.equal(0);
                    expect(state).be.equal(false);
                    break;
                case 2:
                    // Should be called before CB resolved.
                    expect(counter).be.equal(0);
                    expect(state).be.equal(true);
                    break;
                case 3:
                    // Should be called after last CB resolved.
                    expect(counter).be.equal(5);
                    expect(state).be.equal(false);

                    unsubscribe.unsubscribe();
                    done();
                    break;
            }
        }, (err: Error) => done(err), () => {
            console.log("done");
        });

        Q.all([cbq.push(() => {
            counter += 1;
            expect(counter).be.equal(1);
            return new Promise<void>((resolve, reject) => {
                Q.delay(5).then(() => resolve(undefined), (err) => reject(err));
            });
        }, false),
        cbq.push(() => {
            counter += 1;
            expect(counter).be.equal(4);
        }, false),
        cbq.push(() => {
            counter += 1;
            expect(counter).be.equal(2);
            return new Promise<void>((resolve, reject) => {
                Q.delay(5).then(() => resolve(undefined), (err) => reject(err));
            });
        }, true),
        cbq.push(() => {
            counter += 1;
            expect(counter).be.equal(5);
            return new Promise<void>((resolve, reject) => {
                Q.delay(5).then(() => resolve(undefined), (err) => reject(err));
            });
        }, false),
        cbq.push(() => {
            counter += 1;
            expect(counter).be.equal(3);
            return new Promise<void>((resolve, reject) => {
                Q.delay(5).then(() => resolve(undefined), (err) => reject(err));
            });
        }, true),
        ]).catch((err) => {
            unsubscribe.unsubscribe();
            console.log(err);
            done(err);
        });

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
        expect(cbqDict.all((queueName: string) => {
            counter += 1;
        })).to.be.fulfilled;

        expect(cbqDict.start).to.be.a("function");
        cbqDict.start().then(() => {
            expect(counter).to.be.equal(2);
            done();
        });
    });

    it("isBusy to be working", (done) => {
        const cbqDict: CBQueueDict<void> = new CBQueueDict<void>();
        let counter: number = 0;

        expect(cbqDict.push("ObsA", () => {
            counter += 1;
            cbqDict.isBusy("ObsA").should.eventually.equal(true);
        })).be.fulfilled;

        expect(cbqDict.push("ObsB", () => {
            counter += 1;
            cbqDict.isBusy("ObsB").should.eventually.equal(true);
        })).be.instanceof(Promise);

        expect(cbqDict.push("ObsC", () => {
            counter += 1;
            cbqDict.isBusy("ObsC").should.eventually.equal(true);
        })).be.instanceof(Promise);

        expect(cbqDict.isBusy).to.be.a("function");
        cbqDict.isBusy("ObsA").should.eventually.equal(false);
        cbqDict.isBusy("ObsB").should.eventually.equal(false);
        cbqDict.isBusy("ObsC").should.eventually.equal(false);

        expect(cbqDict.start).to.be.a("function");
        cbqDict.start().then(() => {
            expect(counter).to.be.equal(3);
            done();
        }).catch((err: Error) => {
            done(err);
        });
    });
});
