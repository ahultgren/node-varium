/* global it, describe */

const path = require("path");
const chai = require("chai");
const varium = require(".");

const expect = chai.expect;

const reader = varium.reader;

chai.should();

describe("Loader", () => {
  it("should load an existing file", () => {
    varium({
      manifestPath: path.resolve(__dirname, "../test/validManifest.txt"),
    });
  });

  it("should fail to load a non-existing file", () => {
    expect(varium.bind({
      manifestPath: "test/validManifest-fail.txt"
    }))
      .to.throw();
  });
});

describe("Reader", () => {
  it("shoud parse all valid formats", () => {
    reader({}, {
      STRING: "",
      INT: "1",
      FLOAT: "1.1",
      BOOL: "true",
    }, `
STRING:String
String_1:String|
String2:String|asd
STRING3:String|1
STRING4:String|1#Comment
STRING5:String|"#notComment"

INT : Int
INT2 : Int |
INT3 : Int | 1
INT4 : Int | "1"

# "Heading"

FLOAT: Float # Aka any number
FLOAT1: Float| 0.1
FLOAT2: Float |0.1
FLOAT3: Float |"0.1"
BOOL       : Bool
LONG_BOOL2 : Bool   |
BOOL3      : Bool   | true
BOOL4      : Bool   | "false"
`);
  });

  it("should expose the correct value", () => {
    const manifest = `
STRING_REQUIRED : String
STRING_OPTIONAL : String |
STRING_DEFAULT : String | def
`;
    const noValues = reader({}, {
      STRING_REQUIRED: "str",
    }, manifest);
    const withValues = reader({}, {
      STRING_REQUIRED: "str",
      STRING_OPTIONAL: "str",
      STRING_DEFAULT: "str",
    }, manifest);

    noValues.get("STRING_REQUIRED").should.equal("str");
    noValues.get("STRING_OPTIONAL").should.equal("");
    noValues.get("STRING_DEFAULT").should.equal("def");
    withValues.get("STRING_OPTIONAL").should.equal("str");
    withValues.get("STRING_DEFAULT").should.equal("str");
  });

  it("should throw when accesing undeclared vars", () => {
    const config = reader({}, {}, "");
    expect(config.get.bind(null, "NON_EXISTING")).to.throw();
  });

  it("should reject duplicate definitions", () => {
    expect(reader.bind(null, {}, {}, "TEST : String\nTEST : Int"))
      .to.throw();
  });

  it("should hadle EOF", () => {
    reader({}, { STRING: "" }, "STRING:String");
    reader({}, {}, "STRING:String|");
    reader({}, {}, "STRING:String|asd");
    reader({}, {}, "STRING:String|asd#");
    reader({}, {}, "STRING:String|asd#asd");
  });

  it("should handle complex default values", () => {
    const config = reader({}, {}, `
      STR1 : String | A long time ago
      STR2 : String | "In a galaxy"
      STR3 : String | "full of # signs"
      STR4 : String | "and quoted \\"quotes\\""
      STR5 : String | or unquoted "quotes"?
    `);

    config.get("STR1").should.equal("A long time ago");
    config.get("STR2").should.equal("In a galaxy");
    config.get("STR3").should.equal("full of # signs");
    config.get("STR4").should.equal("and quoted \"quotes\"");
    config.get("STR5").should.equal("or unquoted \"quotes\"?");
  });
});
