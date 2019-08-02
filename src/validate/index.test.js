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
        FortyTwo: () => 42,
      }, [{ name: "TEST", type: "FortyTwo", default: "1" }], {})
        .should.deep.equal([{ TEST: 42 }]);
    });

    it("should overwrite build-in validators", () => {
      validator({
        String: () => 42,
      }, [{ name: "TEST", type: "String", default: "" }], {})
        .should.deep.equal([{ TEST: 42 }]);
    });
  });

  describe("built-in validator", () => {
    const typeTest = type => (value, def) => validator({}, [{
      name: "TEST",
      type,
      default: def,
    }], value ? {
      TEST: value,
    } : {})[0];

    describe("String", () => {
      const String = typeTest("String");

      it("should return value if value is provided", () => {
        String("test", "").TEST.should.equal("test");
        String("test", undefined).TEST.should.equal("test");
        String("test", "def").TEST.should.equal("test");
      });

      it("should return default if no value is provided", () => {
        String("", "").TEST.should.equal("");
        String(undefined, "").TEST.should.equal("");
        String("", "def").TEST.should.equal("def");
      });
    });

    describe("Bool", () => {
      const Bool = typeTest("Bool");

      it("should return value if value is provided and valid", () => {
        Bool("false", "").TEST.should.equal(false);
        Bool("false", "true").TEST.should.equal(false);
        Bool("true", undefined).TEST.should.equal(true);
        Bool("true", "false").TEST.should.equal(true);
      });

      it("should return default if no value is provided", () => {
        expect(Bool("", "").TEST).to.equal(undefined);
        Bool("", "true").TEST.should.equal(true);
        Bool(undefined, "false").TEST.should.equal(false);
      });

      it("should return undefined if neither value nor default is provided", () => {
        expect(Bool("", "").TEST).to.equal(undefined);
        expect(Bool("", undefined).TEST).to.equal(undefined);
        expect(Bool(undefined, "").TEST).to.equal(undefined);
      });


      it("should throw if default is invalid", () => {
        const errorMsg = "Default value for \"TEST\" is invalid: value is not a valid Bool";
        Bool("true", "asd").error$.should.equal(errorMsg);
        Bool(undefined, "asd").error$.should.equal(errorMsg);
        Bool("", "1").error$.should.equal(errorMsg);
      });

      it("should throw if value is invalid", () => {
        const errorMsg = "Value for \"TEST\" is invalid: value is not a valid Bool";
        Bool("asd", "").error$.should.equal(errorMsg);
        Bool("asd", "true").error$.should.equal(errorMsg);
        Bool("1", undefined).error$.should.equal(errorMsg);
      });
    });

    describe("Int", () => {
      const Int = typeTest("Int");

      it("should return value if value is provided and valid", () => {
        Int("1", "").TEST.should.equal(1);
        Int("1", undefined).TEST.should.equal(1);
        Int("0", "2").TEST.should.equal(0);
        Int("-10000", "999").TEST.should.equal(-10000);
      });

      it("should return default if no value is provided", () => {
        Int("", "1").TEST.should.equal(1);
        Int(undefined, "0").TEST.should.equal(0);
        Int("", "-999").TEST.should.equal(-999);
      });

      it("should return undefined if neither value nor default is provided", () => {
        expect(Int("", "").TEST).to.equal(undefined);
        expect(Int("", undefined).TEST).to.equal(undefined);
        expect(Int(undefined, "").TEST).to.equal(undefined);
      });

      it("should throw if default is invalid", () => {
        const errorMsg = "Default value for \"TEST\" is invalid: value is not a valid Int";
        Int("1", "asd").error$.should.equal(errorMsg);
        Int("", "1.1").error$.should.equal(errorMsg);
        Int(undefined, "true").error$.should.equal(errorMsg);
      });

      it("should throw if value is invalid", () => {
        const errorMsg = "Value for \"TEST\" is invalid: value is not a valid Int";
        Int("asd", "1").error$.should.equal(errorMsg);
        Int("1.1", "").error$.should.equal(errorMsg);
        Int("true", undefined).error$.should.equal(errorMsg);
      });
    });

    describe("Float", () => {
      const Float = typeTest("Float");

      it("should return value if value is provided and valid", () => {
        Float("1.1", "").TEST.should.equal(1.1);
        Float(".1", undefined).TEST.should.equal(0.1);
        Float("0", "2").TEST.should.equal(0);
        Float("-10000.3", "999.9").TEST.should.equal(-10000.3);
      });

      it("should return default if no value is provided", () => {
        Float("", "1.1").TEST.should.equal(1.1);
        Float(undefined, ".1").TEST.should.equal(0.1);
        Float("", "0").TEST.should.equal(0);
        Float("", "-10000.3").TEST.should.equal(-10000.3);
      });

      it("should return undefined if neither value nor default is provided", () => {
        expect(Float("", "").TEST).to.equal(undefined);
        expect(Float("", undefined).TEST).to.equal(undefined);
        expect(Float(undefined, "").TEST).to.equal(undefined);
      });

      it("should throw if default is invalid", () => {
        const errorMsg = "Default value for \"TEST\" is invalid: value is not a valid Float";
        Float("1", "asd").error$.should.equal(errorMsg);
        Float("", "1.1.1").error$.should.equal(errorMsg);
        Float(undefined, "true").error$.should.equal(errorMsg);
      });

      it("should throw if value is invalid", () => {
        const errorMsg = "Value for \"TEST\" is invalid: value is not a valid Float";
        Float("asd", "1").error$.should.equal(errorMsg);
        Float("1.1.1", "").error$.should.equal(errorMsg);
        Float("true", undefined).error$.should.equal(errorMsg);
      });
    });

    describe("Json", () => {
      const Json = typeTest("Json");

      it("should return value if value is provided and valid", () => {
        Json("{\"asd\":1}", "").TEST.should.deep.equal({ asd: 1 });
        Json("\"asd\"", undefined).TEST.should.equal("asd");
        Json("{\"asd\":1}", "{}").TEST.should.deep.equal({ asd: 1 });
        expect(Json("null", "").TEST).to.equal(null);
      });

      it("should return default if no value is provided", () => {
        Json("", "{\"asd\":1}", "").TEST.should.deep.equal({ asd: 1 });
        Json(undefined, "\"asd\"").TEST.should.equal("asd");
        expect(Json("", "null").TEST).to.equal(null);
      });

      it("should return undefined if neither value nor default is provided", () => {
        expect(Json("", "").TEST).to.equal(undefined);
        expect(Json("", undefined).TEST).to.equal(undefined);
        expect(Json(undefined, "").TEST).to.equal(undefined);
      });

      it("should throw if default is invalid", () => {
        const errorMsg = "Default value for \"TEST\" is invalid: value is not a valid Json";
        Json("{}", "asd").error$.should.equal(errorMsg);
        Json(undefined, "{").error$.should.equal(errorMsg);
      });

      it("should throw if value is invalid", () => {
        const errorMsg = "Value for \"TEST\" is invalid: value is not a valid Json";
        Json("asd", "").error$.should.equal(errorMsg);
        Json("{", undefined).error$.should.equal(errorMsg);
      });
    });

  });

});
