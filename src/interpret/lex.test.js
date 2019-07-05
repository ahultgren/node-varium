/* eslint max-len: 0 */
/* global it, describe */

const chai = require("chai");
const lex = require("./lex");

const expect = chai.expect;
chai.should();

describe("Lex", () => {
  it("should return empty list on empty string", () => {
    lex("").should.eql([]);
  });

  it("should ignore whitespace", () => {
    lex(" ").should.eql([]);
    lex("  ").should.eql([]);
  });

  it("should parse the declaration name & type", () => {
    const res = [
      { type: "DeclarationName", value: "THING" },
      { type: "DeclarationType", value: "String" }
    ];

    lex("THING : String").should.eql(res);
    lex("THING:String").should.eql(res);
    lex(" THING:String ").should.eql(res);
  });

  it("should parse an empty/optional default", () => {
    const res = lex("THING : String |");

    expect(res).to.have.deep.property("[2].type", "DeclarationDefault");
    expect(res).to.have.deep.property("[2].value", "");
  });

  it("should parse a default value", () => {
    expect(lex("THING : String | Value")).to.have.deep.property("[2].value", "Value");
    expect(lex("THING : String |Value")).to.have.deep.property("[2].value", "Value");
    expect(lex("THING : String | Value ")).to.have.deep.property("[2].value", "Value");
    expect(lex("THING : String | Ö value")).to.have.deep.property("[2].value", "Ö value");
    expect(lex("THING : String|http://example.com?mjau ")).to.have.deep.property("[2].value", "http://example.com?mjau");
  });

  it("should parse a quoted default value", () => {
    expect(lex("THING : String | \"Value\"")).to.have.deep.property("[2].value", "Value");
    expect(lex("THING : String | \"Value # hash\"")).to.have.deep.property("[2].value", "Value # hash");
    expect(lex("THING : String | \"Value\nnewline\"")).to.have.deep.property("[2].value", "Value\nnewline");
    expect(lex("THING : String | \"Value\nnewline\" #A comment")).to.have.deep.property("[2].value", "Value\nnewline");
    expect(lex("THING : String | \" spaces \"")).to.have.deep.property("[2].value", " spaces ");
  });

  it("should parse escaped chars in a quoted default value", () => {
    expect(lex("THING : String | \"Value\\\"quote\"")).to.have.deep.property("[2].value", "Value\"quote");
    expect(lex("THING : String | \"Backslash: \\\\\"")).to.have.deep.property("[2].value", "Backslash: \\");
  });

  it("should parse quotes in the middle of a default as chars", () => {
    expect(lex("THING : String | Value\"quote\"")).to.have.deep.property("[2].value", "Value\"quote\"");
  });

  it("should parse a comment", () => {
    expect(() => lex("THING : String | Value # Comment")).not.to.throw();
    expect(() => lex("THING : String | Value#Anöthing goes|in a comment!#")).not.to.throw();
    expect(() => lex("THING : String # Comment")).not.to.throw();
  });

  it("should parse multiple declarations", () => {
    const res1 = [
      { type: "DeclarationName", value: "ONE" },
      { type: "DeclarationType", value: "String" },
      { type: "DeclarationName", value: "TWO" },
      { type: "DeclarationType", value: "String" }
    ];

    const res2 = [
      { type: "DeclarationName", value: "ONE" },
      { type: "DeclarationType", value: "String" },
      { type: "DeclarationDefault", value: "Default" },
      { type: "DeclarationName", value: "TWO" },
      { type: "DeclarationType", value: "String" },
      { type: "DeclarationDefault", value: "" }
    ];

    lex("ONE : String\nTWO : String").should.eql(res1);
    lex("ONE : String # Comment \nTWO : String").should.eql(res1);
    lex("ONE : String | Default # Comment \n\nTWO : String | #Comment\n").should.eql(res2);
  });

  it("should fail on invalid name", () => {
    expect(() => lex("THINGö : String")).to.throw("Unexpected ö in DeclarationName");
    expect(() => lex("-THING : String")).to.throw("Unexpected -");
    expect(() => lex("TH'ING : String")).to.throw("Unexpected ' in DeclarationName");
    expect(() => lex(": String")).to.throw("Unexpected :");
  });

  it("should fail with only name", () => {
    expect(() => lex("String")).to.throw("Unexpected \n in DeclarationName");
  });
});
