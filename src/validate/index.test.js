/* global it, describe */

const validator = require(".");
const chai = require("chai");

const expect = chai.expect;

chai.should();

describe("Validate", () => {

  describe("when required", () => {
    it("should return error if value is missing", () => {
      validator(null, [{ name: "TEST", type: "String" }], {})
        .should.deep.equal([{ error$: "Env var \"TEST\" requires a value." }]);
    });

    it("should return error if type doesn't exist", () => {
      validator(null, [{ name: "TEST", type: "Test" }], {})
        .should.deep.equal([{ error$: "The type Test for env var \"TEST\" does not exist.\nUnable to offer any suggestions." }]);
    });

    it("should return suggestions if type is close to a known type", () => {
      validator(null, [{ name: "TEST", type: "int" }], {})
        .should.deep.equal([{ error$: "The type int for env var \"TEST\" does not exist.\nMaybe you meant Int?" }]);

      validator(null, [{ name: "TEST", type: "bint" }], {})
        .should.deep.equal([{ error$: "The type bint for env var \"TEST\" does not exist.\nMaybe you meant Int?" }]);

      validator(null, [{ name: "TEST", type: "sloat" }], {})
        .should.deep.equal([{ error$: "The type sloat for env var \"TEST\" does not exist.\nMaybe you meant Float?" }]);
    });

    it("should return as many results as definitions", () => {
      validator(null, [{ name: "TEST" }, { name: "TEST2" }], {}).length
        .should.equal(2);
    });
  });

  describe("when optional", () => {
    it("should not return error if value is missing", () => {
      validator(null, [{ name: "TEST", type: "String", default: "" }], {})
        .should.deep.equal([{ TEST: "" }]);
    });

    it("should return error if type doesn't exist", () => {
      validator(null, [{ name: "TEST", type: "Test" }], {})
        .should.deep.equal([{ error$: "The type Test for env var \"TEST\" does not exist.\nUnable to offer any suggestions." }]);
    });

    it("should return as many results as definitions", () => {
      validator(null, [{ name: "TEST", type: "String", default: "" }, { name: "TEST2" }], {}).length
        .should.equal(2);
    });
  });

  describe("custom", () => {
    it("should use custom validator", () => {
      validator({
        FortyTwo: (value, def) => value ? 42 : def ? 43 : 0,
      }, [{ name: "TEST", type: "FortyTwo", default: "1" }], {})
        .should.deep.equal([{ TEST: 43 }]);
    });
    it("should overwrite build-in validators", () => {
      validator({
        String: () => 42,
      }, [{ name: "TEST", type: "String", default: "" }], {})
        .should.deep.equal([{ TEST: 42 }]);
    });
  });

  describe("built-in validator", () => {

    describe("String", () => {
      const String = validator.validators.String;

      it("should return value if value is provided", () => {
        String("test", "").should.equal("test");
        String("test", undefined).should.equal("test");
        String("test", "def").should.equal("test");
      });

      it("should return default if no value is provided", () => {
        String("", "").should.equal("");
        String(undefined, "").should.equal("");
        String("", "def").should.equal("def");
      });
    });

    describe("Bool", () => {
      const Bool = validator.validators.Bool;

      it("should return value if value is provided and valid", () => {
        Bool("false", "").should.equal(false);
        Bool("false", "true").should.equal(false);
        Bool("true", undefined).should.equal(true);
        Bool("true", "false").should.equal(true);
      });

      it("should return default if no value is provided", () => {
        chai.expect(Bool("", "")).to.equal(undefined);
        Bool("", "true").should.equal(true);
        Bool(undefined, "false").should.equal(false);
      });

      it("should return undefined if neither value nor default is provided", () => {
        expect(Bool("", "")).to.equal(undefined);
        expect(Bool("", undefined)).to.equal(undefined);
        expect(Bool(undefined, "")).to.equal(undefined);
      });


      it("should throw if default is invalid", () => {
        expect(Bool.bind(null, "true", "asd")).to.throw();
        expect(Bool.bind(null, undefined, "asd")).to.throw();
        expect(Bool.bind(null, "", "1")).to.throw();
      });

      it("should throw if value is invalid", () => {
        expect(Bool.bind(null, "asd", "")).to.throw();
        expect(Bool.bind(null, "asd", "true")).to.throw();
        expect(Bool.bind(null, "1", undefined)).to.throw();
      });
    });

    describe("Int", () => {
      const Int = validator.validators.Int;

      it("should return value if value is provided and valid", () => {
        Int("1", "").should.equal(1);
        Int("1", undefined).should.equal(1);
        Int("0", "2").should.equal(0);
        Int("-10000", "999").should.equal(-10000);
      });

      it("should return default if no value is provided", () => {
        Int("", "1").should.equal(1);
        Int(undefined, "0").should.equal(0);
        Int("", "-999").should.equal(-999);
      });

      it("should return undefined if neither value nor default is provided", () => {
        expect(Int("", "")).to.equal(undefined);
        expect(Int("", undefined)).to.equal(undefined);
        expect(Int(undefined, "")).to.equal(undefined);
      });

      it("should throw if default is invalid", () => {
        expect(Int.bind(null, "1", "asd")).to.throw();
        expect(Int.bind(null, "", "1.1")).to.throw();
        expect(Int.bind(null, undefined, "true")).to.throw();
      });

      it("should throw if value is invalid", () => {
        expect(Int.bind(null, "asd", "1")).to.throw();
        expect(Int.bind(null, "1.1", "")).to.throw();
        expect(Int.bind(null, "true", undefined)).to.throw();
      });
    });

    describe("Float", () => {
      const Float = validator.validators.Float;

      it("should return value if value is provided and valid", () => {
        Float("1.1", "").should.equal(1.1);
        Float(".1", undefined).should.equal(0.1);
        Float("0", "2").should.equal(0);
        Float("-10000.3", "999.9").should.equal(-10000.3);
      });

      it("should return default if no value is provided", () => {
        Float("", "1.1").should.equal(1.1);
        Float(undefined, ".1").should.equal(0.1);
        Float("", "0").should.equal(0);
        Float("", "-10000.3").should.equal(-10000.3);
      });

      it("should return undefined if neither value nor default is provided", () => {
        expect(Float("", "")).to.equal(undefined);
        expect(Float("", undefined)).to.equal(undefined);
        expect(Float(undefined, "")).to.equal(undefined);
      });

      it("should throw if default is invalid", () => {
        expect(Float.bind(null, "1", "asd")).to.throw();
        expect(Float.bind(null, "", "1.1.1")).to.throw();
        expect(Float.bind(null, undefined, "true")).to.throw();
      });

      it("should throw if value is invalid", () => {
        expect(Float.bind(null, "asd", "1")).to.throw();
        expect(Float.bind(null, "1.1.1", "")).to.throw();
        expect(Float.bind(null, "true", undefined)).to.throw();
      });
    });

    describe("Json", () => {
      const Json = validator.validators.Json;

      it("should return value if value is provided and valid", () => {
        Json("{\"asd\":1}", "").should.deep.equal({ asd: 1 });
        Json("\"asd\"", undefined).should.equal("asd");
        Json("{\"asd\":1}", "{}").should.deep.equal({ asd: 1 });
        expect(Json("null", "")).to.equal(null);
      });

      it("should return default if no value is provided", () => {
        Json("", "{\"asd\":1}", "").should.deep.equal({ asd: 1 });
        Json(undefined, "\"asd\"").should.equal("asd");
        expect(Json("", "null")).to.equal(null);
      });

      it("should return undefined if neither value nor default is provided", () => {
        expect(Json("", "")).to.equal(undefined);
        expect(Json("", undefined)).to.equal(undefined);
        expect(Json(undefined, "")).to.equal(undefined);
      });

      it("should throw if default is invalid", () => {
        expect(Json.bind(null, "{}", "asd")).to.throw();
        expect(Json.bind(null, undefined, "{")).to.throw();
      });

      it("should throw if value is invalid", () => {
        expect(Json.bind(null, "asd", "")).to.throw();
        expect(Json.bind(null, "{", undefined)).to.throw();
      });

    });

  });

});
