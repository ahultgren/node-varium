const chai = require("chai");
const varium = require("../.");

const expect = chai.expect;

const validEnv = {
  REQUIRED_URL: "http://example.com",
  POSITION: 1,
};

describe("Running the function", () => {
  it("should validate and create the expected config object", () => {
    const config = varium(validEnv, "test/validManifest.txt");

    expect(config.get('REQUIRED_URL')).to.equal(validEnv.REQUIRED_URL);
    expect(config.get('POSITION')).to.equal(validEnv.POSITION);
    expect(config.get('ENABLE_STUFF')).to.equal(false);
    expect(config.get('LIST_OF_THINGS')).to.be.an("array");
  });
});
