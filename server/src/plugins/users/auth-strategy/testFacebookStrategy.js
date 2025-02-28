import assert from "assert";
import testMngr from "~/test/testManager";
import { verifyWeb } from "./StrategyUtils";
import Chance from "chance";

const profile = {
  username: "justin time",
  email: "justin.time@gmail.com",
  gender: "male",
  last_name: "Time",
  first_name: "justin"
};

describe("FacebookStrategy", function() {
  let models = testMngr.app.data.sequelize.models;
  before(async () => {
    await testMngr.start();
  });
  after(async () => {
    await testMngr.stop();
  });

  it("create a new user, register it", async () => {
    let res = await verifyWeb(models, null, profile);
    //console.log(res.err)
    assert(!res.err);
    assert(res.user);
    assert(!res.user.password);
    //console.log("verify again")
    profile.first_name = "Justine";
    res = await verifyWeb(models, null, profile);
    //console.log(res.err)
    assert(!res.err);
    assert(res.user);
    assert(!res.user.password);

    profile.id = require("uuid/v4")();
    res = await verifyWeb(models, null, profile);
    //console.log(res.err)
    assert(!res.err);
    assert(res.user);
    assert(!res.user.password);
    assert.equal(res.user.email, profile.email);
  });
});
